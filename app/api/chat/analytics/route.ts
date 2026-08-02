import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { authenticateToken, requireAdmin } from '@/app/api/_lib/auth';
import { ChatAnalyticsEvent } from '@/src/models/ChatAnalyticsEvent';
import { ChatConversation } from '@/src/models/ChatConversation';
import { Product } from '@/src/models/Product';
import { GroundingViolation } from '@/src/models/GroundingViolation';
import { ChatFeedback } from '@/src/models/ChatFeedback';

/**
 * GET /api/chat/analytics  (Admin only)
 *
 * Thesis analytics. Two families of metric:
 *
 *  Usage      — interactions, most searched models, most requested categories,
 *               most recommended products, intent breakdown, engagement.
 *  Evaluation — hallucination rate (grounding violations ÷ generated turns),
 *               answer-tier distribution, knowledge grounding coverage,
 *               clarification rate, latency and human satisfaction.
 *
 * The evaluation block is the measurement instrument for the project's central
 * claim; it is computed entirely from MongoDB and needs no external tooling.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateToken(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: 401 });
    }
    const adminCheck = requireAdmin(auth.user!);
    if (!adminCheck.success) {
      return NextResponse.json({ message: adminCheck.message }, { status: 403 });
    }

    await connectToDatabase();

    const [
      totalInteractions,
      totalConversations,
      aiGeneratedCount,
      topModels,
      topCategories,
      topProductsRaw,
      intentBreakdown,
      tierBreakdown,
      violationBreakdown,
      violatingTurns,
      knowledgeGroundedTurns,
      clarificationTurns,
      latencyStats,
      feedbackBreakdown,
      feedbackByTier,
    ] = await Promise.all([
      ChatAnalyticsEvent.countDocuments(),
      ChatConversation.countDocuments(),
      ChatAnalyticsEvent.countDocuments({ aiGenerated: true }),
      ChatAnalyticsEvent.aggregate([
        { $match: { motorcycleLabel: { $ne: null } } },
        { $group: { _id: '$motorcycleLabel', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ChatAnalyticsEvent.aggregate([
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ChatAnalyticsEvent.aggregate([
        { $unwind: '$recommendedProducts' },
        { $group: { _id: '$recommendedProducts', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ChatAnalyticsEvent.aggregate([
        { $group: { _id: '$intent', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // ── Evaluation metrics ────────────────────────────────────────────
      ChatAnalyticsEvent.aggregate([
        { $group: { _id: '$answerTier', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      GroundingViolation.aggregate([
        { $group: { _id: '$violationType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Distinct turns that breached INV-G at least once (the numerator of the
      // hallucination rate — a turn with 3 violations still counts once).
      GroundingViolation.distinct('turnId').then((ids: any[]) => ids.length),
      ChatAnalyticsEvent.countDocuments({ 'knowledgeRefs.0': { $exists: true } }),
      ChatAnalyticsEvent.countDocuments({ intent: { $ne: 'motorcycle_profile' }, answerTier: 0, recommendedProducts: { $size: 0 } }),
      ChatAnalyticsEvent.aggregate([
        {
          $group: {
            _id: null,
            avgLatencyMs: { $avg: '$latencyMs' },
            maxLatencyMs: { $max: '$latencyMs' },
            avgConfidence: { $avg: '$nluConfidence' },
          },
        },
      ]),
      ChatFeedback.aggregate([
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
      ChatFeedback.aggregate([
        {
          $group: {
            _id: '$answerTier',
            positive: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
            negative: { $sum: { $cond: [{ $eq: ['$rating', -1] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Resolve recommended product names.
    const productIds = topProductsRaw.map((p: any) => p._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name brand')
      .lean();
    const productMap = new Map(products.map((p: any) => [String(p._id), p]));
    const topProducts = topProductsRaw.map((p: any) => ({
      productId: String(p._id),
      name: productMap.get(String(p._id))?.name || 'Unknown product',
      brand: productMap.get(String(p._id))?.brand || '',
      recommendations: p.count,
    }));

    const avgMessagesPerConversation =
      totalConversations > 0 ? +(totalInteractions / totalConversations).toFixed(2) : 0;

    const tierMap = new Map(tierBreakdown.map((t: any) => [t._id ?? 0, t.count]));
    const tier0 = tierMap.get(0) || 0;
    const tier1 = tierMap.get(1) || 0;
    const tier2 = tierMap.get(2) || 0;

    // Hallucination rate is scoped to turns where generation actually ran —
    // deterministic (Tier 0) turns cannot hallucinate by construction.
    const generatedTurns = tier1 + tier2;
    const hallucinationRate =
      generatedTurns > 0 ? +(violatingTurns / generatedTurns).toFixed(4) : 0;
    const verificationPassRate =
      generatedTurns > 0 ? +(tier2 / generatedTurns).toFixed(4) : 0;

    const positive = feedbackBreakdown.find((f: any) => f._id === 1)?.count || 0;
    const negative = feedbackBreakdown.find((f: any) => f._id === -1)?.count || 0;
    const totalFeedback = positive + negative;

    const latency = latencyStats[0] || {};

    return NextResponse.json({
      message: 'Chat analytics retrieved successfully',
      data: {
        totalInteractions,
        totalConversations,
        avgMessagesPerConversation,
        aiGeneratedCount,
        ruleBasedCount: totalInteractions - aiGeneratedCount,
        mostSearchedModels: topModels.map((m: any) => ({ model: m._id, count: m.count })),
        mostRequestedCategories: topCategories.map((c: any) => ({ category: c._id, count: c.count })),
        mostRecommendedProducts: topProducts,
        intentBreakdown: intentBreakdown.map((i: any) => ({ intent: i._id, count: i.count })),

        // Evaluation framework — the thesis measurement block.
        evaluation: {
          answerTiers: {
            tier0_deterministic: tier0,
            tier1_verificationFailed: tier1,
            tier2_verifiedLlm: tier2,
          },
          generatedTurns,
          violatingTurns,
          /** Turns breaching INV-G ÷ turns where generation ran. Target ≤ 0.01. */
          hallucinationRate,
          verificationPassRate,
          violationsByType: violationBreakdown.map((v: any) => ({
            type: v._id,
            count: v.count,
          })),
          /** Share of turns answered from a curated knowledge document. */
          knowledgeGroundedTurns,
          knowledgeGroundingRate:
            totalInteractions > 0
              ? +(knowledgeGroundedTurns / totalInteractions).toFixed(4)
              : 0,
          clarificationTurns,
          avgNluConfidence: latency.avgConfidence ? +latency.avgConfidence.toFixed(3) : 0,
          avgLatencyMs: latency.avgLatencyMs ? Math.round(latency.avgLatencyMs) : 0,
          maxLatencyMs: latency.maxLatencyMs || 0,
        },

        feedback: {
          positive,
          negative,
          total: totalFeedback,
          satisfactionRate: totalFeedback > 0 ? +(positive / totalFeedback).toFixed(4) : 0,
          byAnswerTier: feedbackByTier.map((f: any) => ({
            answerTier: f._id ?? 0,
            positive: f.positive,
            negative: f.negative,
            satisfactionRate:
              f.positive + f.negative > 0
                ? +(f.positive / (f.positive + f.negative)).toFixed(4)
                : 0,
          })),
        },
      },
    });
  } catch (error) {
    console.error('Chat analytics error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
