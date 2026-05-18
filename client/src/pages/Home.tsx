import { useEffect, useRef, useState } from 'react';
import { useUI } from '../store/ui';
import { api, Chat, Message, Note } from '../lib/api';
import TopBar from '../components/TopBar';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles, Send, Mic, ThumbsUp, ThumbsDown, RotateCw, Settings,
  StickyNote, FileText, Save,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const { activeTab, setActiveTab } = useUI();
  const navigate = useNavigate();

  return (
    <>
      <TopBar
        right={
          <div className="flex items-center gap-1 border-b-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={clsx('tab', activeTab === 'chat' && 'active')}
            >
              <Sparkles size={13} /> Ask AI
            </button>
            <button
              onClick={() => setActiveTab('quicknote')}
              className={clsx('tab', activeTab === 'quicknote' && 'active')}
            >
              <StickyNote size={13} /> Quick Note
            </button>
          </div>
        }
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'chat' ? <AskAI /> : <QuickNote onSaved={(n) => navigate(`/notes/${n.id}`)} />}
      </div>
    </>
  );
}

function AskAI() {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    let c = chat;
    if (!c) {
      const { chat: created } = await api.post<{ chat: Chat }>('/chats', { title: 'Conversation' });
      c = created;
      setChat(c);
    }

    const optimistic: Message = {
      id: 'temp-' + Date.now(),
      chat_id: c.id,
      role: 'user',
      content: text,
      created_at: Date.now(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const { userMessage, assistantMessage } = await api.post<{
        userMessage: Message; assistantMessage: Message;
      }>(`/chats/${c.id}/messages`, { content: text });
      setMessages(prev => [...prev.filter(m => m.id !== optimistic.id), userMessage, assistantMessage]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        chat_id: c!.id,
        role: 'assistant',
        content: `Error: ${err.message || err}`,
        created_at: Date.now(),
      }]);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setChat(null);
    setMessages([]);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && !sending ? (
            <WelcomeState onPick={(s) => setInput(s)} />
          ) : (
            messages.map(m => <MessageBlock key={m.id} msg={m} onRetry={reset} />)
          )}

          {sending && (
            <div className="flex gap-3 mb-6">
              <Avatar />
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-[13px] font-semibold text-ink-900">siri</span>
                  <span className="text-2xs text-warm-600 font-medium">thinking…</span>
                </div>
                <div className="inline-block bg-white border border-ink-200 rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay: '120ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay: '240ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Composer
        value={input}
        onChange={setInput}
        onSend={send}
        disabled={sending}
      />
    </div>
  );
}

function WelcomeState({ onPick }: { onPick: (s: string) => void }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="text-center mt-12">
      <div className="inline-flex h-12 w-12 rounded-xl bg-ink-900 text-white items-center justify-center mb-4">
        <Sparkles size={20} />
      </div>
      <h2 className="text-2xl font-semibold text-ink-900 tracking-tight">{greeting}.</h2>
      <p className="text-[13px] text-ink-500 mt-1">
        What's on your mind today?
      </p>
      <div className="grid sm:grid-cols-2 gap-2 max-w-xl mx-auto mt-6">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="card p-3 text-left text-[13px] text-ink-700 hover:border-ink-300 hover:bg-white transition"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBlock({ msg, onRetry }: { msg: Message; onRetry: () => void }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-[75%] bg-ink-900 text-white rounded-2xl px-3.5 py-2 text-[13px] whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 mb-5">
      <Avatar />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-[13px] font-semibold text-ink-900">siri</span>
          <span className="text-2xs text-warm-600 font-medium">Proactive</span>
          <span className="text-2xs text-ink-400">{format(new Date(msg.created_at), 'p')}</span>
        </div>
        <div className="card p-3.5 prose-chat text-ink-800">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
        <div className="flex items-center gap-0.5 mt-1.5">
          <button className="icon-btn h-6 w-6"><ThumbsUp size={11} /></button>
          <button className="icon-btn h-6 w-6"><ThumbsDown size={11} /></button>
          <button onClick={onRetry} className="icon-btn h-6 w-6"><RotateCw size={11} /></button>
          <span className="flex-1" />
          <button className="icon-btn h-6 w-6"><Settings size={11} /></button>
        </div>
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div className="h-7 w-7 shrink-0 rounded-lg bg-ink-900 text-white grid place-items-center">
      <Sparkles size={12} />
    </div>
  );
}

function Composer({
  value, onChange, onSend, disabled,
}: { value: string; onChange: (v: string) => void; onSend: () => void; disabled?: boolean }) {
  return (
    <div className="px-8 pb-5 pt-2">
      <div className="max-w-3xl mx-auto">
        <div className="card p-3 focus-within:border-ink-400 focus-within:ring-2 focus-within:ring-ink-300/30 transition">
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
            }}
            rows={1}
            placeholder="Ask follow-up"
            className="w-full bg-transparent border-0 focus:outline-none resize-none text-[13px] placeholder-ink-400 max-h-40"
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-2xs text-ink-400">Enter to send · Shift+Enter for newline</span>
            <div className="flex items-center gap-1">
              <button className="icon-btn h-7 w-7" title="Voice input (coming soon)">
                <Mic size={13} />
              </button>
              <button
                onClick={onSend}
                disabled={!value.trim() || disabled}
                className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-ink-900 text-white disabled:opacity-30 disabled:bg-ink-200 hover:bg-ink-800 transition"
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickNote({ onSaved }: { onSaved: (n: Note) => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!content.trim() && !title.trim()) return;
    setSaving(true);
    try {
      const { note } = await api.post<{ note: Note }>('/notes', {
        title: title.trim() || 'Quick note',
        content: content.trim(),
      });
      onSaved(note);
      setTitle(''); setContent('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-8">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={14} className="text-warm-500" />
          <span className="text-[12px] uppercase tracking-wider text-ink-500 font-semibold">Quick Note</span>
        </div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Untitled note"
          className="w-full text-2xl font-semibold tracking-tight bg-transparent border-0 focus:outline-none placeholder-ink-300 mb-4"
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Capture a thought, a meeting note, a brain dump… Markdown supported."
          className="w-full min-h-[55vh] bg-transparent border-0 focus:outline-none text-[14px] text-ink-800 leading-relaxed resize-none"
        />
        <div className="flex items-center justify-end mt-4">
          <button onClick={save} disabled={saving} className="btn-primary">
            <Save size={13} />
            {saving ? 'Saving…' : 'Save to Knowledge'}
          </button>
        </div>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'Plan my day around my meetings.',
  'Summarize the top items in my inbox.',
  'Turn my recent notes into clear next steps.',
  'Help me draft a follow-up after my last meeting.',
];
