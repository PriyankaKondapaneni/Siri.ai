import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { useUI } from '../store/ui';
import {
  Sparkles, ListTodo, NotebookText, Calendar as CalIcon,
  Inbox as InboxIcon, Sun, Settings as SettingsIcon, LogOut,
  Search, PanelRight,
} from 'lucide-react';
import Logo from './Logo';
import AIPanel from './AIPanel';
import CommandPalette from './CommandPalette';

const nav = [
  { to: '/today', label: 'Today', icon: Sun, shortcut: '1' },
  { to: '/inbox', label: 'Inbox', icon: InboxIcon, shortcut: '2' },
  { to: '/tasks', label: 'Tasks', icon: ListTodo, shortcut: '3' },
  { to: '/notes', label: 'Notes', icon: NotebookText, shortcut: '4' },
  { to: '/calendar', label: 'Calendar', icon: CalIcon, shortcut: '5' },
  { to: '/chat', label: 'Ask Siri', icon: Sparkles, shortcut: '6' },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const { toggleAiPanel, setCommandOpen, aiPanelOpen } = useUI();
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const inField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      if (mod && e.key === 'k') { e.preventDefault(); setCommandOpen(true); return; }
      if (mod && e.key === '.') { e.preventDefault(); toggleAiPanel(); return; }
      if (inField) return;

      const idx = ['1', '2', '3', '4', '5', '6'].indexOf(e.key);
      if (mod && idx !== -1) { e.preventDefault(); navigate(nav[idx].to); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, setCommandOpen, toggleAiPanel]);

  return (
    <div className="h-screen flex bg-canvas">
      <aside className="w-56 shrink-0 border-r border-ink-200 bg-white flex flex-col">
        <div className="h-11 px-3 border-b border-ink-200 flex items-center">
          <Logo size={20} textClass="text-[13px]" />
        </div>

        <button
          onClick={() => setCommandOpen(true)}
          className="mx-2 mt-2 mb-1 flex items-center gap-2 px-2 h-7 rounded-md text-[12px] text-ink-500 bg-ink-50 hover:bg-ink-100 border border-ink-200 transition"
        >
          <Search size={12} />
          <span className="flex-1 text-left">Search or jump…</span>
          <span className="kbd">⌘K</span>
        </button>

        <nav className="flex-1 px-2 overflow-y-auto">
          <div className="nav-section">Workspace</div>
          {nav.map(({ to, label, icon: Icon, shortcut }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/today'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={14} />
              <span className="flex-1">{label}</span>
              <span className="kbd opacity-0 group-hover:opacity-100">⌘{shortcut}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-2 py-2 border-t border-ink-200">
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <SettingsIcon size={14} />
            <span>Settings</span>
          </NavLink>
          <div className="mt-1 flex items-center gap-2 px-2 py-1.5">
            <div className="h-6 w-6 rounded-full bg-ink-200 text-ink-700 grid place-items-center text-2xs font-semibold">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium text-ink-900 truncate leading-tight">{user?.name}</div>
              <div className="text-2xs text-ink-400 truncate">{user?.email}</div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="icon-btn"
              title="Sign out"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </main>

      <AIPanel />

      {!aiPanelOpen && (
        <button
          onClick={toggleAiPanel}
          className="absolute right-3 top-2 z-30 icon-btn bg-white border border-ink-200 shadow-soft"
          title="Show Siri (⌘.)"
        >
          <PanelRight size={14} />
        </button>
      )}

      <CommandPalette />
    </div>
  );
}
