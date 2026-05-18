import { useEffect, useState } from 'react';
import { api, Email } from '../lib/api';
import TopBar from '../components/TopBar';
import { Star, Trash2, MailOpen, Inbox as InboxIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export default function Inbox() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selected, setSelected] = useState<Email | null>(null);
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
    if (!e.is_read) {
      await api.patch(`/emails/${e.id}`, { is_read: 1 });
      load();
    }
  }

  async function patch(e: Email, updates: any) {
    await api.patch(`/emails/${e.id}`, updates);
    if (selected?.id === e.id) setSelected({ ...e, ...updates });
    load();
  }

  return (
    <>
      <TopBar />
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="w-80 shrink-0 border-r border-ink-200 bg-white flex flex-col">
          <div className="h-12 px-4 border-b border-ink-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <InboxIcon size={14} className="text-warm-500" />
              <span className="text-[14px] font-semibold text-ink-900">Inbox</span>
              <span className="text-2xs text-ink-500">{emails.length}</span>
            </div>
            <div className="flex items-center gap-0.5 bg-ink-100 rounded-md p-0.5">
              {(['all', 'unread'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    'px-2 h-6 text-[12px] font-medium rounded capitalize',
                    filter === f ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {emails.length === 0 && <div className="p-6 text-[13px] text-ink-400 text-center">Inbox zero — nice.</div>}
            {emails.map(e => (
              <button
                key={e.id}
                onClick={() => open(e)}
                className={clsx(
                  'w-full text-left px-4 py-2.5 border-b border-ink-150 hover:bg-ink-50',
                  selected?.id === e.id && 'bg-ink-100',
                  !e.is_read && 'bg-warm-50/40'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className={clsx('text-[13px] truncate', !e.is_read ? 'font-semibold text-ink-900' : 'text-ink-700')}>
                    {e.sender}
                  </div>
                  <div className="text-2xs text-ink-400 shrink-0">
                    {formatDistanceToNow(e.received_at, { addSuffix: false })}
                  </div>
                </div>
                <div className={clsx('text-[13px] truncate', !e.is_read ? 'text-ink-900' : 'text-ink-600')}>
                  {e.subject}
                </div>
                <div className="text-2xs text-ink-500 truncate">{e.preview}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="h-12 px-6 border-b border-ink-200 bg-white flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-ink-900 truncate">{selected.subject}</div>
                  <div className="text-2xs text-ink-500 truncate">
                    {selected.sender} &lt;{selected.sender_email}&gt;
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => patch(selected, { is_starred: selected.is_starred ? 0 : 1 })} className="icon-btn">
                    <Star size={14} fill={selected.is_starred ? 'currentColor' : 'none'} className={selected.is_starred ? 'text-warm-500' : ''} />
                  </button>
                  <button
                    onClick={async () => { await api.delete(`/emails/${selected.id}`); setSelected(null); load(); }}
                    className="icon-btn text-ink-500 hover:text-warm-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="max-w-2xl mx-auto text-[13.5px] text-ink-800 leading-relaxed whitespace-pre-wrap">
                  {selected.body}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-ink-400">
              <div className="text-center">
                <MailOpen size={32} className="mx-auto mb-2 opacity-50" />
                <div className="text-[13px]">Select an email to read.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
