'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, MousePointerClick, Calendar } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const GREENS = ['#00ff87','#00cc6a','#009950','#00663a','#003320'];
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PublicStats {
  slug: string;
  originalUrl: string;
  title: string | null;
  totalClicks: number;
  createdAt: string;
  timeline: { date: string; clicks: string }[];
  devices: { device: string; count: string }[];
  browsers: { browser: string; count: string }[];
}

export default function PublicStatsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [data, setData] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
  console.log('fetching:', `${BASE}/api/stats/${slug}`);
  fetch(`${BASE}/api/stats/${slug}`)
    .then(r => {
      console.log('response status:', r.status);
      if (!r.ok) { setNotFound(true); return null; }
      return r.json();
    })
    .then(d => {
      console.log('data:', d);
      if (d) setData(d);
    })
    .catch(err => {
      console.log('error:', err);
      setNotFound(true);
    })
    .finally(() => setLoading(false));
    }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-xs text-[var(--muted)]">
        <span className="animate-blink mr-2">█</span> fetching stats...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center px-4">
        <div className="terminal-window w-full max-w-md">
          <div className="terminal-header">
            <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
            <span className="font-mono text-[10px] text-[var(--muted)] ml-3">snip:stats</span>
          </div>
          <div className="bg-[var(--bg2)] p-8 text-center">
            <p className="font-mono text-xs text-red-400 mb-2">ERROR: slug not found</p>
            <Link href="/" className="font-mono text-xs text-[var(--green)] hover:underline">
              $ cd /home →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const timelineData = data.timeline.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    clicks: Number(d.clicks),
  }));

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse-green" />
          <span className="font-mono text-[var(--green)] font-bold tracking-widest glow-text">snip</span>
          <span className="font-mono text-[10px] text-[var(--muted)] hidden sm:block">// public stats</span>
        </div>
        <Link href="/" className="font-mono text-xs text-[var(--muted)] hover:text-[var(--green)] transition-colors">
          create your own →
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">

        <div className="terminal-window glow">
          <div className="terminal-header">
            <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
            <span className="font-mono text-[10px] text-[var(--muted)] ml-3">snip:public-stats</span>
          </div>
          <div className="bg-[var(--bg2)] p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <p className="font-mono text-[10px] text-[var(--muted)] tracking-widest mb-1">SHORT LINK</p>
                <p className="font-mono text-[var(--green)] font-bold text-lg glow-text">/{data.slug}</p>
                {data.title && (
                  <p className="font-mono text-xs text-[var(--muted)] mt-1">{data.title}</p>
                )}
              </div>
              
              <a href={data.originalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--muted)] hover:text-[var(--green)] transition-colors flex-shrink-0 border border-[var(--border)] px-3 py-1.5 rounded hover:border-[var(--green-muted)]">
                <ExternalLink size={10} /> visit link
              </a>
            </div>
            <p className="font-mono text-[11px] text-[var(--muted)] truncate mb-4">{data.originalUrl}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--bg3)] rounded p-3 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-1">
                  <MousePointerClick size={12} className="text-[var(--green)]" />
                  <p className="font-mono text-[9px] text-[var(--muted)] tracking-widest">TOTAL CLICKS</p>
                </div>
                <p className="font-mono text-2xl font-bold text-[var(--green)]">{data.totalClicks.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--bg3)] rounded p-3 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={12} className="text-[var(--muted)]" />
                  <p className="font-mono text-[9px] text-[var(--muted)] tracking-widest">CREATED</p>
                </div>
                <p className="font-mono text-sm text-[var(--text)]">
                  {new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {timelineData.length > 0 && (
          <div className="terminal-window">
            <div className="terminal-header">
              <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
              <span className="font-mono text-[10px] text-[var(--muted)] ml-3">clicks — last 30 days</span>
            </div>
            <div className="bg-[var(--bg2)] p-6">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff87" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00ff87" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="date" tick={{ fill: '#7d8590', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#7d8590', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 4, fontFamily: 'Space Mono', fontSize: 11 }} labelStyle={{ color: '#7d8590' }} itemStyle={{ color: '#00ff87' }} />
                  <Area type="monotone" dataKey="clicks" stroke="#00ff87" strokeWidth={2} fill="url(#greenGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="terminal-window">
            <div className="terminal-header">
              <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
              <span className="font-mono text-[10px] text-[var(--muted)] ml-3">devices</span>
            </div>
            <div className="bg-[var(--bg2)] p-5 flex items-center justify-center">
              {data.devices.length > 0 ? (
                <PieChart width={180} height={180}>
                  <Pie data={data.devices} dataKey="count" nameKey="device" cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                    {data.devices.map((_, i) => (
                      <Cell key={i} fill={GREENS[i % GREENS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #21262d', fontSize: 11, fontFamily: 'Space Mono' }} />
                </PieChart>
              ) : (
                <p className="font-mono text-xs text-[var(--muted)] py-8">no data yet</p>
              )}
            </div>
          </div>

          <div className="terminal-window">
            <div className="terminal-header">
              <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
              <span className="font-mono text-[10px] text-[var(--muted)] ml-3">browsers</span>
            </div>
            <div className="bg-[var(--bg2)] p-5 space-y-3">
              {data.browsers.length > 0 ? data.browsers.map((b) => {
                const total = data.browsers.reduce((s, x) => s + Number(x.count), 0);
                const pct = total > 0 ? Math.round((Number(b.count) / total) * 100) : 0;
                return (
                  <div key={b.browser}>
                    <div className="flex justify-between font-mono text-[10px] mb-1">
                      <span className="text-[var(--text)]">{b.browser}</span>
                      <span className="text-[var(--green)]">{pct}%</span>
                    </div>
                    <div className="h-1 bg-[var(--bg3)] rounded-full overflow-hidden">
                      <div className="h-1 bg-[var(--green)] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : (
                <p className="font-mono text-xs text-[var(--muted)] py-4">no data yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="terminal-window">
          <div className="bg-[var(--bg2)] p-6 text-center">
            <p className="font-mono text-xs text-[var(--muted)] mb-3">want your own short links with analytics?</p>
            <Link href="/register" className="font-mono text-xs bg-[var(--green)] text-[var(--bg)] font-bold px-5 py-2.5 rounded hover:bg-[var(--green-dim)] transition-colors inline-block">
              $ get started free →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}