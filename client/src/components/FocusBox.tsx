import { useEffect, useState } from 'react';
import { api, Task } from '../lib/api';
import { useUI } from '../store/ui';
import Popover from './Popover';
import { Plus, X, ChevronDown, Target } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function FocusBox() {
  const { focusOpen } = useUI();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [filter, setFilter] = useState<'starred' | 'today' | 'all'>('starred');

  async function load() {
    const params = new URLSearchParams();
    params.set('status', 'pending');
    const { tasks } = await api.get<{ tasks: Task[] }>(`/tasks?${params.toString()}`);
    let filtered = tasks;
    if (filter === 'starred') filtered = tasks.filter(t => t.starred);
    if (filter === 'today') filtered = tasks.filter(t => t.list === 'today');
    setTasks(filtered);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  async function add() {
    if (!newTitle.trim()) {
      setAdding(false);
      return;
    }
    await api.post('/tasks', { title: newTitle.trim(), list: 'today' });
    await api.patch(`/tasks`, {}); // noop fallback
    setNewTitle('');
    setAdding(false);
    load();
  }

  async function toggle(t: Task) {
    await api.patch(`/tasks/${t.id}`, { status: t.status === 'done' ? 'pending' : 'done' });
    load();
  }

  async function remove(t: Task) {
    await api.delete(`/tasks/${t.id}`);
    load();
  }

  if (!focusOpen) return null;

  const filterLabel = filter === 'starred' ? 'Starred' : filter === 'today' ? 'Today' : 'All open';

  return (
    <aside className="w-80 shrink-0 border-l border-ink-200 bg-canvas flex flex-col">
      <header className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-[18px] font-semibold text-ink-900 flex items-center gap-1.5">
              <Target size={16} className="text-warm-500" />
              Focus Box
            </h2>
            <p className="text-[12px] text-ink-500 mt-0.5">Your focused ongoing tasks</p>
          </div>

          <FilterMenu current={filterLabel} onChange={(v) => setFilter(v)} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-1.5">
          {tasks.map(t => (
            <div key={t.id} className="group card p-2.5 hover:border-ink-300 transition">
              <div className="flex items-start gap-2">
                <button
                  onClick={() => toggle(t)}
                  className={clsx(
                    'h-4 w-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition',
                    t.status === 'done' ? 'bg-ink-900 border-ink-900' : 'border-ink-300 hover:border-ink-700'
                  )}
                >
                  {t.status === 'done' && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={clsx(
                    'text-[13px]',
                    t.status === 'done' ? 'line-through text-ink-400' : 'text-ink-900'
                  )}>
                    {t.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {t.due_date && (
                      <span className="text-2xs text-ink-500">
                        {format(new Date(t.due_date), 'MMM d')}
                      </span>
                    )}
                    {t.priority !== 'medium' && (
                      <span className={clsx(
                        'text-2xs px-1 rounded',
                        t.priority === 'high' ? 'bg-warm-100 text-warm-700' : 'bg-ink-100 text-ink-500'
                      )}>
                        {t.priority}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => remove(t)}
                  className="text-ink-300 hover:text-ink-700 opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}

          {adding ? (
            <div className="card p-2.5">
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onBlur={add}
                onKeyDown={e => {
                  if (e.key === 'Enter') add();
                  if (e.key === 'Escape') { setNewTitle(''); setAdding(false); }
                }}
                placeholder="Task title…"
                className="w-full bg-transparent border-0 focus:outline-none text-[13px] placeholder-ink-400"
              />
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full card p-3 text-ink-400 hover:text-ink-700 hover:border-ink-300 flex items-center gap-1.5 text-[13px] transition"
            >
              <Plus size={13} />
              Add Task
            </button>
          )}

          {tasks.length === 0 && !adding && (
            <div className="text-center mt-6 text-[12px] text-ink-400">
              No focused tasks. Star a task to bring it here.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function FilterMenu({ current, onChange }: { current: string; onChange: (v: 'starred' | 'today' | 'all') => void }) {
  return (
    <Popover
      width={128}
      trigger={(open, toggle, ref) => (
        <button
          ref={ref}
          onClick={toggle}
          className="inline-flex items-center gap-1 px-2 h-7 rounded border border-ink-200 bg-white text-[12px] text-ink-700 hover:bg-ink-50"
        >
          {current} <ChevronDown size={11} className="text-ink-400" />
        </button>
      )}
    >
      {(close) => (
        <div className="py-1">
          {(['starred', 'today', 'all'] as const).map(v => (
            <button
              key={v}
              onClick={() => { onChange(v); close(); }}
              className="w-full text-left px-3 py-1.5 text-[12px] text-ink-700 hover:bg-ink-100 capitalize"
            >
              {v === 'all' ? 'All open' : v}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
