import { useEffect, useMemo, useRef, useState } from 'react';
import { api, Task } from '../lib/api';
import TopBar from '../components/TopBar';
import DatePicker, { ScheduleValue } from '../components/DatePicker';
import Popover from '../components/Popover';
import {
  Search, ChevronDown, ChevronUp, ChevronRight, CheckSquare, Flag,
  Calendar as CalendarIcon, Clock, Pencil, FileText, Target, Trash2,
  Plus, ListTree,
} from 'lucide-react';
import { format, isPast, isSameDay, parse, startOfDay } from 'date-fns';
import clsx from 'clsx';

type Sort = 'created' | 'due' | 'priority';
type Filter = 'all' | 'pending' | 'done';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sort, setSort] = useState<Sort>('due');
  const [filter, setFilter] = useState<Filter>('pending');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    const { tasks } = await api.get<{ tasks: Task[] }>(`/tasks?${params.toString()}`);
    setTasks(tasks);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  async function patch(t: Task, updates: Partial<Task>) {
    const { task } = await api.patch<{ task: Task }>(`/tasks/${t.id}`, updates);
    setTasks(prev => prev.map(x => x.id === task.id ? task : x));
  }

  async function remove(t: Task) {
    await api.delete(`/tasks/${t.id}`);
    setTasks(prev => prev.filter(x => x.id !== t.id && x.parent_id !== t.id));
  }

  const childrenMap = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.parent_id) continue;
      const arr = m.get(t.parent_id) || [];
      arr.push(t);
      m.set(t.parent_id, arr);
    }
    return m;
  }, [tasks]);

  const grouped = useMemo(() => {
    const today = startOfDay(new Date());
    const todayList: Task[] = [];
    const overdueList: Task[] = [];
    const upcomingList: Task[] = [];
    const othersList: Task[] = [];

    const topLevel = tasks.filter(t => !t.parent_id);
    const filtered = search
      ? topLevel.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
      : topLevel;

    for (const t of filtered) {
      if (!t.due_date) { othersList.push(t); continue; }
      const d = parse(t.due_date, 'yyyy-MM-dd', new Date());
      if (isSameDay(d, today)) todayList.push(t);
      else if (isPast(d) && !isSameDay(d, today)) overdueList.push(t);
      else upcomingList.push(t);
    }

    const cmp = (a: Task, b: Task) => {
      if (sort === 'due') {
        const ad = a.due_date ? parse(a.due_date, 'yyyy-MM-dd', new Date()).getTime() : Infinity;
        const bd = b.due_date ? parse(b.due_date, 'yyyy-MM-dd', new Date()).getTime() : Infinity;
        return ad - bd;
      }
      if (sort === 'priority') {
        const w = { high: 0, medium: 1, low: 2, none: 3 };
        return (w[a.priority] ?? 4) - (w[b.priority] ?? 4);
      }
      return b.created_at - a.created_at;
    };

    [todayList, overdueList, upcomingList, othersList].forEach(l => l.sort(cmp));

    const sections: { key: string; label: string; tasks: Task[] }[] = [];
    if (overdueList.length) sections.push({ key: 'overdue', label: 'Overdue', tasks: overdueList });
    sections.push({ key: 'today', label: 'Today', tasks: todayList });
    if (upcomingList.length) sections.push({ key: 'upcoming', label: 'Upcoming', tasks: upcomingList });
    sections.push({ key: 'others', label: 'Others', tasks: othersList });
    return sections;
  }, [tasks, search, sort]);

  return (
    <>
      <TopBar />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Tasks</h1>
            <div className="flex items-center gap-1">
              <SearchControl show={showSearch} value={search} onToggle={() => setShowSearch(v => !v)} onChange={setSearch} />
              <DropdownLabel
                icon={<SortIcon />}
                label="Sort by"
                current={sort}
                onChange={(v) => setSort(v as Sort)}
                options={[
                  { value: 'due', label: 'Due date' },
                  { value: 'priority', label: 'Priority' },
                  { value: 'created', label: 'Created' },
                ]}
              />
              <DropdownLabel
                icon={<FilterIcon />}
                label="Filter by"
                current={filter}
                onChange={(v) => setFilter(v as Filter)}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'done', label: 'Done' },
                  { value: 'all', label: 'All' },
                ]}
              />
            </div>
          </div>

          <div className="space-y-4">
            {grouped.map(s => (
              <Section
                key={s.key}
                label={s.label}
                tasks={s.tasks}
                collapsed={!!collapsed[s.key]}
                onToggleCollapse={() => setCollapsed(c => ({ ...c, [s.key]: !c[s.key] }))}
                defaultDate={s.key === 'today' ? format(new Date(), 'yyyy-MM-dd') : null}
                editingId={editingId}
                setEditingId={setEditingId}
                childrenMap={childrenMap}
                reload={load}
                onPatch={patch}
                onRemove={remove}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Section({
  label, tasks, collapsed, onToggleCollapse, defaultDate,
  editingId, setEditingId, childrenMap, reload, onPatch, onRemove,
}: {
  label: string;
  tasks: Task[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  defaultDate: string | null;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  childrenMap: Map<string, Task[]>;
  reload: () => void;
  onPatch: (t: Task, u: Partial<Task>) => void;
  onRemove: (t: Task) => void;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-150">
        <div className="flex items-center gap-2">
          <button onClick={onToggleCollapse} className="icon-btn h-6 w-6">
            {collapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <span className="text-[14px] font-semibold text-ink-900">{label}</span>
          <span className="text-2xs text-ink-400">{tasks.length}</span>
          <button className="ml-2 inline-flex items-center gap-1 text-[12px] text-ink-500 hover:text-ink-900">
            <CheckSquare size={12} /> Select
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          <button className="icon-btn h-6 w-6" title="Ask AI"><AskAIDot /></button>
          <button className="icon-btn h-6 w-6" title="Focus"><Target size={12} /></button>
          <button className="icon-btn h-6 w-6" title="Edit"><Pencil size={12} /></button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div>
            {tasks.length === 0 && !adding && (
              <div className="px-4 py-2 text-[12px] text-ink-400 italic">No tasks</div>
            )}
            {tasks.map(t => (
              editingId === t.id ? (
                <TaskForm
                  key={t.id}
                  existing={t}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => { setEditingId(null); reload(); }}
                />
              ) : (
                <TaskItem
                  key={t.id}
                  task={t}
                  subTasks={childrenMap.get(t.id) || []}
                  onPatch={onPatch}
                  onRemove={onRemove}
                  onEdit={() => setEditingId(t.id)}
                  editingId={editingId}
                  setEditingId={setEditingId}
                  reload={reload}
                />
              )
            ))}
          </div>

          <div className="px-3 py-2 border-t border-ink-150">
            {adding ? (
              <TaskForm
                defaultDate={defaultDate}
                onCancel={() => setAdding(false)}
                onSaved={() => { setAdding(false); reload(); }}
              />
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="w-full text-left flex items-center gap-1.5 px-2 py-1.5 rounded text-[13px] text-ink-500 hover:text-ink-900 hover:bg-ink-50 transition"
              >
                <Plus size={13} />
                Add Task
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TaskItem({
  task, subTasks, onPatch, onRemove, onEdit, editingId, setEditingId, reload, depth = 0,
}: {
  task: Task;
  subTasks: Task[];
  onPatch: (t: Task, u: Partial<Task>) => void;
  onRemove: (t: Task) => void;
  onEdit: () => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  reload: () => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [addingSub, setAddingSub] = useState(false);
  const hasSubs = subTasks.length > 0;

  function startAddSub() {
    setExpanded(true);
    setAddingSub(true);
  }

  return (
    <div className="border-b border-ink-150 last:border-b-0">
      <div
        onClick={onEdit}
        className={clsx(
          'group flex items-start gap-3 px-4 py-2 hover:bg-ink-50 cursor-pointer',
          depth > 0 && 'pl-12'
        )}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onPatch(task, { status: task.status === 'done' ? 'pending' : 'done' }); }}
          className={clsx(
            'h-4 w-4 rounded-full border-2 grid place-items-center shrink-0 transition mt-0.5',
            task.status === 'done' ? 'bg-ink-900 border-ink-900' : 'border-ink-300 hover:border-ink-700'
          )}
        >
          {task.status === 'done' && (
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className={clsx(
            'text-[13px] truncate',
            task.status === 'done' ? 'line-through text-ink-400' : 'text-ink-900'
          )}>
            {task.title}
          </div>
          {hasSubs && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
              className="mt-0.5 inline-flex items-center gap-1 text-2xs text-ink-400 hover:text-ink-700"
            >
              {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              <ListTree size={11} />
              {subTasks.length} sub-tasks
            </button>
          )}
        </div>

        {task.repeat_rule && (
          <span className="text-2xs text-ink-400 mt-0.5" title={`Repeats ${task.repeat_rule}`}>↻</span>
        )}
        <div className="mt-0.5"><ScheduleSummary task={task} /></div>
        <div className="mt-0.5" onClick={(e) => e.stopPropagation()}>
          <PriorityFlag value={task.priority} onChange={(p) => onPatch(task, { priority: p })} />
        </div>
        {depth === 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); startAddSub(); }}
            className="icon-btn h-6 w-6 text-ink-300 hover:text-ink-700 opacity-0 group-hover:opacity-100"
            title="Add sub-task"
          >
            <Plus size={12} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(task); }}
          className="icon-btn h-6 w-6 text-ink-300 hover:text-warm-600 opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {expanded && depth === 0 && (
        <div className="bg-ink-50/40">
          {subTasks.map(sub => (
            editingId === sub.id ? (
              <div key={sub.id} className="px-4 py-2 pl-12">
                <TaskForm
                  existing={sub}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => { setEditingId(null); reload(); }}
                />
              </div>
            ) : (
              <TaskItem
                key={sub.id}
                task={sub}
                subTasks={[]}
                onPatch={onPatch}
                onRemove={onRemove}
                onEdit={() => setEditingId(sub.id)}
                editingId={editingId}
                setEditingId={setEditingId}
                reload={reload}
                depth={1}
              />
            )
          ))}
          {addingSub && (
            <div className="px-4 py-2 pl-12">
              <TaskForm
                parentId={task.id}
                defaultDate={task.due_date || undefined}
                onCancel={() => setAddingSub(false)}
                onSaved={() => { setAddingSub(false); reload(); }}
              />
            </div>
          )}
          {!addingSub && (
            <button
              onClick={() => setAddingSub(true)}
              className="w-full text-left pl-12 pr-4 py-1.5 flex items-center gap-1.5 text-[12px] text-ink-500 hover:text-ink-900 hover:bg-ink-50"
            >
              <Plus size={11} />
              Add sub-task
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ScheduleSummary({ task }: { task: Task }) {
  if (!task.due_date && !task.duration && !task.due_time) return null;
  const today = startOfDay(new Date());

  let dateBadge: React.ReactNode = null;
  if (task.due_date) {
    const d = parse(task.due_date, 'yyyy-MM-dd', new Date());
    const overdue = isPast(d) && !isSameDay(d, today);
    const label = isSameDay(d, today) ? 'Today' : format(d, 'MMM d');
    dateBadge = (
      <span className={clsx(
        'inline-flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded',
        overdue ? 'bg-warm-100 text-warm-700' : 'text-ink-500'
      )}>
        <CalendarIcon size={10} />
        {label}
      </span>
    );
  }

  const showTime = task.due_time && task.due_time !== '00:00';
  const timeOrDuration = task.duration
    ? formatDuration(task.duration)
    : showTime ? task.due_time : null;

  return (
    <div className="inline-flex items-center gap-1.5">
      {timeOrDuration && (
        <span className="inline-flex items-center gap-1 text-2xs text-ink-500">
          <Clock size={10} /> {timeOrDuration}
        </span>
      )}
      {dateBadge}
    </div>
  );
}

function TaskForm({
  existing, defaultDate, parentId, onCancel, onSaved,
}: {
  existing?: Task;
  defaultDate?: string | null;
  parentId?: string;
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
          list: schedule.date === format(new Date(), 'yyyy-MM-dd') ? 'today' : 'inbox',
          parent_id: parentId || null,
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

function PriorityFlag({ value, onChange }: { value: Task['priority']; onChange: (p: Task['priority']) => void }) {
  const color =
    value === 'high' ? 'text-warm-600' :
    value === 'medium' ? 'text-ink-700' :
    value === 'low' ? 'text-ink-400' :
    'text-ink-300';

  return (
    <Popover
      width={128}
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

function SearchControl({
  show, value, onToggle, onChange,
}: { show: boolean; value: string; onToggle: () => void; onChange: (v: string) => void }) {
  return (
    <div className={clsx('flex items-center', show && 'bg-ink-100 rounded-md pr-2')}>
      <button onClick={onToggle} className="icon-btn">
        <Search size={13} />
      </button>
      {show ? (
        <input
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Search tasks…"
          className="bg-transparent border-0 focus:outline-none text-[13px] placeholder-ink-400 w-44"
        />
      ) : (
        <button onClick={onToggle} className="text-[13px] text-ink-600 hover:text-ink-900 mr-1">
          Search
        </button>
      )}
    </div>
  );
}

function DropdownLabel({
  icon, label, current, onChange, options,
}: {
  icon: React.ReactNode;
  label: string;
  current: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Popover
      width={144}
      trigger={(open, toggle, ref) => (
        <button
          ref={ref}
          onClick={toggle}
          className="inline-flex items-center gap-1 px-2 h-8 text-[13px] text-ink-600 hover:text-ink-900 hover:bg-ink-100 rounded-md"
        >
          {icon}
          {label}
          <ChevronDown size={11} className="text-ink-400" />
        </button>
      )}
    >
      {(close) => (
        <div className="py-1">
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); close(); }}
              className={clsx(
                'w-full text-left px-3 py-1.5 text-[12px] hover:bg-ink-100',
                current === o.value && 'bg-ink-100 text-ink-900 font-medium'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

function SortIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 5h10M4 8h8M5 11h6M5 13l-2-2M5 13V3" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2 4h12M4 8h8M6 12h4" />
    </svg>
  );
}

function AskAIDot() {
  return (
    <div className="h-4 w-4 rounded-full border border-ink-300 grid place-items-center">
      <span className="text-[8px] font-semibold text-ink-500">S</span>
    </div>
  );
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
