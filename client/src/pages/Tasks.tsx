import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, Task } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { Plus, Star, Trash2, Inbox, Sun, ListChecks } from 'lucide-react';
import { format } from 'date-fns';

const LISTS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'all', label: 'All tasks', icon: ListChecks },
];

export default function Tasks() {
  const { list = 'inbox' } = useParams();
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

  async function toggle(t: Task) {
    await api.patch(`/tasks/${t.id}`, { status: t.status === 'done' ? 'pending' : 'done' });
    load();
  }

  async function toggleStar(t: Task) {
    await api.patch(`/tasks/${t.id}`, { starred: t.starred ? 0 : 1 });
    load();
  }

  async function remove(t: Task) {
    await api.delete(`/tasks/${t.id}`);
    load();
  }

  async function updatePriority(t: Task, priority: 'low' | 'medium' | 'high') {
    await api.patch(`/tasks/${t.id}`, { priority });
    load();
  }

  return (
    <div className="h-full flex">
      <aside className="w-56 border-r border-ink-200 bg-white p-4">
        <div className="text-xs uppercase tracking-wide text-ink-400 mb-2 px-2">Lists</div>
        <nav className="space-y-1">
          {LISTS.map(l => (
            <a
              key={l.id}
              href={`/tasks/${l.id}`}
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', `/tasks/${l.id}`); window.dispatchEvent(new PopStateEvent('popstate')); }}
              className={`nav-item ${list === l.id ? 'active' : ''}`}
            >
              <l.icon size={16} />
              {l.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader
          title={LISTS.find(l => l.id === list)?.label || 'Tasks'}
          subtitle={`${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`}
          actions={
            <div className="flex items-center gap-1 bg-ink-100 rounded-lg p-1">
              {(['pending', 'done', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-md capitalize ${filter === f ? 'bg-white shadow-soft text-ink-900' : 'text-ink-500'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          }
        />

        <div className="px-8 py-4 border-b border-ink-200 bg-white">
          <div className="flex gap-2 max-w-3xl">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="What needs doing?"
              className="input flex-1"
            />
            <button onClick={addTask} className="btn-primary">
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-4">
            {tasks.length === 0 && (
              <div className="text-center py-16 text-ink-400">
                <ListChecks size={32} className="mx-auto mb-3 opacity-50" />
                <div className="text-sm">No tasks here. Capture one above.</div>
              </div>
            )}
            {tasks.map(t => (
              <div key={t.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-ink-50 border-b border-ink-100">
                <button
                  onClick={() => toggle(t)}
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition ${t.status === 'done' ? 'bg-brand-600 border-brand-600' : 'border-ink-300 hover:border-brand-500'}`}
                >
                  {t.status === 'done' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${t.status === 'done' ? 'line-through text-ink-400' : 'text-ink-900'}`}>
                    {t.title}
                  </div>
                  {t.description && <div className="text-xs text-ink-500 mt-0.5 truncate">{t.description}</div>}
                </div>
                <select
                  value={t.priority}
                  onChange={(e) => updatePriority(t, e.target.value as any)}
                  className={`text-xs px-2 py-1 rounded border-0 bg-transparent cursor-pointer ${
                    t.priority === 'high' ? 'text-red-700 bg-red-50' :
                    t.priority === 'medium' ? 'text-amber-700 bg-amber-50' :
                    'text-ink-500 bg-ink-100'
                  }`}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
                {t.due_date && (
                  <span className="text-xs text-ink-500">{format(new Date(t.due_date), 'MMM d')}</span>
                )}
                <button
                  onClick={() => toggleStar(t)}
                  className={`p-1 rounded hover:bg-ink-200 ${t.starred ? 'text-amber-500' : 'text-ink-300 opacity-0 group-hover:opacity-100'}`}
                >
                  <Star size={16} fill={t.starred ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => remove(t)}
                  className="p-1 rounded hover:bg-red-100 text-ink-300 hover:text-red-600 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
