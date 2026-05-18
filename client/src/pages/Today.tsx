import { useEffect, useState } from 'react';
import { api, Task, Event } from '../lib/api';
import { useAuth } from '../store/auth';
import PageHeader from '../components/PageHeader';
import ReactMarkdown from 'react-markdown';
import { Sparkles, ListTodo, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function Today() {
  const user = useAuth(s => s.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [plan, setPlan] = useState<string>('');
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [t, e] = await Promise.all([
        api.get<{ tasks: Task[] }>('/tasks?status=pending'),
        api.get<{ events: Event[] }>(`/events?from=${today}T00:00:00&to=${today}T23:59:59`),
      ]);
      setTasks(t.tasks);
      setEvents(e.events);
    })();
  }, []);

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

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader
        title={`${greeting}, ${user?.name?.split(' ')[0] || 'there'}.`}
        subtitle={format(new Date(), "EEEE, MMMM d")}
        actions={
          <button onClick={planDay} disabled={planLoading} className="btn-primary">
            <Sparkles size={16} />
            {planLoading ? 'Thinking…' : 'Plan my day'}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-ink-900 flex items-center gap-2">
                <Calendar size={16} className="text-brand-600" />
                Today's schedule
              </h2>
              <Link to="/calendar" className="text-xs text-ink-500 hover:text-ink-900 flex items-center gap-0.5">
                See all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-2">
              {events.length === 0 && <div className="text-sm text-ink-400">No meetings today — enjoy the focus time.</div>}
              {events.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-ink-50">
                  <div className="w-1 h-10 rounded-full bg-brand-500" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-ink-900 truncate">{ev.title}</div>
                    <div className="text-xs text-ink-500">
                      {format(new Date(ev.start_at), 'h:mm a')} – {format(new Date(ev.end_at), 'h:mm a')}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-ink-900 flex items-center gap-2">
                <ListTodo size={16} className="text-brand-600" />
                Top tasks
              </h2>
              <Link to="/tasks" className="text-xs text-ink-500 hover:text-ink-900 flex items-center gap-0.5">
                See all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-1">
              {tasks.length === 0 && <div className="text-sm text-ink-400">Nothing on your list. Capture something for later.</div>}
              {tasks.slice(0, 6).map(t => (
                <TaskRow key={t.id} task={t} onUpdate={(nt) => setTasks(prev => prev.map(x => x.id === nt.id ? nt : x).filter(x => x.status !== 'done'))} />
              ))}
            </div>
          </div>
        </div>

        {(planLoading || plan) && (
          <div className="card p-6 mt-6 max-w-5xl bg-gradient-to-br from-brand-50 to-white border-brand-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-brand-600" />
              <span className="font-semibold text-ink-900">Siri's plan for today</span>
            </div>
            <div className="prose-chat text-ink-800">
              {planLoading ? <div className="text-ink-400">Thinking through your day…</div> : <ReactMarkdown>{plan}</ReactMarkdown>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskRow({ task, onUpdate }: { task: Task; onUpdate: (t: Task) => void }) {
  async function toggle() {
    const { task: updated } = await api.patch<{ task: Task }>(`/tasks/${task.id}`, {
      status: task.status === 'done' ? 'pending' : 'done',
    });
    onUpdate(updated);
  }
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-ink-50">
      <button
        onClick={toggle}
        className={`h-4 w-4 rounded border ${task.status === 'done' ? 'bg-brand-600 border-brand-600' : 'border-ink-300 hover:border-brand-500'}`}
      />
      <div className="flex-1 min-w-0 text-sm">
        <span className={task.status === 'done' ? 'line-through text-ink-400' : 'text-ink-800'}>
          {task.title}
        </span>
        {task.due_date && (
          <span className="ml-2 text-xs text-ink-400">{format(new Date(task.due_date), 'MMM d')}</span>
        )}
      </div>
      <span className={`text-xs px-1.5 py-0.5 rounded ${
        task.priority === 'high' ? 'bg-red-50 text-red-700' :
        task.priority === 'medium' ? 'bg-amber-50 text-amber-700' :
        'bg-ink-100 text-ink-500'
      }`}>
        {task.priority}
      </span>
    </div>
  );
}
