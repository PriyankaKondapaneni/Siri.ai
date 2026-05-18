import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import { useAuth } from '../store/auth';
import { api } from '../lib/api';
import { Check, AlertTriangle, SettingsIcon, User, Sparkles } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [health, setHealth] = useState<{ ok: boolean; hasClaudeKey: boolean } | null>(null);

  useEffect(() => {
    api.get<{ ok: boolean; hasClaudeKey: boolean }>('/health').then(setHealth).catch(() => null);
  }, []);

  return (
    <>
      <TopBar />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-semibold text-ink-900 tracking-tight mb-1">Settings</h1>
          <p className="text-[13px] text-ink-500 mb-6">Workspace, account, and integrations.</p>

          <section className="card p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <User size={14} className="text-warm-500" />
              <h2 className="text-[14px] font-semibold text-ink-900">Profile</h2>
            </div>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between border-b border-ink-150 pb-2">
                <span className="text-ink-500">Name</span>
                <span className="font-medium text-ink-900">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Email</span>
                <span className="font-medium text-ink-900">{user?.email}</span>
              </div>
            </div>
          </section>

          <section className="card p-5 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-warm-500" />
              <h2 className="text-[14px] font-semibold text-ink-900">AI</h2>
            </div>
            <p className="text-[13px] text-ink-500 mb-3">
              Currently running in stub mode — AI replies are placeholders.
              When you're ready, set <code className="text-2xs bg-ink-100 px-1 py-0.5 rounded">ANTHROPIC_API_KEY</code> in <code className="text-2xs bg-ink-100 px-1 py-0.5 rounded">server/.env</code> to switch on Claude.
            </p>
            <div className={`flex items-center gap-2 p-2.5 rounded-md text-[13px] ${
              health?.hasClaudeKey ? 'bg-ink-100 text-ink-800' : 'bg-warm-50 text-warm-700'
            }`}>
              {health?.hasClaudeKey ? <Check size={14} /> : <AlertTriangle size={14} />}
              <span className="font-medium">
                {health?.hasClaudeKey ? 'API key detected — Claude not active yet (stub mode).' : 'No API key configured — stub mode.'}
              </span>
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <SettingsIcon size={14} className="text-warm-500" />
              <h2 className="text-[14px] font-semibold text-ink-900">About</h2>
            </div>
            <p className="text-[13px] text-ink-500 leading-relaxed">
              siri.ai is a unified workspace for tasks, notes, timeline, and inbox with an AI
              assistant that has context across all of it. Built with React, Express, and SQLite.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
