'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  X,
  Send,
  Minus,
  Bot,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Star,
} from 'lucide-react';

/**
 * Floating AI motorcycle assistant widget.
 *
 * - Fixed bottom-right, available site-wide (mounted in app/layout.tsx).
 * - Conversation memory lives on the SERVER (keyed by sessionId), so only the
 *   message and session id are sent — no client-supplied history.
 * - Renders explainability: fitment verdict, reason chips and knowledge sources
 *   so the rider can see WHY a part was recommended.
 * - Captures per-turn feedback for the evaluation framework.
 */

type Fitment = 'FITS' | 'FITS_UNIVERSAL' | 'NO_FIT' | 'UNKNOWN';

interface Reason {
  code: string;
  label: string;
  text: string;
  tone: 'positive' | 'neutral' | 'caution';
}

interface ProductCard {
  id: string;
  name: string;
  price: number;
  currency: string;
  brand: string;
  image: string | null;
  inStock: boolean;
  compatible?: boolean;
  fitment: Fitment;
  fitmentLabel: string;
  ratingAvg: number;
  ratingCount: number;
  reasons: Reason[];
}

interface KnowledgeCard {
  ref: string;
  kind: string;
  title: string;
  source: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  turnId?: string;
  products?: ProductCard[];
  knowledge?: KnowledgeCard[];
  escalated?: boolean;
  answerTier?: number;
  error?: boolean;
}

const WELCOME: Message = {
  role: 'assistant',
  content:
    "Hi! I'm the GearGhar Assistant 🏍️ Ask me about parts, upgrades, fitment, repairs or maintenance — e.g. \"What exhaust fits my Yamaha R15 V4?\"",
};

