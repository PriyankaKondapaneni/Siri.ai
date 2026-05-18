import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './store/auth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Inbox from './pages/Inbox';
import Timeline from './pages/Timeline';
import Notes from './pages/Notes';
import Settings from './pages/Settings';

export default function App() {
  const { user, loading, initialize } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    if (loading) return;
    const publicRoutes = ['/login', '/signup'];
    if (!user && !publicRoutes.includes(location.pathname)) navigate('/login', { replace: true });
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return <div className="h-full grid place-items-center text-ink-400 text-sm">Loading…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/chat/:id" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/:list" element={<Tasks />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/notes/:id" element={<Notes />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
