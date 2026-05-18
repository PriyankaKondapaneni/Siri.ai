import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../store/ui';
import {
  Sun, Inbox, ListTodo, NotebookText, Calendar, Sparkles, Settings,
  Plus, Search, Search as SearchIcon,
} from 'lucide-react';
import { api } from '../lib/api';

type Item = {
  id: string;
  label: string;
  hint?: string;
  icon: any;
  action: () => void | Promise<void>;
  group: string;
};

export default function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUI();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandOpen) {
      setQuery('');
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [commandOpen]);

  const items: Item[] = [
    { id: 'g-today', label: 'Today', icon: Sun, action: () => navigate('/today'), group: 'Go to' },
    { id: 'g-inbox', label: 'Inbox', icon: Inbox, action: () => navigate('/inbox'), group: 'Go to' },
    { id: 'g-tasks', label: 'Tasks', icon: ListTodo, action: () => navigate('/tasks'), group: 'Go to' },
    { id: 'g-notes', label: 'Notes', icon: NotebookText, action: () => navigate('/notes'), group: 'Go to' },
    { id: 'g-cal', label: 'Calendar', icon: Calendar, action: () => navigate('/calendar'), group: 'Go to' },
    { id: 'g-chat', label: 'Ask Siri (full view)', icon: Sparkles, action: () => navigate('/chat'), group: 'Go to' },
    { id: 'g-set', label: 'Settings', icon: Settings, action: () => navigate('/settings'), group: 'Go to' },
    {
      id: 'c-task', label: 'New task', hint: 'Quick capture', icon: Plus,
      action: async () => {
        const title = prompt('Task title');
        if (title) {
          await api.post('/tasks', { title, list: 'inbox' });
          navigate('/tasks');
        }
      },
      group: 'Create',
    },
    {
      id: 'c-note', label: 'New note', icon: Plus,
      action: async () => {
        const { note } = await api.post<{ note: { id: string } }>('/notes', { title: 'Untitled', content: '' });
        navigate(`/notes/${note.id}`);
      },
      group: 'Create',
    },
    {
      id: 'a-plan', label: 'Plan my day', icon: Sparkles,
      action: () => navigate('/today'),
      group: 'AI',
    },
  ];

  const filtered = query
    ? items.filter(i => (i.label + ' ' + i.group).toLowerCase().includes(query.toLowerCase()))
    : items;

  const grouped: Record<string, Item[]> = {};
  for (const it of filtered) {
    if (!grouped[it.group]) grouped[it.group] = [];
    grouped[it.group].push(it);
  }
  const flat = filtered;

  function pick(i: Item) {
    setCommandOpen(false);
    setTimeout(() => i.action(), 0);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, flat.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); flat[highlight] && pick(flat[highlight]); }
    if (e.key === 'Escape') setCommandOpen(false);
  }

  if (!commandOpen) return null;

  let flatIdx = -1;
  return (
    <div
      className="fixed inset-0 bg-ink-950/30 z-50 flex items-start justify-center pt-24 px-4"
      onClick={() => setCommandOpen(false)}
    >
      <div
        className="w-full max-w-xl card shadow-pop overflow-hidden fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 border-b border-ink-200">
          <SearchIcon size={14} className="text-ink-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setHighlight(0); }}
            onKeyDown={onKey}
            placeholder="Search or jump to…"
            className="flex-1 bg-transparent border-0 focus:outline-none py-3 text-[13px] placeholder-ink-400"
          />
          <span className="kbd">esc</span>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {Object.entries(grouped).map(([group, list]) => (
            <div key={group}>
              <div className="px-3 pt-2 pb-1 text-2xs uppercase tracking-wider text-ink-400 font-medium">
                {group}
              </div>
              {list.map(item => {
                flatIdx++;
                const active = flatIdx === highlight;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHighlight(flat.indexOf(item))}
                    onClick={() => pick(item)}
                    className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer ${active ? 'bg-ink-100' : ''}`}
                  >
                    <item.icon size={14} className="text-ink-500" />
                    <span className="text-[13px] text-ink-900 flex-1">{item.label}</span>
                    {item.hint && <span className="text-2xs text-ink-400">{item.hint}</span>}
                  </div>
                );
              })}
            </div>
          ))}
          {flat.length === 0 && (
            <div className="px-3 py-8 text-center text-xs text-ink-400">No matches</div>
          )}
        </div>
      </div>
    </div>
  );
}
