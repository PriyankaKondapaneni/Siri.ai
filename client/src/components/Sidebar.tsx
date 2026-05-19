import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { useUI } from '../store/ui';
import { useEffect, useState } from 'react';
import { api, Chat, Note } from '../lib/api';
import {
  Sparkles, ListTodo, Inbox as InboxIcon, Calendar,
  Plus, ChevronDown, ChevronRight, Folder, FolderOpen,
  MessageSquare, LogOut, FileText, Cable, Brain,
} from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const {
    conversationsExpanded, knowledgeExpanded,
    toggleConversations, toggleKnowledge,
  } = useUI();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  async function load() {
    try {
      const [c, n] = await Promise.all([
        api.get<{ chats: Chat[] }>('/chats'),
        api.get<{ notes: Note[] }>('/notes'),
      ]);
      setChats(c.chats.slice(0, 6));
      setNotes(n.notes);
    } catch {}
  }

  useEffect(() => { load(); }, []);

  const initials = user?.name?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <aside className="w-60 shrink-0 bg-sideBg border-r border-ink-200 flex flex-col">
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-ink-900 text-white grid place-items-center text-[12px] font-semibold shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-ink-900 truncate leading-tight">
            {user?.name?.split(' ')[0] || 'siri.ai'}
          </div>
          <div className="text-2xs text-ink-500 truncate">Personal workspace</div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="icon-btn"
          title="Sign out"
        >
          <LogOut size={13} />
        </button>
      </div>

      <div className="px-3 pb-2">
        <button
          onClick={async () => {
            const { note } = await api.post<{ note: Note }>('/notes', { title: 'Untitled', content: '' });
            navigate(`/notes/${note.id}`);
            load();
          }}
          className="w-full inline-flex items-center justify-between gap-1.5 px-3 h-8 rounded-md bg-white border border-ink-200 hover:border-ink-300 text-[13px] font-medium text-ink-700 transition shadow-soft"
        >
          <span className="flex items-center gap-1.5">
            <Plus size={13} />
            Add
          </span>
          <ChevronDown size={12} className="text-ink-400" />
        </button>
      </div>

      <nav className="px-2 flex-1 overflow-y-auto">
        <NavLink to="/" end className={({ isActive }) => clsx('side-item', isActive && 'active')}>
          <Brain size={14} className="text-warm-500" />
          <span>Plan</span>
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => clsx('side-item', isActive && 'active')}>
          <ListTodo size={14} className="text-ink-500" />
          <span>Tasks</span>
        </NavLink>
        <NavLink to="/inbox" className={({ isActive }) => clsx('side-item', isActive && 'active')}>
          <InboxIcon size={14} className="text-ink-500" />
          <span>Inbox</span>
        </NavLink>
        <NavLink to="/timeline" className={({ isActive }) => clsx('side-item', isActive && 'active')}>
          <Calendar size={14} className="text-ink-500" />
          <span>Timeline</span>
        </NavLink>

        <button
          onClick={toggleConversations}
          className="side-section w-full hover:text-ink-700 transition"
        >
          {conversationsExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Conversations
        </button>
        {conversationsExpanded && (
          <div>
            {chats.length === 0 && (
              <div className="px-3 py-1 text-2xs text-ink-400 italic">No chats yet</div>
            )}
            {chats.map(c => (
              <NavLink
                key={c.id}
                to={`/chat/${c.id}`}
                className={({ isActive }) => clsx('side-item pl-7', isActive && 'active')}
              >
                <MessageSquare size={12} className="text-ink-400 shrink-0" />
                <span className="truncate text-[12px]">{c.title}</span>
              </NavLink>
            ))}
          </div>
        )}

        <button
          onClick={toggleKnowledge}
          className="side-section w-full hover:text-ink-700 transition"
        >
          {knowledgeExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Knowledge
        </button>
        {knowledgeExpanded && (
          <div>
            <KnowledgeFolder label="Notes" icon={Folder} defaultOpen>
              {notes.length === 0 && (
                <div className="pl-9 py-1 text-2xs text-ink-400 italic">No notes</div>
              )}
              {notes.slice(0, 10).map(n => (
                <NavLink
                  key={n.id}
                  to={`/notes/${n.id}`}
                  className={({ isActive }) => clsx('side-item pl-9', isActive && 'active')}
                >
                  <FileText size={11} className="text-ink-400 shrink-0" />
                  <span className="truncate text-[12px]">{n.title || 'Untitled'}</span>
                </NavLink>
              ))}
            </KnowledgeFolder>
            <KnowledgeFolder label="Connector" icon={Cable}>
              <div className="pl-9 py-1 text-2xs text-ink-400 italic">No sources connected</div>
            </KnowledgeFolder>
          </div>
        )}
      </nav>

      <div className="border-t border-ink-200 px-3 py-2 text-2xs text-ink-400 flex items-center justify-between">
        <span>v1.0 · siri.ai</span>
      </div>
    </aside>
  );
}

function KnowledgeFolder({
  label, icon: Icon, defaultOpen = false, children,
}: { label: string; icon: any; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <div
        onClick={() => setOpen(o => !o)}
        className="side-item pl-4"
      >
        {open ? <ChevronDown size={10} className="text-ink-400" /> : <ChevronRight size={10} className="text-ink-400" />}
        {open ? <FolderOpen size={13} className="text-warm-500" /> : <Icon size={13} className="text-warm-500" />}
        <span>{label}</span>
      </div>
      {open && <div>{children}</div>}
    </>
  );
}
