'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowRight, Zap, BarChart3, Shield } from 'lucide-react';

const DEMO_LINES = [
  '$ snip shorten https://very-long-url.example.com/path?query=value',
  '> Generating slug...',
  '> Warming Redis cache...',
  '✓ https://snip.dev/xK9mPq',
  '> Redirect latency: 8ms (cached)',
  '',
  '$ snip analytics xK9mPq',
  '> Clicks: 1,247  |  Devices: mobile 68%, desktop 32%',
  '> Top referrer: twitter.com  |  Peak: Tue 3pm',
];

export default function HomePage() {
  const [lines, setLines] = useState<string[]>([]);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < DEMO_LINES.length) {
        setLines(prev => [...prev, DEMO_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 320);
    const blink = setInterval(() => setCursor(c => !c), 530);
    return () => { clearInterval(interval); clearInterval(blink); };
  }, []);

  return (
    <main className="min-h-screen grid-bg flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse-green" />
          <span className="font-mono text-[var(--green)] font-bold text-lg tracking-widest glow-text">snip</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="font-mono text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors px-4 py-2">
            sign_in
          </Link>
          <Link href="/register" className="font-mono text-xs bg-[var(--green)] text-[var(--bg)] font-bold px-4 py-2 rounded hover:bg-[var(--green-dim)] transition-colors">
            get_started →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 text-[10px] font-mono text-[var(--green)] border border-[var(--green-muted)] bg-[rgba(0,255,135,0.05)] rounded px-3 py-1.5 mb-8 animate-fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-blink" />
          PRODUCTION SYSTEM ONLINE // REDIS CACHE ACTIVE
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-extrabold text-[var(--text)] tracking-tight mb-4 animate-fade-up delay-1">
          URLs, <span className="text-[var(--green)] glow-text">shortened.</span>
          <br />Analytics, <span className="text-[var(--green)] glow-text">real.</span>
        </h1>

        <p className="font-mono text-[var(--muted)] text-sm md:text-base max-w-lg mb-10 leading-relaxed animate-fade-up delay-2">
          Sub-10ms redirects via Redis cache. Async click processing. Sliding-window rate limiting. Built like it runs at scale — because it does.
        </p>

        <div className="flex gap-3 mb-20 animate-fade-up delay-3">
          <Link href="/register" className="font-mono text-sm bg-[var(--green)] text-[var(--bg)] font-bold px-6 py-3 rounded hover:bg-[var(--green-dim)] transition-all flex items-center gap-2">
            start shortening <ArrowRight size={14} />
          </Link>
          <Link href="/login" className="font-mono text-sm glass text-[var(--muted)] hover:text-[var(--text)] px-6 py-3 rounded transition-colors">
            sign in
          </Link>
        </div>

        {/* Terminal demo */}
        <div className="terminal-window w-full max-w-2xl text-left animate-fade-up delay-4 glow">
          <div className="terminal-header">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
            <span className="font-mono text-[10px] text-[var(--muted)] ml-3">snip CLI — zsh</span>
          </div>
          <div className="bg-[var(--bg2)] p-5 min-h-[180px] font-mono text-xs leading-relaxed">
            {lines.map((line, i) => (
              <div key={i} className={`mb-1 ${
                !line ? '' :
                line.startsWith('✓') ? 'text-[var(--green)]' :
                line.startsWith('>') ? 'text-[var(--muted)]' :
                line.startsWith('$') ? 'text-[var(--text)]' : 'text-[var(--muted)]'
              }`}>
                {line}
              </div>
            ))}
            {lines.length < DEMO_LINES.length && (
              <span className={`inline-block w-2 h-3.5 bg-[var(--green)] ${cursor ? 'opacity-100' : 'opacity-0'}`} />
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-[var(--border)] px-6 md:px-10 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border)]">
          {[
            { icon: Zap, label: '// SPEED', title: 'Sub-10ms redirects', desc: 'Redis-cached hot path. Cache hit ratio tracked. Zero DB reads on repeat visits.' },
            { icon: BarChart3, label: '// ANALYTICS', title: 'Real-time click data', desc: 'Device, browser, referrer breakdown. 30-day timeline. Async writes via BullMQ queue.' },
            { icon: Shield, label: '// SECURITY', title: 'Rate limiting', desc: 'Sliding-window limiter in Redis. 10 shortens/min per user. 60 req/min global.' },
          ].map(({ icon: Icon, label, title, desc }) => (
            <div key={title} className="bg-[var(--bg)] p-8 hover:bg-[var(--bg2)] transition-colors group">
              <p className="font-mono text-[10px] text-[var(--green)] tracking-widest mb-4">{label}</p>
              <Icon size={18} className="text-[var(--green)] mb-3" />
              <p className="font-display font-semibold text-[var(--text)] text-base mb-2">{title}</p>
              <p className="font-mono text-[11px] text-[var(--muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <span className="font-mono text-[10px] text-[var(--muted)]">snip v1.0.0 // Node.js · Redis · PostgreSQL · Next.js</span>
        <span className="font-mono text-[10px] text-[var(--green)]">● SYSTEM ONLINE</span>
      </div>
    </main>
  );
}