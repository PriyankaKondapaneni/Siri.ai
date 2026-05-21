import { useRef, useState } from 'react';
import clsx from 'clsx';
import { api, ADHDPlan, EmotionalState } from '../lib/api';
import TopBar from '../components/TopBar';

type Screen = 'dump' | 'results' | 'freeze';

const STATE_BG: Record<EmotionalState, string> = {
  overwhelmed: 'bg-red-500',
  stressed: 'bg-orange-500',
  low_energy: 'bg-amber-500',
  shutdown_risk: 'bg-rose-700',
  okay: 'bg-emerald-500',
};

const STATE_LABEL: Record<EmotionalState, string> = {
  overwhelmed: 'overwhelmed',
  stressed: 'stressed',
  low_energy: 'low energy',
  shutdown_risk: 'shutdown risk',
  okay: 'okay',
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>('dump');
  const [dump, setDump] = useState('');
  const [plan, setPlan] = useState<ADHDPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function analyze() {
    if (!dump.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<ADHDPlan>('/assistant/adhd-plan', { dump });
      setPlan(result);
      setScreen('results');
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setDump('');
    setPlan(null);
    setError(null);
    setScreen('dump');
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  return (
    <>
      <TopBar />
      <div className="flex-1 min-h-0 overflow-y-auto bg-white">
        <div className="max-w-xl mx-auto px-6 py-10">
          {screen === 'dump' && (
            <DumpScreen
              textareaRef={textareaRef}
              value={dump}
              onChange={setDump}
              onSubmit={analyze}
              loading={loading}
              error={error}
            />
          )}
          {screen === 'results' && plan && (
            <ResultsScreen
              plan={plan}
              onFreeze={() => setScreen('freeze')}
              onReset={reset}
            />
          )}
          {screen === 'freeze' && plan && (
            <FreezeScreen
              plan={plan}
              onBack={() => setScreen('results')}
              onReset={reset}
            />
          )}
        </div>
      </div>
    </>
  );
}

function DumpScreen({
  textareaRef, value, onChange, onSubmit, loading, error,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div>
      <Label>ADHD PLAN</Label>
      <h1 className="text-2xl font-semibold text-ink-900 mt-2">What's in your head?</h1>
      <p className="text-[13px] text-ink-500 mt-1 mb-6">
        Dump everything. One thing per line. No format needed.
      </p>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit(); }}
        placeholder={'reply to manager\nclean room\nstudy DSA\nhavent eaten\nfeel guilty\ntoo much pending'}
        rows={7}
        autoFocus
        className="w-full bg-white border border-ink-200 rounded-md p-3 text-[14px] text-ink-900 leading-relaxed resize-none focus:outline-none focus:border-ink-900"
      />
      {error && <p className="text-red-500 text-[13px] mt-2">{error}</p>}
      <button
        onClick={onSubmit}
        disabled={!value.trim() || loading}
        className="w-full mt-3 h-11 rounded-md bg-ink-900 text-white text-[14px] font-medium hover:bg-ink-800 disabled:bg-ink-200 disabled:text-ink-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'working on it…' : 'what should I do now →'}
      </button>
      <p className="text-center text-[11px] text-ink-400 mt-2">cmd+enter to submit</p>
    </div>
  );
}

