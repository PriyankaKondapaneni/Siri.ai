import { useEffect, useRef, useState } from 'react';
import { api, Chat, Message } from '../lib/api';
import { useUI } from '../store/ui';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Send, PanelRightClose, Plus, RotateCw } from 'lucide-react';
import clsx from 'clsx';

export default function AIPanel() {
  const { aiPanelOpen, setAiPanelOpen } = useUI();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function ensureChat(): Promise<Chat> {
    if (chat) return chat;
    const { chat: c } = await api.post<{ chat: Chat }>('/chats', { title: 'Quick chat' });
    setChat(c);
    return c;
  }

  async function send() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const c = await ensureChat();
      const optimistic: Message = {
        id: 'temp-' + Date.now(), chat_id: c.id, role: 'user',
        content: text, created_at: Date.now(),
      };
      setMessages(prev => [...prev, optimistic]);
      const { userMessage, assistantMessage } = await api.post<{
        userMessage: Message; assistantMessage: Message;
      }>(`/chats/${c.id}/messages`, { content: text });
      setMessages(prev => [...prev.filter(m => m.id !== optimistic.id), userMessage, assistantMessage]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(), chat_id: chat?.id || '', role: 'assistant',
        content: `Error: ${err.message || err}`, created_at: Date.now(),
      }]);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setChat(null);
    setMessages([]);
    inputRef.current?.focus();
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  if (!aiPanelOpen) return null;

  return (
    <aside className="w-[360px] shrink-0 border-l border-ink-200 bg-white flex flex-col">
      <header className="h-11 px-3 border-b border-ink-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded bg-ink-900 text-white grid place-items-center">
            <Sparkles size={11} />
          </div>
          <span className="text-[13px] font-medium text-ink-900">Siri</span>
          <span className="text-2xs text-ink-400">Claude</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={reset} className="icon-btn" title="New conversation">
            <RotateCw size={14} />
          </button>
          <button onClick={() => setAiPanelOpen(false)} className="icon-btn" title="Hide panel (⌘.)">
            <PanelRightClose size={14} />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="text-center mt-6">
            <div className="inline-flex h-9 w-9 rounded-lg bg-ink-100 text-ink-700 items-center justify-center mb-3">
              <Sparkles size={16} />
            </div>
            <div className="text-[13px] font-medium text-ink-900">Ask Siri anything</div>
            <div className="text-xs text-ink-500 mt-0.5 mb-4">Has context across your workspace.</div>
            <div className="space-y-1.5 text-left">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="w-full text-left px-2.5 py-1.5 rounded-md border border-ink-200 hover:border-ink-300 hover:bg-ink-50 text-xs text-ink-700 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={clsx('mb-3 fade-in', m.role === 'user' && 'flex justify-end')}>
            <div className={clsx(
              'inline-block max-w-[92%] rounded-lg px-2.5 py-1.5',
              m.role === 'user'
                ? 'bg-ink-900 text-white'
                : 'bg-ink-100 text-ink-800'
            )}>
              {m.role === 'assistant' ? (
                <div className="prose-chat"><ReactMarkdown>{m.content}</ReactMarkdown></div>
              ) : (
                <div className="text-[13px] whitespace-pre-wrap">{m.content}</div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="mb-3">
            <div className="inline-block bg-ink-100 rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay: '120ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay: '240ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-ink-200">
        <div className="rounded-md border border-ink-200 focus-within:border-ink-400 focus-within:ring-2 focus-within:ring-ink-300/30 transition">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            rows={1}
            placeholder="Ask Siri…"
            className="w-full bg-transparent border-0 focus:outline-none resize-none px-2.5 py-2 text-[13px] max-h-32"
          />
          <div className="flex items-center justify-between px-2 pb-1.5">
            <span className="text-2xs text-ink-400">⏎ to send · ⇧⏎ newline</span>
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="inline-flex items-center justify-center h-6 w-6 rounded bg-ink-900 text-white disabled:opacity-30 disabled:bg-ink-200 hover:bg-ink-800 transition"
            >
              <Send size={11} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

const QUICK_PROMPTS = [
  'Plan my day around my meetings.',
  'Summarize the most important emails.',
  'Turn my recent notes into next steps.',
  'Draft a follow-up to my last meeting.',
];
