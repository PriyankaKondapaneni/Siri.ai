import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './store/auth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AppShell from './components/AppShell';
import Today from './pages/Today';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Calendar from './pages/Calendar';
import Inbox from './pages/Inbox';
import Chat from './pages/Chat';
import Settings from './pages/Settings';

export default function App() {
  const { user, loading, initialize } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (loading) return;
    const publicRoutes = ['/', '/login', '/signup'];
    if (!user && !publicRoutes.includes(location.pathname)) navigate('/login', { replace: true });
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-ink-400">
        Loading…
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/today" replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/today" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/today" replace /> : <Signup />} />
      <Route element={<AppShell />}>
        <Route path="/today" element={<Today />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/:list" element={<Tasks />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/notes/:id" element={<Notes />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
