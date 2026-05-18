import { useNavigate } from 'react-router-dom';
import { useUI } from '../store/ui';
import { Home, Search, Bell, PanelLeft, Calendar, Target } from 'lucide-react';

export default function TopBar({ right }: { right?: React.ReactNode }) {
  const navigate = useNavigate();
  const { toggleSidebar, toggleFocus } = useUI();

  return (
    <div className="h-12 px-3 border-b border-ink-200 bg-white flex items-center justify-between gap-2">
      <div className="flex items-center gap-0.5">
        <button onClick={toggleSidebar} className="icon-btn" title="Toggle sidebar">
          <PanelLeft size={15} />
        </button>
        <button onClick={() => navigate('/')} className="icon-btn" title="Home">
          <Home size={15} />
        </button>
        <button className="icon-btn" title="Search">
          <Search size={15} />
        </button>
        <button className="icon-btn relative" title="Notifications">
          <Bell size={15} />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-warm-500" />
        </button>
      </div>

      <div className="flex-1 flex justify-center">
        {right}
      </div>

      <div className="flex items-center gap-0.5">
        <button onClick={() => navigate('/timeline')} className="icon-btn" title="Timeline">
          <Calendar size={15} />
        </button>
        <button onClick={toggleFocus} className="icon-btn" title="Toggle Focus Box">
          <Target size={15} />
        </button>
      </div>
    </div>
  );
}
