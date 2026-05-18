import { useMemo, useState } from 'react';
import { Task } from '../lib/api';
import { Search, X, Calendar as CalendarIcon, SlidersHorizontal } from 'lucide-react';
import { format, parse } from 'date-fns';
import clsx from 'clsx';

export default function SelectTasksModal({
  tasks, onClose, onConfirm, title = 'Select items',
}: {
  tasks: Task[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
  title?: string;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return tasks;
    return tasks.filter(t => t.title.toLowerCase().includes(q));
  }, [tasks, query]);

  const selectedTasks = useMemo(
    () => tasks.filter(t => selected.has(t.id)),
    [tasks, selected]
  );

  function toggle(id: string) {
    setSelected(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 bg-ink-950/30 z-50 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-2xl shadow-pop max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-ink-200 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>
          <button onClick={onClose} className="icon-btn">
            <X size={16} />
          </button>
        </header>

        <div className="px-5 pt-5 pb-3 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center gap-2 px-3 h-10 border border-ink-200 rounded-lg mb-4">
            <Search size={14} className="text-ink-400" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by keyword"
              className="flex-1 bg-transparent border-0 focus:outline-none text-[13px]"
            />
            <button className="icon-btn h-7 w-7">
              <SlidersHorizontal size={13} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto border border-ink-200 rounded-lg mb-3 min-h-[120px]">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-[13px] text-ink-400">
                {query ? 'No matches.' : 'No tasks available.'}
              </div>
            ) : (
              filtered.map(t => (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-ink-50 border-b border-ink-150 last:border-b-0"
                >
                  <span className={clsx(
                    'h-4 w-4 rounded-full border-2 grid place-items-center shrink-0',
                    selected.has(t.id) ? 'bg-warm-500 border-warm-500' : 'border-ink-300'
                  )}>
                    {selected.has(t.id) && (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="text-[13px] text-ink-900 flex-1 text-left truncate">{t.title}</span>
                  {t.due_date && (
                    <span className="inline-flex items-center gap-1 text-2xs text-ink-500 shrink-0">
                      <CalendarIcon size={10} />
                      {format(parse(t.due_date, 'yyyy-MM-dd', new Date()), 'MMM d')}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="border border-ink-200 rounded-lg p-3">
            <div className="text-[12px] text-ink-700 font-medium mb-2">
              Selected ({selected.size})
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[40px]">
              {selectedTasks.length === 0 ? (
                <span className="text-2xs text-ink-400 italic self-center">Nothing selected yet.</span>
              ) : (
                selectedTasks.map(t => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-ink-100 rounded text-2xs text-ink-700"
                  >
                    {t.title}
                    <button
                      onClick={() => toggle(t.id)}
                      className="text-ink-400 hover:text-ink-900"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-ink-200 flex justify-end">
          <button
            onClick={() => onConfirm(Array.from(selected))}
            disabled={selected.size === 0}
            className={clsx(
              'px-5 h-9 rounded-md text-[13px] font-medium transition',
              selected.size === 0
                ? 'bg-warm-200 text-white cursor-not-allowed'
                : 'bg-warm-500 text-white hover:bg-warm-600'
            )}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
