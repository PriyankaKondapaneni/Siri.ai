import { Outlet } from 'react-router-dom';
import { useUI } from '../store/ui';
import Sidebar from './Sidebar';
import FocusBox from './FocusBox';

export default function AppShell() {
  const { sidebarOpen } = useUI();

  return (
    <div className="h-screen flex bg-canvas overflow-hidden">
      {sidebarOpen && <Sidebar />}
      <main className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </main>
      <FocusBox />
    </div>
  );
}
