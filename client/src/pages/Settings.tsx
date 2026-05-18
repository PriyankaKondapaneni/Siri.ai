import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../store/auth';
import { api } from '../lib/api';
import { Check, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [health, setHealth] = useState<{ ok: boolean; hasClaudeKey: boolean } | null>(null);

  useEffect(() => {
    api.get<{ ok: boolean; hasClaudeKey: boolean }>('/health').then(setHealth).catch(() => null);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Settings" subtitle="Workspace, account, and integrations." />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-ink-900">Profile</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between border-b border-ink-100 pb-2">
                <span className="text-ink-500">Name</span>
                <span className="font-medium text-ink-900">{user?.name}</span>
              </div>
              <div className="flex justify-between border-b border-ink-100 pb-2">
                <span className="text-ink-500">Email</span>
                <span className="font-medium text-ink-900">{user?.email}</span>
              </div>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-ink-900">AI assistant</h2>
            <p className="text-sm text-ink-500 mt-1">
              Siri's AI is powered by Anthropic's Claude API. Set <code className="text-xs bg-ink-100 px-1 rounded">ANTHROPIC_API_KEY</code> in <code className="text-xs bg-ink-100 px-1 rounded">server/.env</code>.
            </p>
            <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg ${
              health?.hasClaudeKey ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
            }`}>
              {health?.hasClaudeKey ? <Check size={16} /> : <AlertTriangle size={16} />}
              <span className="text-sm font-medium">
                {health?.hasClaudeKey ? 'Connected to Claude API' : 'No API key configured — AI features will return stubs.'}
              </span>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-ink-900">About Siri.ai</h2>
            <p className="text-sm text-ink-500 mt-2 leading-relaxed">
              Siri.ai is a calm, unified workspace for tasks, notes, calendar, and inbox — with an
              AI assistant that has context across all of it. Built with React, Express, SQLite, and Claude.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
