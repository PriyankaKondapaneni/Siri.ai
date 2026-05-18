import { useEffect, useRef, useState } from 'react';
import {
  addDays, addMonths, endOfMonth, format, getDay, isSameDay, parse,
  startOfDay, startOfMonth, subMonths, nextSaturday, nextMonday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export type ScheduleValue = {
  date: string | null;
  time: string | null;
  duration: number | null;
  reminder: string | null;
  repeat: string | null;
};

export const EMPTY_SCHEDULE: ScheduleValue = {
  date: null, time: null, duration: null, reminder: null, repeat: null,
};

const DURATION_OPTIONS = [
  { value: null, label: 'No duration' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1h 30m' },
  { value: 120, label: '2 hours' },
];

const REMIND_OPTIONS = [
  { value: null, label: 'No remind' },
  { value: 'at-time', label: 'At time of task' },
  { value: '5min', label: '5 min before' },
  { value: '10min', label: '10 min before' },
  { value: '30min', label: '30 min before' },
  { value: '1hour', label: '1 hour before' },
  { value: '1day', label: '1 day before' },
];

const REPEAT_OPTIONS = [
  { value: null, label: "Doesn't repeat" },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function DatePicker({
  value,
  onChange,
  onClose,
  anchorRef,
}: {
  value: ScheduleValue;
  onChange: (v: ScheduleValue) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}) {
  const popRef = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(() =>
    value.date ? parse(value.date, 'yyyy-MM-dd', new Date()) : new Date()
  );
  const [timeEnabled, setTimeEnabled] = useState(!!value.time);
  const [repeatEnabled, setRepeatEnabled] = useState(!!value.repeat);
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);

  useEffect(() => {
    function compute() {
      if (!anchorRef.current) return;
      const r = anchorRef.current.getBoundingClientRect();
      const popW = 320;
      const margin = 12;
      let left = r.right - popW;
      if (left < 8) left = 8;
      if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;

      const below = window.innerHeight - r.bottom - margin;
      const above = r.top - margin;
      let top: number;
      let maxHeight: number;
      if (below >= 320 || below >= above) {
        top = r.bottom + 6;
        maxHeight = Math.max(220, below);
      } else {
        maxHeight = Math.max(220, above);
        top = Math.max(margin, r.top - maxHeight - 6);
      }
      setPos({ top, left, maxHeight });
    }
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [anchorRef]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (
        popRef.current && !popRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [anchorRef, onClose]);

  const today = startOfDay(new Date());
  const presets = [
    { label: 'Today', dow: format(today, 'EEE'), value: today },
    { label: 'Tomorrow', dow: format(addDays(today, 1), 'EEE'), value: addDays(today, 1) },
    { label: 'This weekend', dow: format(nextSaturday(today), 'EEE'), value: nextSaturday(today) },
    { label: 'Next week', dow: format(nextMonday(today), 'EEE'), value: nextMonday(today) },
  ];

  function pickDate(d: Date) {
    onChange({ ...value, date: format(d, 'yyyy-MM-dd') });
  }

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const firstDow = getDay(monthStart);
  const leadCount = firstDow;
  const gridStart = addDays(monthStart, -leadCount);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  if (!pos) return null;

  return (
    <div
      ref={popRef}
      className="fixed z-50 w-80 card shadow-pop overflow-y-auto bg-white"
      style={{ top: pos.top, left: pos.left, maxHeight: pos.maxHeight }}
    >
      <div className="px-4 pt-3 pb-2">
        {presets.map(p => (
          <button
            key={p.label}
            onClick={() => pickDate(p.value)}
            className="w-full flex items-center justify-between py-1.5 text-[13px] text-ink-800 hover:text-warm-600"
          >
            <span>{p.label}</span>
            <span className="text-ink-400">{p.dow}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-ink-150 px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setViewDate(subMonths(viewDate, 1))}
            className="icon-btn h-7 w-7"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[13px] font-medium text-ink-900">{format(viewDate, 'MMMM yyyy')}</span>
          <button
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="icon-btn h-7 w-7"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-2xs text-ink-400 font-medium py-1">{d}</div>
          ))}
          {cells.map((d, i) => {
            const inMonth = d >= monthStart && d <= monthEnd;
            const selected = value.date && isSameDay(d, parse(value.date, 'yyyy-MM-dd', new Date()));
            const todayFlag = isSameDay(d, today);
            return (
              <button
                key={i}
                onClick={() => pickDate(d)}
                className={clsx(
                  'h-7 w-full text-[12.5px] rounded-full transition-colors',
                  !inMonth && 'text-ink-300',
                  inMonth && !selected && !todayFlag && 'text-ink-800 hover:bg-ink-100',
                  todayFlag && !selected && 'text-warm-600 ring-1 ring-warm-400',
                  selected && 'bg-warm-500 text-white hover:bg-warm-600'
                )}
              >
                {format(d, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-ink-150 px-4 py-2.5">
        <ToggleRow label="Time" enabled={timeEnabled} onChange={(v) => {
          setTimeEnabled(v);
          if (!v) onChange({ ...value, time: null, duration: null, reminder: null });
          else if (!value.time) onChange({ ...value, time: '00:00' });
        }} />
        {timeEnabled && (
          <div className="space-y-1.5 mt-2">
            <Row label="At">
              <TimePicker
                value={value.time || '00:00'}
                onChange={(t) => onChange({ ...value, time: t })}
              />
            </Row>
            <Row label="Duration">
              <Select
                value={value.duration}
                options={DURATION_OPTIONS}
                onChange={(v) => onChange({ ...value, duration: v })}
              />
            </Row>
            <Row label="Remind">
              <Select
                value={value.reminder}
                options={REMIND_OPTIONS}
                onChange={(v) => onChange({ ...value, reminder: v })}
              />
            </Row>
          </div>
        )}
      </div>

      <div className="border-t border-ink-150 px-4 py-2.5">
        <ToggleRow label="Repeat" enabled={repeatEnabled} onChange={(v) => {
          setRepeatEnabled(v);
          if (!v) onChange({ ...value, repeat: null });
          else if (!value.repeat) onChange({ ...value, repeat: 'weekly' });
        }} />
        {repeatEnabled && (
          <div className="mt-2">
            <Row label="Every">
              <Select
                value={value.repeat}
                options={REPEAT_OPTIONS.filter(o => o.value)}
                onChange={(v) => onChange({ ...value, repeat: v as string })}
              />
            </Row>
          </div>
        )}
      </div>

      <div className="border-t border-ink-150 px-3 py-2 flex items-center justify-between">
        <button
          onClick={() => { onChange(EMPTY_SCHEDULE); setTimeEnabled(false); setRepeatEnabled(false); }}
          className="text-[12px] text-ink-500 hover:text-ink-900"
        >
          Clear
        </button>
        <button onClick={onClose} className="btn-secondary h-7 px-3 text-[12px]">Done</button>
      </div>
    </div>
  );
}

function ToggleRow({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-ink-800">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={clsx(
          'h-5 w-9 rounded-full transition-colors relative',
          enabled ? 'bg-warm-500' : 'bg-ink-200'
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-soft transition-all',
            enabled ? 'left-[18px]' : 'left-0.5'
          )}
        />
      </button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-ink-600">{label}</span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, m] = value.split(':');
  return (
    <>
      <NumberSelect
        value={parseInt(h, 10)}
        max={23}
        onChange={(v) => onChange(`${String(v).padStart(2, '0')}:${m}`)}
      />
      <span className="text-ink-500">:</span>
      <NumberSelect
        value={parseInt(m, 10)}
        max={59}
        step={5}
        onChange={(v) => onChange(`${h}:${String(v).padStart(2, '0')}`)}
      />
    </>
  );
}

function NumberSelect({ value, max, step = 1, onChange }: { value: number; max: number; step?: number; onChange: (v: number) => void }) {
  const opts = Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className="appearance-none bg-white border border-ink-200 rounded px-2 pr-6 py-1 text-[12px] text-ink-800 cursor-pointer hover:border-ink-300"
      >
        {opts.map(n => (
          <option key={n} value={n}>{String(n).padStart(2, '0')}</option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
    </div>
  );
}

function Select<T extends string | number | null>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value === null ? '__null' : String(value)}
        onChange={e => {
          const raw = e.target.value;
          if (raw === '__null') onChange(null as T);
          else {
            const opt = options.find(o => String(o.value) === raw);
            onChange((opt?.value ?? null) as T);
          }
        }}
        className="appearance-none bg-white border border-ink-200 rounded px-2 pr-6 py-1 text-[12px] text-ink-800 cursor-pointer hover:border-ink-300 min-w-[120px]"
      >
        {options.map(o => (
          <option key={String(o.value)} value={o.value === null ? '__null' : String(o.value)}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
    </div>
  );
}