function ResultsScreen({ plan, onFreeze, onReset }: {
  plan: ADHDPlan; onFreeze: () => void; onReset: () => void;
}) {
  const { assessment, do_now, skip_today, encouragement, recovery_hint } = plan;
  const [done, setDone] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    const next = new Set(done);
    next.has(i) ? next.delete(i) : next.add(i);
    setDone(next);
    // Fire-and-forget: record the outcome so the data flywheel fills up.
    if (plan.plan_id && next.has(i)) {
      api.post(`/plans/${plan.plan_id}/complete`, { completed: [i] }).catch(() => {});
    }
  }

  return (
    <div>
      <StateBadge assessment={assessment} />

      {recovery_hint && (
        <p className="mt-3 text-[13px] text-ink-700 bg-ink-50 border border-ink-200 rounded-md px-3 py-2">
          {recovery_hint}
        </p>
      )}

      {encouragement && (
        <p className="mt-3 text-[13px] text-ink-700 italic">{encouragement}</p>
      )}

      {skip_today.length > 0 && (
        <section className="mt-6">
          <Label>NOT TODAY</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skip_today.map((t, i) => (
              <span
                key={i}
                className="inline-block px-2 py-0.5 text-[12px] text-ink-400 bg-ink-100 rounded line-through"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      <Divider />

      <section>
        <Label>DO THESE NOW</Label>
        <ol className="mt-2 divide-y divide-ink-200">
          {do_now.map((item, i) => {
            const isDone = done.has(i);
            return (
              <li key={i} className="flex items-start gap-3 py-3">
                <button
                  onClick={() => toggle(i)}
                  aria-label={isDone ? 'mark not done' : 'mark done'}
                  className={clsx(
                    'flex-none w-6 h-6 grid place-items-center text-[12px] font-semibold rounded border transition-colors',
                    isDone
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-ink-300 text-ink-400 hover:border-ink-900'
                  )}
                >
                  {isDone ? '✓' : i + 1}
                </button>
                <div className="flex-1">
                  <div className={clsx('text-[14px] leading-snug', isDone ? 'text-ink-400 line-through' : 'text-ink-900')}>
                    {item.rewrite}
                  </div>
                  <div className="text-[11px] text-ink-400 mt-0.5">{item.why}</div>
                </div>
                <span className="flex-none text-[12px] text-ink-400 pt-0.5">{item.duration_minutes} min</span>
              </li>
            );
          })}
        </ol>
      </section>

      <Divider />

      <button
        onClick={onFreeze}
        className="w-full h-10 rounded-md border border-ink-200 text-[13px] text-ink-700 hover:bg-ink-50 transition-colors"
      >
        I can't start → break it down more
      </button>
      <button
        onClick={onReset}
        className="w-full h-10 mt-2 text-[13px] text-ink-400 hover:text-ink-700 transition-colors"
      >
        start over
      </button>
    </div>
  );
}

function FreezeScreen({ plan, onBack, onReset }: {
  plan: ADHDPlan; onBack: () => void; onReset: () => void;
}) {
  const top = plan.do_now[0];
  const steps = top ? top.tiny_steps : [plan.one_tiny_step];

  return (
    <div>
      <Label>FREEZE MODE</Label>
      <h1 className="text-2xl font-semibold text-ink-900 mt-2">Pick one step. Just that.</h1>
      <p className="text-[13px] text-ink-500 mt-1 mb-6">Don't think about the rest yet.</p>

      {top && (
        <p className="text-[12px] text-ink-400 mb-4">
          Breaking down: <span className="text-ink-700">{top.rewrite}</span>
        </p>
      )}

      <ol className="divide-y divide-ink-200">
        {steps.map((step, i) => (
          <li key={i} className="py-4">
            <div className="text-[10px] font-semibold tracking-widest text-ink-400">STEP {step.order}</div>
            <div className="text-[14px] text-ink-900 leading-snug mt-1">{step.text}</div>
          </li>
        ))}
      </ol>

      <Divider />

      <button
        onClick={onBack}
        className="w-full h-10 rounded-md border border-ink-200 text-[13px] text-ink-700 hover:bg-ink-50 transition-colors"
      >
        ← back to tasks
      </button>
      <button
        onClick={onReset}
        className="w-full h-10 mt-2 text-[13px] text-ink-400 hover:text-ink-700 transition-colors"
      >
        start over
      </button>
    </div>
  );
}

function StateBadge({ assessment }: { assessment: ADHDPlan['assessment'] }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-ink-100 rounded">
      <span className={clsx('w-2 h-2 rounded-full', STATE_BG[assessment.state])} />
      <span className="text-[12px] text-ink-600 font-mono">
        {STATE_LABEL[assessment.state]} · {assessment.energy} energy · overwhelm {assessment.overwhelm_score}/10
      </span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold tracking-widest text-ink-400 font-mono">
      {children}
    </span>
  );
}

function Divider() {
  return <hr className="my-5 border-ink-200" />;
}
