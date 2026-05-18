import { useEffect, useMemo, useState } from 'react';
import { api, Task } from '../lib/api';
import { useUI } from '../store/ui';
import Popover from './Popover';
import TaskForm, { PriorityFlag } from './TaskForm';
import {
  Plus, ChevronDown, ChevronRight, ChevronLeft, Target, X, CheckSquare,
  Calendar as CalendarIcon, ArrowUpDown, FolderOpen, Trash2, ListTodo,
} from 'lucide-react';
import { format, parse, isSameDay, startOfDay } from 'date-fns';
import clsx from 'clsx';

type FilterView = 'starred' | 'today' | 'all';
type SortKey = 'due' | 'priority' | 'created';

export default function FocusBox() {
  const { focusOpen } = useUI();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<FilterView>('starred');
  const [sort, setSort] = useState<SortKey>('due');

  async function load() {
    const { tasks } = await api.get<{ tasks: Task[] }>(`/tasks?status=pending`);
    setTasks(tasks);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = tasks.filter(t => !t.parent_id);
    if (view === 'starred') list = list.filter(t => t.starred);
    if (view === 'today') list = list.filter(t => t.list === 'today' || (t.due_date && isSameDay(parse(t.due_date, 'yyyy-MM-dd', new Date()), startOfDay(new Date()))));

    list.sort((a, b) => {
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
    });
    return list;
  }, [tasks, view, sort]);

  async function patch(t: Task, updates: Partial<Task>) {
    await api.patch(`/tasks/${t.id}`, updates);
    load();
  }

  async function remove(t: Task) {
    await api.delete(`/tasks/${t.id}`);
    load();
  }

  if (!focusOpen) return null;

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
          <OptionsMenu
            view={view}
            setView={setView}
            sort={sort}
            setSort={setSort}
            onAdd={() => setAdding(true)}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {adding && (
          <div className="mb-2">
            <TaskForm
              defaultDate={view === 'today' ? format(new Date(), 'yyyy-MM-dd') : undefined}
              defaultStarred={view === 'starred'}
              defaultList={view === 'today' ? 'today' : undefined}
              onCancel={() => setAdding(false)}
              onSaved={() => { setAdding(false); load(); }}
            />
          </div>
        )}

        <div className="space-y-1.5">
          {filtered.map(t => (
            <FocusTaskCard key={t.id} task={t} onPatch={patch} onRemove={remove} />
          ))}

          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="w-full card p-3 text-ink-400 hover:text-ink-700 hover:border-ink-300 flex items-center gap-1.5 text-[13px] transition"
            >
              <Plus size={13} />
              Add Task
            </button>
          )}

          {filtered.length === 0 && !adding && (
            <div className="text-center mt-6 text-[12px] text-ink-400">
              {view === 'starred' && 'No focused tasks. Star a task to bring it here.'}
              {view === 'today' && 'Nothing scheduled for today.'}
              {view === 'all' && 'No open tasks.'}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function FocusTaskCard({
  task, onPatch, onRemove,
}: { task: Task; onPatch: (t: Task, u: Partial<Task>) => void; onRemove: (t: Task) => void }) {
  return (
    <div className="group card p-2.5 hover:border-ink-300 transition">
      <div className="flex items-start gap-2">
        <button
          onClick={() => onPatch(task, { status: task.status === 'done' ? 'pending' : 'done' })}
          className={clsx(
            'h-4 w-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition',
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
            'text-[13px]',
            task.status === 'done' ? 'line-through text-ink-400' : 'text-ink-900'
          )}>
            {task.title}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {task.due_date && (
              <span className="inline-flex items-center gap-1 text-2xs text-ink-500">
                <CalendarIcon size={9} />
                {format(parse(task.due_date, 'yyyy-MM-dd', new Date()), 'MMM d')}
              </span>
            )}
            {task.priority !== 'none' && task.priority !== 'medium' && (
              <span className={clsx(
                'text-2xs px-1 rounded',
                task.priority === 'high' ? 'bg-warm-100 text-warm-700' : 'bg-ink-100 text-ink-500'
              )}>
                {task.priority}
              </span>
            )}
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <PriorityFlag value={task.priority} onChange={(p) => onPatch(task, { priority: p })} />
        </div>
        <button
          onClick={() => onRemove(task)}
          className="text-ink-300 hover:text-warm-600 opacity-0 group-hover:opacity-100 transition mt-0.5"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

function OptionsMenu({
  view, setView, sort, setSort, onAdd,
}: {
  view: FilterView;
  setView: (v: FilterView) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  onAdd: () => void;
}) {
  return (
    <Popover
      width={180}
      trigger={(open, toggle, ref) => (
        <button
          ref={ref}
          onClick={toggle}
          className="inline-flex items-center gap-1 px-2.5 h-7 rounded-md border border-ink-200 bg-white text-[12px] text-ink-700 hover:bg-ink-50"
        >
          Option <ChevronDown size={11} className="text-ink-400" />
        </button>
      )}
    >
      {(close) => (
        <OptionsContent
          view={view}
          setView={setView}
          sort={sort}
          setSort={setSort}
          onAdd={onAdd}
          close={close}
        />
      )}
    </Popover>
  );
}

function OptionsContent({
  view, setView, sort, setSort, onAdd, close,
}: {
  view: FilterView;
  setView: (v: FilterView) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  onAdd: () => void;
  close: () => void;
}) {
  const [pane, setPane] = useState<'main' | 'sort' | 'open'>('main');

  if (pane === 'main') {
    return (
      <div className="py-1">
        <MenuRow icon={<Plus size={13} />} label="Add" onClick={() => { onAdd(); close(); }} />
        <MenuRow icon={<CheckSquare size={13} />} label="Select" onClick={close} />
        <MenuRow
          icon={<ArrowUpDown size={13} />}
          label="Sort by"
          trailing={<ChevronRight size={11} className="text-ink-400" />}
          onClick={() => setPane('sort')}
        />
        <MenuRow
          icon={<FolderOpen size={13} />}
          label="Open"
          trailing={<ChevronRight size={11} className="text-ink-400" />}
          onClick={() => setPane('open')}
        />
      </div>
    );
  }

  if (pane === 'sort') {
    return (
      <div className="py-1">
        <BackRow label="Sort by" onClick={() => setPane('main')} />
        <div className="my-1 border-t border-ink-150" />
        <RadioRow label="Due date" active={sort === 'due'} onClick={() => { setSort('due'); close(); }} />
        <RadioRow label="Priority" active={sort === 'priority'} onClick={() => { setSort('priority'); close(); }} />
        <RadioRow label="Created" active={sort === 'created'} onClick={() => { setSort('created'); close(); }} />
      </div>
    );
  }

  return (
    <div className="py-1">
      <BackRow label="Open" onClick={() => setPane('main')} />
      <div className="my-1 border-t border-ink-150" />
      <RadioRow label="Starred" active={view === 'starred'} onClick={() => { setView('starred'); close(); }} />
      <RadioRow label="Today" active={view === 'today'} onClick={() => { setView('today'); close(); }} />
      <RadioRow label="All open" active={view === 'all'} onClick={() => { setView('all'); close(); }} />
    </div>
  );
}

function MenuRow({
  icon, label, trailing, onClick,
}: { icon: React.ReactNode; label: string; trailing?: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 text-[13px] flex items-center gap-2 hover:bg-ink-100"
    >
      <span className="text-ink-500">{icon}</span>
      <span className="flex-1 text-ink-800">{label}</span>
      {trailing}
    </button>
  );
}

function BackRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 text-[12px] flex items-center gap-1 text-ink-500 hover:text-ink-900"
    >
      <ChevronLeft size={11} />
      <span>{label}</span>
    </button>
  );
}

function RadioRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left px-3 py-1.5 text-[13px] flex items-center gap-2 hover:bg-ink-100',
        active && 'bg-ink-100 text-ink-900 font-medium'
      )}
    >
      <span className={clsx(
        'h-3 w-3 rounded-full border-2',
        active ? 'border-warm-500 bg-warm-500' : 'border-ink-300'
      )} />
      <span>{label}</span>
    </button>
  );
}
