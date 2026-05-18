import { useEffect, useMemo, useState } from 'react';
import { api, Event, Task } from '../lib/api';
import TopBar from '../components/TopBar';
import { Plus, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import {
  addDays, format, isSameDay, isToday, startOfDay, addWeeks, subWeeks,
} from 'date-fns';

type Item =
  | { kind: 'event'; data: Event; time: Date }
  | { kind: 'task'; data: Task; time: Date };

export default function Timeline() {
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const rangeStart = anchor;
  const rangeEnd = addDays(anchor, 7);

  async function load() {
    const [e, t] = await Promise.all([
      api.get<{ events: Event[] }>(`/events?from=${rangeStart.toISOString()}&to=${rangeEnd.toISOString()}`),
      api.get<{ tasks: Task[] }>('/tasks?status=pending'),
    ]);
    setEvents(e.events);
    setTasks(t.tasks);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [anchor]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(anchor, i)), [anchor]);

  function itemsFor(day: Date): Item[] {
    const list: Item[] = [];
    for (const ev of events) {
      const t = new Date(ev.start_at);
      if (isSameDay(t, day)) list.push({ kind: 'event', data: ev, time: t });
    }
    for (const tk of tasks) {
      if (tk.due_date && isSameDay(new Date(tk.due_date), day)) {
        list.push({ kind: 'task', data: tk, time: new Date(tk.due_date) });
      }
    }
    list.sort((a, b) => a.time.getTime() - b.time.getTime());
    return list;
  }

  return (
    <>
      <TopBar />
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="h-12 px-6 border-b border-ink-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays size={14} className="text-warm-500" />
            <h1 className="text-[14px] font-semibold text-ink-900">Timeline</h1>
            <span className="text-2xs text-ink-500">
              {format(rangeStart, 'MMM d')} – {format(addDays(rangeEnd, -1), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setAnchor(subWeeks(anchor, 1))} className="icon-btn">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setAnchor(startOfDay(new Date()))} className="btn-secondary h-7 px-2.5 text-[12px]">
              Today
            </button>
            <button onClick={() => setAnchor(addWeeks(anchor, 1))} className="icon-btn">
              <ChevronRight size={14} />
            </button>
            <span className="w-2" />
            <button onClick={() => setShowCreate(true)} className="btn-primary h-7 px-2.5 text-[12px]">
              <Plus size={12} /> Event
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-6">
            {days.map(day => {
              const items = itemsFor(day);
              return (
                <div key={day.toISOString()} className="mb-5">
                  <div className="flex items-baseline gap-2 mb-2 sticky top-0 bg-canvas py-1 z-10">
                    <span className={`text-[13px] font-semibold ${isToday(day) ? 'text-warm-600' : 'text-ink-900'}`}>
                      {format(day, 'EEEE')}
                    </span>
                    <span className="text-2xs text-ink-500">{format(day, 'MMMM d')}</span>
                    {isToday(day) && <span className="chip bg-warm-100 text-warm-700">Today</span>}
                  </div>
                  {items.length === 0 ? (
                    <div className="pl-4 border-l-2 border-ink-150 py-1.5 text-[12px] text-ink-400 italic">
                      Nothing scheduled
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {items.map((it, i) => (
                        <TimelineItem key={i} item={it} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showCreate && <CreateEventModal onClose={() => { setShowCreate(false); load(); }} />}
    </>
  );
}

function TimelineItem({ item }: { item: Item }) {
  if (item.kind === 'event') {
    return (
      <div className="flex items-center gap-3 pl-4 border-l-2 border-warm-300 py-1.5 group hover:bg-white rounded-r">
        <span className="text-2xs font-mono text-ink-500 w-12 shrink-0">
          {format(item.time, 'HH:mm')}
        </span>
        <span className="text-[13px] text-ink-900 flex-1 truncate">{item.data.title}</span>
        {item.data.location && (
          <span className="text-2xs text-ink-400 truncate max-w-[140px]">{item.data.location}</span>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 pl-4 border-l-2 border-ink-200 py-1.5 group hover:bg-white rounded-r">
      <span className="text-2xs font-mono text-ink-500 w-12 shrink-0">Task</span>
      <span className="text-[13px] text-ink-800 flex-1 truncate">{item.data.title}</span>
      <span className="chip">{item.data.priority}</span>
    </div>
  );
}

function CreateEventModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title: '', start: '', end: '', location: '' });
  const [submitting, setSubmitting] = useState(false);

  async function create() {
    if (!form.title || !form.start || !form.end) return;
    setSubmitting(true);
    try {
      await api.post('/events', {
        title: form.title,
        start_at: new Date(form.start).toISOString(),
        end_at: new Date(form.end).toISOString(),
        location: form.location,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink-950/30 grid place-items-center z-50" onClick={onClose}>
      <div className="card p-5 w-full max-w-md shadow-pop" onClick={e => e.stopPropagation()}>
        <h3 className="text-[15px] font-semibold mb-3">New event</h3>
        <div className="space-y-2">
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" />
          <input type="datetime-local" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} className="input" />
          <input type="datetime-local" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} className="input" />
          <input placeholder="Location (optional)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="input" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={create} disabled={submitting} className="btn-primary">
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
