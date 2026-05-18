import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import {
  Sparkles, ListTodo, NotebookText, Calendar as CalIcon,
  Inbox as InboxIcon, Sun, Settings as SettingsIcon, LogOut,
} from 'lucide-react';
import Logo from './Logo';

const nav = [
  { to: '/today', label: 'Today', icon: Sun },
  { to: '/chat', label: 'Ask Siri', icon: Sparkles },
  { to: '/inbox', label: 'Inbox', icon: InboxIcon },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/notes', label: 'Notes', icon: NotebookText },
  { to: '/calendar', label: 'Calendar', icon: CalIcon },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="h-screen flex bg-ink-50">
      <aside className="w-60 shrink-0 border-r border-ink-200 bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-ink-200">
          <Logo />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/today'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-ink-200 space-y-1">
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <SettingsIcon size={18} />
            <span>Settings</span>
          </NavLink>
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xs font-semibold">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink-900 truncate">{user?.name}</div>
                <div className="text-xs text-ink-400 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="p-1.5 rounded hover:bg-ink-100 text-ink-500"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
