import { NextRequest, NextResponse } from 'next/server';
import { handleChat } from '@/src/services/chat.service';
import { authenticateToken } from '@/app/api/_lib/auth';

/**
 * POST /api/chat
 * Body: { message: string, sessionId: string }
 *
 * Auth is optional — the assistant works for guests. If a valid token is present
 * the conversation is linked to the user, their garage is consulted for the
 * remembered motorcycle, and order history informs personalisation.
 *
 * NOTE: `history` is deliberately NOT accepted from the client any more.
 * Conversation memory is read server-side from ChatConversation, so it survives
 * reloads and device changes and cannot be forged by the browser to inject
 * fabricated prior turns into the model context.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';

    if (!message) {
      return NextResponse.json({ message: 'A message is required' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ message: 'Message is too long' }, { status: 400 });
    }
    if (!sessionId || sessionId.length > 128) {
      return NextResponse.json({ message: 'A valid sessionId is required' }, { status: 400 });
    }

    // Optional auth — don't reject guests.
    let userId: string | undefined;
    const auth = await authenticateToken(request);
    if (auth.success && auth.user) {
      userId = auth.user.id;
    }

    const result = await handleChat({ message, sessionId, userId });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
