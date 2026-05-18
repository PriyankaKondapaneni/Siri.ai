import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, Chat as ChatType, Message } from '../lib/api';
import { Plus, Send, Sparkles, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatType[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadChats() {
    const { chats } = await api.get<{ chats: ChatType[] }>('/chats');
    setChats(chats);
  }

  async function loadMessages(chatId: string) {
    const { messages } = await api.get<{ chat: ChatType; messages: Message[] }>(`/chats/${chatId}`);
    setMessages(messages);
  }

  useEffect(() => { loadChats(); }, []);
  useEffect(() => {
    if (id) loadMessages(id);
    else setMessages([]);
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function newChat() {
    const { chat } = await api.post<{ chat: ChatType }>('/chats', {});
    await loadChats();
    navigate(`/chat/${chat.id}`);
  }

  async function send() {
    if (!input.trim() || sending) return;
    let chatId = id;
    if (!chatId) {
      const { chat } = await api.post<{ chat: ChatType }>('/chats', {});
      chatId = chat.id;
      navigate(`/chat/${chat.id}`, { replace: true });
    }
    const text = input.trim();
    setInput('');
    setSending(true);

    const optimistic: Message = {
      id: 'temp-' + Date.now(),
      chat_id: chatId!,
      role: 'user',
      content: text,
      created_at: Date.now(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const { userMessage, assistantMessage } = await api.post<{
        userMessage: Message; assistantMessage: Message; chat: ChatType;
      }>(`/chats/${chatId}/messages`, { content: text });
      setMessages(prev => [...prev.filter(m => m.id !== optimistic.id), userMessage, assistantMessage]);
      loadChats();
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        chat_id: chatId!,
        role: 'assistant',
        content: `Error: ${err.message || err}`,
        created_at: Date.now(),
      }]);
    } finally {
      setSending(false);
    }
  }

  async function deleteChat(chatId: string) {
    await api.delete(`/chats/${chatId}`);
    if (id === chatId) navigate('/chat');
    loadChats();
  }

  const suggestions = [
    'Plan my day around my meetings.',
    'Summarize the most important things in my inbox.',
    'Turn this into a clear next-step list: [paste a brain dump]',
    'Draft a follow-up email to my team after standup.',
  ];

  return (
    <div className="h-full flex">
      <aside className="w-72 border-r border-ink-200 bg-white flex flex-col">
        <div className="p-3 border-b border-ink-200 flex items-center justify-between">
          <div className="text-sm font-semibold text-ink-900 flex items-center gap-1.5">
            <Sparkles size={14} className="text-brand-600" />
            Conversations
          </div>
          <button onClick={newChat} className="btn-ghost p-1.5" title="New chat">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 && <div className="p-6 text-sm text-ink-400 text-center">No chats yet.</div>}
          {chats.map(c => (
            <div
              key={c.id}
              className={clsx(
                'group flex items-center gap-2 px-3 py-2.5 border-b border-ink-100 cursor-pointer hover:bg-ink-50',
                id === c.id && 'bg-brand-50'
              )}
              onClick={() => navigate(`/chat/${c.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink-900 truncate">{c.title}</div>
                <div className="text-xs text-ink-400">{formatDistanceToNow(c.updated_at, { addSuffix: true })}</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                className="p-1 rounded hover:bg-red-100 text-ink-300 hover:text-red-600 opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-white to-ink-50">
        <div className="px-8 py-4 border-b border-ink-200 bg-white flex items-center gap-2">
          <Sparkles size={18} className="text-brand-600" />
          <div className="font-semibold text-ink-900">Ask Siri</div>
          <div className="text-xs text-ink-400 ml-1">· powered by Claude</div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex h-12 w-12 rounded-2xl bg-brand-100 text-brand-700 grid place-items-center mb-4">
                  <Sparkles size={22} />
                </div>
                <div className="text-xl font-semibold text-ink-900">How can I help you today?</div>
                <div className="text-sm text-ink-500 mt-1 mb-6">I have context across your tasks, notes, calendar, and inbox.</div>
                <div className="grid sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="text-left card p-3 hover:border-brand-300 hover:bg-brand-50/40 text-sm text-ink-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(m => (
              <div key={m.id} className={clsx('flex gap-3 mb-6', m.role === 'user' ? 'justify-end' : '')}>
                {m.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white grid place-items-center shrink-0">
                    <Sparkles size={14} />
                  </div>
                )}
                <div
                  className={clsx(
                    'max-w-[80%] rounded-2xl px-4 py-3',
                    m.role === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'bg-white border border-ink-200 text-ink-800 shadow-soft'
                  )}
                >
                  {m.role === 'assistant' ? (
                    <div className="prose-chat text-sm">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white grid place-items-center shrink-0">
                  <Sparkles size={14} />
                </div>
                <div className="bg-white border border-ink-200 rounded-2xl px-4 py-3 shadow-soft">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-ink-200 bg-white px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 card p-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask Siri anything…"
                className="flex-1 resize-none bg-transparent border-0 focus:outline-none px-3 py-2 text-sm max-h-40"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="btn-primary disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="mt-2 text-xs text-ink-400 text-center">
              Siri can make mistakes — double-check anything important.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
