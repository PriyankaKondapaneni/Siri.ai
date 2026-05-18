import { useEffect, useMemo, useState } from 'react';
import { api, Event } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfWeek, endOfWeek, addDays, format, isSameDay, addWeeks, subWeeks,
} from 'date-fns';

export default function CalendarPage() {
  const [anchor, setAnchor] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', start: '', end: '', location: '' });

  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  const end = endOfWeek(anchor, { weekStartsOn: 1 });
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start]);

  async function load() {
    const { events } = await api.get<{ events: Event[] }>(
      `/events?from=${start.toISOString()}&to=${end.toISOString()}`
    );
    setEvents(events);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [anchor]);

  async function createEvent() {
    if (!form.title || !form.start || !form.end) return;
    await api.post('/events', {
      title: form.title,
      start_at: new Date(form.start).toISOString(),
      end_at: new Date(form.end).toISOString(),
      location: form.location,
    });
    setShowCreate(false);
    setForm({ title: '', start: '', end: '', location: '' });
    load();
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader
        title="Calendar"
        subtitle={`${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setAnchor(subWeeks(anchor, 1))} className="btn-ghost p-2">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setAnchor(new Date())} className="btn-secondary">Today</button>
            <button onClick={() => setAnchor(addWeeks(anchor, 1))} className="btn-ghost p-2">
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} /> New event
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 bg-ink-50">
        <div className="grid grid-cols-7 gap-3">
          {days.map(d => {
            const dayEvents = events
              .filter(e => isSameDay(new Date(e.start_at), d))
              .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
            const isToday = isSameDay(d, new Date());
            return (
              <div key={d.toISOString()} className="card min-h-[400px] flex flex-col">
                <div className={`p-3 border-b border-ink-200 ${isToday ? 'bg-brand-50' : ''}`}>
                  <div className="text-xs uppercase tracking-wide text-ink-500">{format(d, 'EEE')}</div>
                  <div className={`text-xl font-semibold ${isToday ? 'text-brand-700' : 'text-ink-900'}`}>
                    {format(d, 'd')}
                  </div>
                </div>
                <div className="flex-1 p-2 space-y-1.5">
                  {dayEvents.length === 0 && (
                    <div className="text-xs text-ink-300 italic px-1">No events</div>
                  )}
                  {dayEvents.map(ev => (
                    <div
                      key={ev.id}
                      className={`p-2 rounded text-xs border-l-2 ${
                        ev.color === 'emerald' ? 'bg-emerald-50 border-emerald-500' :
                        ev.color === 'amber' ? 'bg-amber-50 border-amber-500' :
                        ev.color === 'rose' ? 'bg-rose-50 border-rose-500' :
                        'bg-brand-50 border-brand-500'
                      }`}
                    >
                      <div className="font-medium text-ink-900 truncate">{ev.title}</div>
                      <div className="text-ink-500">{format(new Date(ev.start_at), 'h:mm a')}</div>
                      {ev.location && <div className="text-ink-400 truncate">{ev.location}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-ink-900/40 grid place-items-center z-50" onClick={() => setShowCreate(false)}>
          <div className="card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">New event</h3>
            <div className="space-y-3">
              <input
                placeholder="Title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="input"
              />
              <input
                type="datetime-local"
                value={form.start}
                onChange={e => setForm({ ...form, start: e.target.value })}
                className="input"
              />
              <input
                type="datetime-local"
                value={form.end}
                onChange={e => setForm({ ...form, end: e.target.value })}
                className="input"
              />
              <input
                placeholder="Location (optional)"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="input"
              />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={createEvent} className="btn-primary">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
