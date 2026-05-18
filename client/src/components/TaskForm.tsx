import { useRef, useState } from 'react';
import { format, parse } from 'date-fns';
import { Calendar as CalendarIcon, Clock, FileText, Flag, Pencil } from 'lucide-react';
import clsx from 'clsx';
import { api, Task } from '../lib/api';
import DatePicker, { ScheduleValue } from './DatePicker';
import Popover from './Popover';

export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function TaskForm({
  existing, defaultDate, parentId, defaultStarred, defaultList, onCancel, onSaved,
}: {
  existing?: Task;
  defaultDate?: string | null;
  parentId?: string;
  defaultStarred?: boolean;
  defaultList?: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(existing?.title || '');
  const [schedule, setSchedule] = useState<ScheduleValue>(() => ({
    date: existing?.due_date ?? defaultDate ?? null,
    time: existing?.due_time ?? null,
    duration: existing?.duration ?? null,
    reminder: existing?.reminder ?? null,
    repeat: existing?.repeat_rule ?? null,
  }));
  const [priority, setPriority] = useState<Task['priority']>(existing?.priority || 'none');
  const [showDate, setShowDate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dateBtnRef = useRef<HTMLButtonElement>(null);

  const isEdit = !!existing;

  async function submit() {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const body: any = {
        title: title.trim(),
        due_date: schedule.date,
        due_time: schedule.time,
        duration: schedule.duration,
        reminder: schedule.reminder,
        repeat_rule: schedule.repeat,
        priority,
      };
      if (isEdit) {
        await api.patch(`/tasks/${existing!.id}`, body);
      } else {
        await api.post('/tasks', {
          ...body,
          list: defaultList || (schedule.date === format(new Date(), 'yyyy-MM-dd') ? 'today' : 'inbox'),
          parent_id: parentId || null,
          starred: defaultStarred ? 1 : 0,
        });
      }
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  const dateLabel = schedule.date
    ? format(parse(schedule.date, 'yyyy-MM-dd', new Date()), 'MMM d')
    : 'Date';

  const showTime = schedule.time && schedule.time !== '00:00';
  const timeOrDurationLabel = schedule.duration
    ? formatDuration(schedule.duration)
    : showTime ? schedule.time : null;

  return (
    <div className="card border-ink-200 overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="h-4 w-4 rounded-full border-2 border-ink-300 shrink-0" />
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && title.trim()) submit();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder={parentId ? 'Add a sub-task' : 'Add a task'}
          className="flex-1 bg-transparent border-0 focus:outline-none text-[13px] placeholder-ink-400"
        />
        {timeOrDurationLabel && (
          <button
            onClick={() => setShowDate(true)}
            className="inline-flex items-center gap-1 text-2xs text-ink-600 hover:text-ink-900"
          >
            <Clock size={11} />
            {timeOrDurationLabel}
          </button>
        )}
        <button
          ref={dateBtnRef}
          onClick={() => setShowDate(s => !s)}
          className="inline-flex items-center gap-1 text-2xs text-ink-600 hover:text-ink-900"
        >
          <CalendarIcon size={11} />
          {dateLabel}
        </button>
        <PriorityFlag value={priority} onChange={setPriority} />
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-ink-150 bg-ink-50/50">
        <div className="flex items-center gap-1.5 text-2xs text-ink-500">
          <FileText size={11} />
          <span>{schedule.date || format(new Date(), 'yyyy-MM-dd')}</span>
          <button onClick={() => setShowDate(true)} className="icon-btn h-5 w-5">
            <Pencil size={10} />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onCancel} className="px-3 h-7 rounded-md bg-ink-100 text-ink-700 text-[12px] font-medium hover:bg-ink-200">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!title.trim() || submitting}
            className={clsx(
              'px-3 h-7 rounded-md text-[12px] font-medium transition',
              !title.trim() || submitting
                ? 'bg-warm-200 text-white cursor-not-allowed'
                : 'bg-warm-500 text-white hover:bg-warm-600'
            )}
          >
            {isEdit ? 'Update' : 'Add'}
          </button>
        </div>
      </div>

      {showDate && (
        <DatePicker
          value={schedule}
          onChange={setSchedule}
          onClose={() => setShowDate(false)}
          anchorRef={dateBtnRef}
        />
      )}
    </div>
  );
}

export function PriorityFlag({ value, onChange }: { value: Task['priority']; onChange: (p: Task['priority']) => void }) {
  const color =
    value === 'high' ? 'text-warm-600' :
    value === 'medium' ? 'text-ink-700' :
    value === 'low' ? 'text-ink-400' :
    'text-ink-300';

  return (
    <Popover
      width={140}
      trigger={(open, toggle, ref) => (
        <button ref={ref} onClick={toggle} className={clsx('icon-btn h-6 w-6', color)}>
          <Flag size={12} fill={value !== 'none' ? 'currentColor' : 'none'} />
        </button>
      )}
    >
      {(close) => (
        <div className="py-1">
          {(['high', 'medium', 'low', 'none'] as const).map(p => (
            <button
              key={p}
              onClick={() => { onChange(p); close(); }}
              className="w-full text-left px-3 py-1.5 text-[12px] flex items-center gap-2 hover:bg-ink-100"
            >
              <Flag
                size={11}
                className={
                  p === 'high' ? 'text-warm-600' :
                  p === 'medium' ? 'text-ink-700' :
                  p === 'low' ? 'text-ink-400' : 'text-ink-300'
                }
                fill={p !== 'none' ? 'currentColor' : 'none'}
              />
              <span className="capitalize">{p === 'none' ? 'No priority' : p}</span>
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
