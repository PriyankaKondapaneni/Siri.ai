import { Link } from 'react-router-dom';
import { Sparkles, ListTodo, Calendar, Mail, NotebookText, ArrowRight, Check } from 'lucide-react';
import Logo from '../components/Logo';

export default function Landing() {
  return (
    <div className="min-h-full bg-white">
      <header className="border-b border-ink-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-ink-600 hover:text-ink-900">Log in</Link>
            <Link to="/signup" className="btn-primary">Get started</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium mb-6">
            <Sparkles size={14} />
            Powered by Claude
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-ink-900 max-w-3xl mx-auto leading-[1.05]">
            Your AI second brain for tasks, notes, calendar & inbox.
          </h1>
          <p className="mt-6 text-lg text-ink-500 max-w-2xl mx-auto">
            Siri.ai brings everything together in one quiet, focused workspace — and gives you an
            AI assistant that actually understands your day.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link to="/signup" className="btn-primary">
              Try Siri free <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-secondary">I already have an account</Link>
          </div>

          <div className="mt-20 relative">
            <div className="absolute inset-x-12 -top-8 h-40 bg-gradient-to-r from-brand-200/40 via-pink-200/30 to-amber-200/40 blur-3xl rounded-full" />
            <div className="relative card overflow-hidden text-left">
              <div className="border-b border-ink-200 px-4 py-3 flex items-center gap-2 bg-ink-50">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-ink-500">siri.ai</span>
              </div>
              <div className="grid grid-cols-12 min-h-[360px]">
                <div className="col-span-3 border-r border-ink-200 bg-ink-50 p-4 space-y-2 text-sm">
                  <div className="nav-item active"><Sparkles size={16} /> Ask Siri</div>
                  <div className="nav-item"><Mail size={16} /> Inbox</div>
                  <div className="nav-item"><ListTodo size={16} /> Tasks</div>
                  <div className="nav-item"><NotebookText size={16} /> Notes</div>
                  <div className="nav-item"><Calendar size={16} /> Calendar</div>
                </div>
                <div className="col-span-9 p-8 space-y-4">
                  <div className="text-xs text-ink-400 uppercase tracking-wide">Today</div>
                  <div className="text-2xl font-semibold">Good morning — here's your day</div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="card p-4">
                      <div className="text-xs text-ink-500 mb-2">Schedule</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>10:00 — Team standup</span><span className="text-ink-400">30m</span></div>
                        <div className="flex justify-between"><span>14:30 — Focus block</span><span className="text-ink-400">45m</span></div>
                      </div>
                    </div>
                    <div className="card p-4">
                      <div className="text-xs text-ink-500 mb-2">Top tasks</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2"><span className="h-3.5 w-3.5 border border-ink-300 rounded" /> Draft project brief</div>
                        <div className="flex items-center gap-2"><span className="h-3.5 w-3.5 border border-ink-300 rounded" /> Plan weekly review</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-ink-50 border-y border-ink-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900">Everything you need in one calm workspace</h2>
            <p className="mt-4 text-ink-500">
              No more bouncing between five tools. Siri unifies your inbox, tasks, notes, and calendar — with an AI
              assistant that can act on all of them.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {features.map(f => (
              <div key={f.title} className="card p-6">
                <div className="h-10 w-10 rounded-lg bg-brand-100 text-brand-700 grid place-items-center mb-4">
                  <f.icon size={20} />
                </div>
                <h3 className="font-semibold text-ink-900">{f.title}</h3>
                <p className="mt-1 text-sm text-ink-500 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900">An assistant that thinks alongside you</h2>
            <p className="mt-4 text-ink-500">
              Ask Siri to plan your day, draft a reply, summarize a long thread, or turn a meeting into action items.
              It has context across your tasks, notes, calendar, and inbox.
            </p>
            <ul className="mt-6 space-y-3">
              {asks.map(a => (
                <li key={a} className="flex items-start gap-3">
                  <Check size={18} className="text-brand-600 mt-0.5 shrink-0" />
                  <span className="text-ink-700">{a}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6 bg-gradient-to-br from-brand-50 to-white">
            <div className="text-xs text-ink-400 mb-2">You</div>
            <div className="text-ink-800">Plan my day — I have a standup at 10 and a focus block this afternoon.</div>
            <div className="mt-4 text-xs text-ink-400">Siri</div>
            <div className="text-ink-800 leading-relaxed">
              Here's a focused plan for today.
              <div className="mt-2 space-y-1 text-sm text-ink-600">
                <div>· 9:00 — Triage inbox (30m)</div>
                <div>· 10:00 — Team standup</div>
                <div>· 10:45 — Draft project brief (deep work)</div>
                <div>· 12:30 — Lunch + walk</div>
                <div>· 14:30 — Focus block: roadmap</div>
                <div>· 16:30 — Plan weekly review</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-ink-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Start your calmer workday</h2>
          <p className="mt-4 text-ink-300">
            Join Siri.ai and let an AI assistant help you focus on what matters.
          </p>
          <div className="mt-8">
            <Link to="/signup" className="btn-primary">Get started — it's free</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <div className="text-sm text-ink-500">© {new Date().getFullYear()} siri.ai — your AI second brain</div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  { title: 'Ask Siri anything', body: 'A chat assistant with context across your day. Powered by Claude.', icon: Sparkles },
  { title: 'Unified inbox', body: 'See and triage your email without switching tools.', icon: Mail },
  { title: 'Smart tasks', body: 'Capture, prioritize, and turn meetings into actions.', icon: ListTodo },
  { title: 'Living notes', body: 'Markdown notes that the assistant can read and update.', icon: NotebookText },
  { title: 'Calendar at a glance', body: 'See your schedule woven through tasks and notes.', icon: Calendar },
  { title: 'Always private', body: 'Your data lives in your workspace. You control the keys.', icon: Check },
];

const asks = [
  '"Plan my day around the standup and focus block."',
  '"Draft a follow-up from this meeting note."',
  '"Summarize the most important emails from today."',
  '"Turn this brain dump into clear next steps."',
];
