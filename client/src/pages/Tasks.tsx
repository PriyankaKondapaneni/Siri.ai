import { useEffect, useState } from 'react';
import { api, Task } from '../lib/api';
import TopBar from '../components/TopBar';
import { Plus, Star, Trash2, ListTodo, Inbox as InboxIcon, Sun } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

const LISTS = [
  { id: 'inbox', label: 'Inbox', icon: InboxIcon },
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'all', label: 'All', icon: ListTodo },
] as const;

export default function Tasks() {
  const [list, setList] = useState<'inbox' | 'today' | 'all'>('inbox');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [filter, setFilter] = useState<'pending' | 'done' | 'all'>('pending');

  async function load() {
    const params = new URLSearchParams();
    if (list !== 'all') params.set('list', list);
    if (filter !== 'all') params.set('status', filter);
    const { tasks } = await api.get<{ tasks: Task[] }>(`/tasks?${params.toString()}`);
    setTasks(tasks);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [list, filter]);

  async function addTask() {
    if (!newTitle.trim()) return;
    await api.post('/tasks', { title: newTitle.trim(), list: list === 'all' ? 'inbox' : list });
    setNewTitle('');
    load();
  }

  async function patch(t: Task, updates: Partial<Task>) {
    await api.patch(`/tasks/${t.id}`, updates);
    load();
  }

  return (
    <>
      <TopBar />
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="h-12 px-6 border-b border-ink-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ListTodo size={14} className="text-warm-500" />
            <h1 className="text-[14px] font-semibold text-ink-900">Tasks</h1>
            <span className="text-2xs text-ink-500">{tasks.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 bg-ink-100 rounded-md p-0.5">
              {LISTS.map(l => (
                <button
                  key={l.id}
                  onClick={() => setList(l.id)}
                  className={clsx(
                    'inline-flex items-center gap-1 px-2 h-6 text-[12px] font-medium rounded',
                    list === l.id ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500'
                  )}
                >
                  <l.icon size={11} />
                  {l.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-0.5 bg-ink-100 rounded-md p-0.5">
              {(['pending', 'done', 'all'] as const).map(f => (
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
        </div>

        <div className="px-6 py-3 border-b border-ink-200 bg-white">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="What needs doing?"
              className="input flex-1"
            />
            <button onClick={addTask} className="btn-primary">
              <Plus size={13} /> Add
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-2 py-2">
            {tasks.length === 0 && (
              <div className="text-center py-16 text-ink-400">
                <ListTodo size={26} className="mx-auto mb-2 opacity-50" />
                <div className="text-[13px]">Nothing here yet.</div>
              </div>
            )}
            {tasks.map(t => (
              <div key={t.id} className="group flex items-center gap-2.5 px-3 py-2 rounded hover:bg-white border-b border-ink-150">
                <button
                  onClick={() => patch(t, { status: t.status === 'done' ? 'pending' : 'done' })}
                  className={clsx(
                    'h-4 w-4 rounded-full border-2 grid place-items-center transition shrink-0',
                    t.status === 'done' ? 'bg-ink-900 border-ink-900' : 'border-ink-300 hover:border-ink-700'
                  )}
                >
                  {t.status === 'done' && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span className={clsx(
                  'text-[13px] flex-1 truncate',
                  t.status === 'done' ? 'line-through text-ink-400' : 'text-ink-900'
                )}>
                  {t.title}
                </span>
                <select
                  value={t.priority}
                  onChange={e => patch(t, { priority: e.target.value as any })}
                  className={clsx(
                    'text-2xs px-1.5 py-0.5 rounded border-0 bg-transparent cursor-pointer',
                    t.priority === 'high' ? 'text-warm-700 bg-warm-100' :
                    t.priority === 'medium' ? 'text-ink-700 bg-ink-100' : 'text-ink-500'
                  )}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
                {t.due_date && (
                  <span className="text-2xs text-ink-500 shrink-0">{format(new Date(t.due_date), 'MMM d')}</span>
                )}
                <button
                  onClick={() => patch(t, { starred: t.starred ? 0 : 1 } as any)}
                  className={clsx(
                    'icon-btn h-6 w-6',
                    t.starred ? 'text-warm-500' : 'text-ink-300 opacity-0 group-hover:opacity-100'
                  )}
                >
                  <Star size={12} fill={t.starred ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={async () => { await api.delete(`/tasks/${t.id}`); load(); }}
                  className="icon-btn h-6 w-6 text-ink-300 hover:text-warm-600 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
