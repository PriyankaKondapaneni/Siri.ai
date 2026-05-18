import { useEffect, useState } from 'react';
import { api, Email } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { Star, Trash2, Sparkles, MailOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Inbox() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selected, setSelected] = useState<Email | null>(null);
  const [summary, setSummary] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  async function load() {
    const qs = filter === 'unread' ? '?unread=1' : '';
    const { emails } = await api.get<{ emails: Email[] }>(`/emails${qs}`);
    setEmails(emails);
    if (!selected && emails.length) setSelected(emails[0]);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  async function open(e: Email) {
    setSelected(e);
    setSummary('');
    if (!e.is_read) {
      await api.patch(`/emails/${e.id}`, { is_read: 1 });
      load();
    }
  }

  async function toggleStar(e: Email) {
    await api.patch(`/emails/${e.id}`, { is_starred: e.is_starred ? 0 : 1 });
    load();
  }

  async function remove(e: Email) {
    await api.delete(`/emails/${e.id}`);
    if (selected?.id === e.id) setSelected(null);
    load();
  }

  async function summarize() {
    if (!selected) return;
    const { result } = await api.post<{ result: string }>('/assistant/summarize', {
      text: `From: ${selected.sender} <${selected.sender_email}>\nSubject: ${selected.subject}\n\n${selected.body}`,
      instruction: 'Summarize this email in 2-3 sentences and suggest a reply approach.',
    });
    setSummary(result);
  }

  const unreadCount = emails.filter(e => !e.is_read).length;

  return (
    <div className="h-full flex">
      <aside className="w-96 border-r border-ink-200 bg-white flex flex-col">
        <div className="p-3 border-b border-ink-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-ink-900">Inbox</div>
            <div className="text-xs text-ink-500">{unreadCount} unread</div>
          </div>
          <div className="mt-2 flex items-center gap-1 bg-ink-100 rounded-lg p-1">
            {(['all', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-md flex-1 capitalize ${filter === f ? 'bg-white shadow-soft text-ink-900' : 'text-ink-500'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {emails.length === 0 && <div className="p-6 text-sm text-ink-400 text-center">Inbox zero — nice.</div>}
          {emails.map(e => (
            <button
              key={e.id}
              onClick={() => open(e)}
              className={`w-full text-left px-4 py-3 border-b border-ink-100 hover:bg-ink-50 ${selected?.id === e.id ? 'bg-brand-50' : ''} ${!e.is_read ? 'bg-blue-50/30' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className={`text-sm truncate ${!e.is_read ? 'font-semibold text-ink-900' : 'text-ink-700'}`}>
                  {e.sender}
                </div>
                <div className="text-xs text-ink-400 shrink-0 ml-2">{formatDistanceToNow(e.received_at, { addSuffix: true })}</div>
              </div>
              <div className={`text-sm truncate mt-0.5 ${!e.is_read ? 'text-ink-900' : 'text-ink-600'}`}>
                {e.subject}
              </div>
              <div className="text-xs text-ink-500 truncate mt-0.5">{e.preview}</div>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            <PageHeader
              title={selected.subject}
              subtitle={`${selected.sender} <${selected.sender_email}>`}
              actions={
                <div className="flex items-center gap-2">
                  <button onClick={summarize} className="btn-secondary">
                    <Sparkles size={16} /> Summarize
                  </button>
                  <button onClick={() => toggleStar(selected)} className="btn-ghost">
                    <Star size={16} fill={selected.is_starred ? 'currentColor' : 'none'} className={selected.is_starred ? 'text-amber-500' : ''} />
                  </button>
                  <button onClick={() => remove(selected)} className="btn-ghost text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                </div>
              }
            />
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="max-w-3xl mx-auto">
                {summary && (
                  <div className="card p-4 mb-6 bg-gradient-to-br from-brand-50 to-white border-brand-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-brand-600" />
                      <span className="text-sm font-semibold text-ink-900">Siri's take</span>
                    </div>
                    <div className="text-sm text-ink-800 whitespace-pre-wrap">{summary}</div>
                  </div>
                )}
                <div className="text-ink-800 leading-relaxed whitespace-pre-wrap">{selected.body}</div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-ink-400">
            <div className="text-center">
              <MailOpen size={40} className="mx-auto mb-3 opacity-50" />
              <div className="text-sm">Select an email to read.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
