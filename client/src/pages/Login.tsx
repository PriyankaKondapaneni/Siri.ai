import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import Logo from '../components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuth(s => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-canvas grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Logo size={28} />
        </div>
        <div className="card p-6">
          <h1 className="text-[18px] font-semibold text-ink-900">Welcome back</h1>
          <p className="text-[13px] text-ink-500 mt-0.5">Sign in to your workspace.</p>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-ink-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink-700 mb-1">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="••••••••" />
            </div>
            {error && <div className="text-[12px] text-warm-700">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 text-center text-[12px] text-ink-500">
            New here?{' '}
            <Link to="/signup" className="text-ink-900 font-medium hover:underline">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
