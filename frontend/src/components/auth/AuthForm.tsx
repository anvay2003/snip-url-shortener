'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse-green" />
          <span className="font-mono text-[var(--green)] font-bold text-xl tracking-widest glow-text">snip</span>
        </div>

        <div className="terminal-window">
          <div className="terminal-header">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
            <span className="font-mono text-[10px] text-[var(--muted)] ml-3">
              {mode === 'login' ? 'auth:login' : 'auth:register'}
            </span>
          </div>
          <div className="bg-[var(--bg2)] p-6">
            <p className="font-mono text-[10px] text-[var(--green)] tracking-widest mb-1">
              {mode === 'login' ? '// AUTHENTICATE' : '// CREATE ACCOUNT'}
            </p>
            <h1 className="font-display text-xl font-bold text-[var(--text)] mb-6">
              {mode === 'login' ? 'Welcome back.' : 'Get started free.'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] text-[var(--muted)] tracking-widest block mb-2">EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2.5 font-mono text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--green)] transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-[var(--muted)] tracking-widest block mb-2">PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="min 8 characters"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2.5 font-mono text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--green)] transition-colors"
                />
              </div>

              {error && (
                <div className="border border-red-500/30 bg-red-500/10 rounded px-3 py-2">
                  <p className="font-mono text-xs text-red-400">ERROR: {error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--green)] hover:bg-[var(--green-dim)] disabled:opacity-50 text-[var(--bg)] font-mono font-bold text-sm py-3 rounded transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                {mode === 'login' ? '$ authenticate' : '$ create_account'}
              </button>
            </form>

            <div className="border-t border-[var(--border)] mt-6 pt-4">
              <p className="font-mono text-[11px] text-[var(--muted)] text-center">
                {mode === 'login' ? 'no account? ' : 'have account? '}
                <Link
                  href={mode === 'login' ? '/register' : '/login'}
                  className="text-[var(--green)] hover:underline"
                >
                  {mode === 'login' ? 'register →' : 'sign in →'}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}