import { useEffect, useState } from 'react';
import { api, Task, Event, Email, Note } from '../lib/api';
import { useAuth } from '../store/auth';
import PageHeader from '../components/PageHeader';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles, ListTodo, Calendar, Mail, NotebookText, ChevronRight, Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';

export default function Today() {
  const user = useAuth(s => s.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [plan, setPlan] = useState<string>('');
  const [planLoading, setPlanLoading] = useState(false);

  async function loadAll() {
    const today = new Date().toISOString().slice(0, 10);
    const [t, e, m, n] = await Promise.all([
      api.get<{ tasks: Task[] }>('/tasks?status=pending'),
      api.get<{ events: Event[] }>(`/events?from=${today}T00:00:00&to=${today}T23:59:59`),
      api.get<{ emails: Email[] }>('/emails?unread=1'),
      api.get<{ notes: Note[] }>('/notes'),
    ]);
    setTasks(t.tasks);
    setEvents(e.events);
    setEmails(m.emails);
    setNotes(n.notes);
  }

  useEffect(() => { loadAll(); }, []);

  async function planDay() {
    setPlanLoading(true);
    setPlan('');
    try {
      const { plan } = await api.post<{ plan: string }>('/assistant/plan-day');
      setPlan(plan);
    } finally {
      setPlanLoading(false);
    }
  }

  async function quickAddTask(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const v = (e.target as HTMLInputElement).value.trim();
      if (!v) return;
      await api.post('/tasks', { title: v, list: 'today' });
      (e.target as HTMLInputElement).value = '';
      loadAll();
    }
  }

  async function toggleTask(t: Task) {
    await api.patch(`/tasks/${t.id}`, { status: t.status === 'done' ? 'pending' : 'done' });
    loadAll();
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader
        title="Today"
        subtitle={format(new Date(), 'EEEE, MMMM d')}
        actions={
          <button onClick={planDay} disabled={planLoading} className="btn-secondary">
            <Sparkles size={12} />
            {planLoading ? 'Planning…' : 'Plan my day'}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-ink-900 tracking-tight">
              {greeting}, {user?.name?.split(' ')[0] || 'there'}.
            </h2>
            <p className="text-[13px] text-ink-500 mt-0.5">
              {emails.length} unread · {events.length} {events.length === 1 ? 'meeting' : 'meetings'} · {tasks.length} open {tasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>

          {(planLoading || plan) && (
            <div className="card p-4 mb-6 bg-white border-ink-200">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={12} className="text-ink-700" />
                <span className="text-2xs font-semibold uppercase tracking-wide text-ink-700">
                  Siri's plan for today
                </span>
              </div>
              <div className="prose-chat text-ink-800">
                {planLoading ? <div className="text-ink-400 text-[13px]">Thinking through your day…</div> : <ReactMarkdown>{plan}</ReactMarkdown>}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Panel title="Schedule" icon={Calendar} href="/calendar" count={events.length}>
              {events.length === 0 ? (
                <Empty>No meetings — enjoy the focus time.</Empty>
              ) : (
                <ul className="space-y-1">
                  {events.map(ev => (
                    <li key={ev.id} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-ink-50">
                      <span className="text-2xs font-mono text-ink-500 w-12 shrink-0">
                        {format(new Date(ev.start_at), 'HH:mm')}
                      </span>
                      <span className="text-[13px] text-ink-900 truncate flex-1">{ev.title}</span>
                      {ev.location && <span className="text-2xs text-ink-400 truncate max-w-[80px]">{ev.location}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Top tasks" icon={ListTodo} href="/tasks" count={tasks.length}>
              <div className="mb-1.5 px-0.5">
                <input
                  onKeyDown={quickAddTask}
                  placeholder="+ Add a task and press Enter…"
                  className="w-full bg-transparent border-0 focus:outline-none text-[13px] placeholder-ink-400 py-1"
                />
              </div>
              {tasks.length === 0 ? (
                <Empty>Nothing on your list.</Empty>
              ) : (
                <ul className="space-y-0.5">
                  {tasks.slice(0, 6).map(t => (
                    <li key={t.id} className="group flex items-center gap-2 px-1.5 py-1 rounded hover:bg-ink-50">
                      <button
                        onClick={() => toggleTask(t)}
                        className={`h-3.5 w-3.5 rounded border shrink-0 ${t.status === 'done' ? 'bg-ink-900 border-ink-900' : 'border-ink-300 hover:border-ink-500'}`}
                      />
                      <span className={`text-[13px] flex-1 truncate ${t.status === 'done' ? 'line-through text-ink-400' : 'text-ink-800'}`}>
                        {t.title}
                      </span>
                      {t.due_date && (
                        <span className="text-2xs text-ink-400 shrink-0">{format(new Date(t.due_date), 'MMM d')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Unread inbox" icon={Mail} href="/inbox" count={emails.length}>
              {emails.length === 0 ? (
                <Empty>Inbox zero — nice.</Empty>
              ) : (
                <ul className="space-y-0.5">
                  {emails.slice(0, 5).map(em => (
                    <li key={em.id}>
                      <Link to="/inbox" className="block px-1.5 py-1 rounded hover:bg-ink-50">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[13px] font-medium text-ink-900 truncate flex-1">{em.sender}</span>
                          <span className="text-2xs text-ink-400 shrink-0">
                            {formatDistanceToNow(em.received_at, { addSuffix: false })}
                          </span>
                        </div>
                        <div className="text-[12px] text-ink-600 truncate">{em.subject}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Recent notes" icon={NotebookText} href="/notes" count={notes.length}>
              {notes.length === 0 ? (
                <Empty>No notes yet.</Empty>
              ) : (
                <ul className="space-y-0.5">
                  {notes.slice(0, 5).map(n => (
                    <li key={n.id}>
                      <Link to={`/notes/${n.id}`} className="block px-1.5 py-1 rounded hover:bg-ink-50">
                        <div className="text-[13px] font-medium text-ink-900 truncate">{n.title || 'Untitled'}</div>
                        <div className="text-[12px] text-ink-500 truncate">
                          {(n.content || '').replace(/[#*`>]/g, '').slice(0, 70) || 'Empty'}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title, icon: Icon, href, count, children,
}: {
  title: string; icon: any; href: string; count?: number; children: React.ReactNode;
}) {
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className="text-ink-500" />
          <span className="text-2xs font-semibold uppercase tracking-wider text-ink-600">{title}</span>
          {typeof count === 'number' && <span className="chip">{count}</span>}
        </div>
        <Link to={href} className="text-2xs text-ink-400 hover:text-ink-700 flex items-center">
          all <ChevronRight size={11} />
        </Link>
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] text-ink-400 italic px-1.5 py-2">{children}</div>;
}
