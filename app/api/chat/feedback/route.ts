import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { authenticateToken } from '@/app/api/_lib/auth';
import { ChatFeedback } from '@/src/models/ChatFeedback';
import { findTurn } from '@/src/services/conversation.service';

const REASONS = ['wrong_fit', 'not_helpful', 'confusing', 'too_generic', 'inaccurate', 'great'];

/**
 * POST /api/chat/feedback
 * Body: { turnId: string, rating: 1 | -1, reason?: string, comment?: string }
 *
 * Captures per-turn human judgement. The turn's stored metadata (intent, answer
 * tier, aiGenerated) is copied from the transcript rather than trusted from the
 * client, so satisfaction can be sliced by answer tier for the evaluation study.
 *
 * Auth is optional — guests can rate replies. Re-voting on the same turn
 * overwrites the previous rating.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const turnId = typeof body?.turnId === 'string' ? body.turnId.trim() : '';
    const rating = Number(body?.rating);
    const reason = typeof body?.reason === 'string' ? body.reason : undefined;
    const comment =
      typeof body?.comment === 'string' ? body.comment.trim().slice(0, 500) : undefined;

    if (!turnId) {
      return NextResponse.json({ message: 'turnId is required' }, { status: 400 });
    }
    if (rating !== 1 && rating !== -1) {
      return NextResponse.json({ message: 'rating must be 1 or -1' }, { status: 400 });
    }
    if (reason && !REASONS.includes(reason)) {
      return NextResponse.json({ message: 'Invalid reason' }, { status: 400 });
    }

    await connectToDatabase();

    const turn = await findTurn(turnId);
    if (!turn) {
      return NextResponse.json({ message: 'Unknown turn' }, { status: 404 });
    }

    let userId: string | undefined;
    const auth = await authenticateToken(request);
    if (auth.success && auth.user) userId = auth.user.id;

    await ChatFeedback.updateOne(
      { turnId },
      {
        $set: {
          sessionId: turn.sessionId,
          turnId,
          user: userId,
          rating,
          reason,
          comment,
          // Copied from the transcript — never trusted from the request body.
          answerTier: turn.message.answerTier ?? 0,
          intent: turn.message.intent,
          aiGenerated: !!turn.message.aiGenerated,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Feedback recorded', turnId, rating });
  } catch (error) {
    console.error('Chat feedback error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