const SUGGESTIONS = [
  'Upgrades for a Duke 390?',
  'Will this handlebar fit my MT-15?',
  'My bike is overheating, what should I check?',
  'What is a tail tidy?',
];

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem('gg_chat_session');
  if (!id) {
    id = `gg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem('gg_chat_session', id);
  }
  return id;
}

function formatPrice(p: ProductCard): string {
  return `${p.currency === 'INR' ? 'Rs.' : '$'}${p.price}`;
}

const FITMENT_STYLE: Record<Fitment, { cls: string; Icon: typeof ShieldCheck }> = {
  FITS: { cls: 'bg-green-100 text-green-700', Icon: ShieldCheck },
  FITS_UNIVERSAL: { cls: 'bg-emerald-50 text-emerald-700', Icon: ShieldCheck },
  NO_FIT: { cls: 'bg-red-100 text-red-700', Icon: ShieldAlert },
  UNKNOWN: { cls: 'bg-amber-50 text-amber-700', Icon: HelpCircle },
};

const REASON_TONE: Record<Reason['tone'], string> = {
  positive: 'bg-primary/10 text-primary',
  neutral: 'bg-gray-100 text-gray-600',
  caution: 'bg-amber-50 text-amber-700',
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, 1 | -1>>({});
  const sessionId = useRef<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionId.current = getSessionId();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setIsLoading(true);

    try {
      // History is intentionally not sent — the server reads it from MongoDB.
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: trimmed, sessionId: sessionId.current }),
      });

      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          turnId: data.turnId,
          products: data.products || [],
          knowledge: data.knowledge || [],
          escalated: data.meta?.escalated,
          answerTier: data.meta?.answerTier,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I could not reach the assistant. Please try again in a moment.',
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendFeedback(turnId: string, rating: 1 | -1) {
    if (!turnId || feedback[turnId] === rating) return;
    setFeedback((prev) => ({ ...prev, [turnId]: rating }));
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ turnId, rating }),
      });
    } catch {
      /* feedback is best-effort — never interrupt the conversation */
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  // Collapsed launcher button.
  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        aria-label="Open GearGhar Assistant"
        className="fixed bottom-5 right-5 z-[100] flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-white shadow-lg transition hover:bg-primary/90 hover:shadow-xl"
      >
        <MessageCircle size={22} />
        <span className="hidden sm:inline text-sm font-semibold">Ask GearGhar</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-[100] sm:bottom-5 sm:right-5 w-full sm:w-[380px]">
      <div className="flex flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Bot size={20} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">GearGhar Assistant</p>
              <p className="text-[11px] text-white/80 leading-tight">Motorcycle parts & advice</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized((m) => !m)}
              aria-label={isMinimized ? 'Maximize chat' : 'Minimize chat'}
              className="rounded-lg p-1.5 hover:bg-white/20 transition"
            >
              <Minus size={18} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-lg p-1.5 hover:bg-white/20 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="h-[60vh] sm:h-96 overflow-y-auto bg-gray-50 px-3 py-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i}>
                  <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                        m.role === 'user'
                          ? 'bg-primary text-white rounded-br-sm'
                          : m.error
                            ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                      }`}
                    >
                      {m.error && <AlertCircle size={14} className="inline mr-1 -mt-0.5" />}
                      {m.content}
                    </div>
                  </div>

                  {/* Safety escalation banner (server-enforced, not model-authored) */}
                  {m.escalated && (
                    <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                      <ShieldAlert size={13} className="mt-0.5 flex-shrink-0 text-amber-600" />
                      <p className="text-[11px] leading-snug text-amber-800">
                        Safety-critical system — have this checked by a qualified mechanic.
                      </p>
                    </div>
                  )}

                  {/* Knowledge sources — makes the grounding visible */}
                  {m.knowledge && m.knowledge.length > 0 && (
                    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-2">
                      <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        <BookOpen size={11} /> Based on
                      </p>
                      <ul className="space-y-0.5">
                        {m.knowledge.map((k) => (
                          <li key={k.ref} className="text-[11px] text-gray-600">
                            <span className="font-medium text-gray-800">{k.title}</span>
                            <span className="text-gray-400"> — {k.source}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Product recommendation cards with explanations */}
                  {m.products && m.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.products.map((p) => {
                        const style = FITMENT_STYLE[p.fitment] || FITMENT_STYLE.UNKNOWN;
                        const FitIcon = style.Icon;
                        return (
                          <div
                            key={p.id}
                            className="rounded-xl border border-gray-200 bg-white p-2 transition hover:border-primary hover:shadow-sm"
                          >
                            <Link href={`/product/${p.id}`} className="flex items-center gap-3">
                              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                {p.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                                    <Bot size={18} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-gray-900">{p.name}</p>
                                <p className="text-[11px] text-gray-500">{p.brand}</p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <span className="text-xs font-bold text-primary">{formatPrice(p)}</span>
                                  <span
                                    className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${style.cls}`}
                                  >
                                    <FitIcon size={9} />
                                    {p.fitmentLabel}
                                  </span>
                                  {p.ratingCount > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-gray-500">
                                      <Star size={9} className="fill-amber-400 text-amber-400" />
                                      {p.ratingAvg.toFixed(1)} ({p.ratingCount})
                                    </span>
                                  )}
                                  {!p.inStock && (
                                    <span className="text-[9px] font-medium text-gray-400">Out of stock</span>
                                  )}
                                </div>
                              </div>
                            </Link>

                            {/* Why this was recommended — every chip is DB-derived */}
                            {p.reasons && p.reasons.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1 border-t border-gray-100 pt-1.5">
                                {p.reasons.slice(0, 3).map((r) => (
                                  <span
                                    key={r.code}
                                    title={r.text}
                                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${REASON_TONE[r.tone]}`}
                                  >
                                    {r.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Per-turn feedback */}
                  {m.role === 'assistant' && m.turnId && !m.error && (
                    <div className="mt-1.5 flex items-center gap-1.5 pl-1">
                      <span className="text-[10px] text-gray-400">Was this helpful?</span>
                      <button
                        onClick={() => sendFeedback(m.turnId!, 1)}
                        aria-label="Helpful"
                        className={`rounded p-1 transition hover:bg-gray-200 ${
                          feedback[m.turnId] === 1 ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        <ThumbsUp size={12} />
                      </button>
                      <button
                        onClick={() => sendFeedback(m.turnId!, -1)}
                        aria-label="Not helpful"
                        className={`rounded p-1 transition hover:bg-gray-200 ${
                          feedback[m.turnId] === -1 ? 'text-red-600' : 'text-gray-400'
                        }`}
                      >
                        <ThumbsDown size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-3">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                  </div>
                </div>
              )}

              {/* Starter suggestions */}
              {messages.length === 1 && !isLoading && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="rounded-full border border-primary/30 bg-white px-3 py-1.5 text-xs text-primary transition hover:bg-primary/5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-200 bg-white p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your motorcycle..."
                maxLength={2000}
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary/90 disabled:opacity-40"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
