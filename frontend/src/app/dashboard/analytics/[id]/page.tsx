'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, Analytics } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, MousePointerClick } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const GREENS = ['#00ff87','#00cc6a','#009950','#00663a','#003320'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.links.analytics(id).then(setData).catch(() => router.push('/dashboard')).finally(() => setLoading(false));
  }, [id, user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-mono text-xs text-[var(--muted)]">
      <span className="animate-blink mr-2">█</span> loading analytics...
    </div>
  );
  if (!data) return null;

  const timelineData = data.timeline.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    clicks: Number(d.clicks),
  }));

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse-green" />
          <span className="font-mono text-[var(--green)] font-bold tracking-widest glow-text">snip</span>
          <span className="font-mono text-[10px] text-[var(--muted)] hidden sm:block">// analytics</span>
        </div>
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 font-mono text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors">
          <ArrowLeft size={12} /> back
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">

        {/* Total clicks */}
        <div className="terminal-window glow">
          <div className="terminal-header">
            <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
            <span className="font-mono text-[10px] text-[var(--muted)] ml-3">snip:analytics</span>
          </div>
          <div className="bg-[var(--bg2)] p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded border border-[var(--green-muted)] bg-[var(--green-muted)] flex items-center justify-center">
              <MousePointerClick size={20} className="text-[var(--green)]" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-[var(--muted)] tracking-widest mb-1">TOTAL CLICKS</p>
              <p className="font-display text-4xl font-bold text-[var(--green)] glow-text">{data.totalClicks.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {timelineData.length > 0 && (
          <div className="terminal-window">
            <div className="terminal-header">
              <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
              <span className="font-mono text-[10px] text-[var(--muted)] ml-3">clicks — last 30 days</span>
            </div>
            <div className="bg-[var(--bg2)] p-6">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00ff87" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00ff87" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="date" tick={{ fill: '#7d8590', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#7d8590', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 4, fontFamily: 'Space Mono', fontSize: 11 }}
                    labelStyle={{ color: '#7d8590' }}
                    itemStyle={{ color: '#00ff87' }}
                  />
                  <Area type="monotone" dataKey="clicks" stroke="#00ff87" strokeWidth={2} fill="url(#greenGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Devices + Browsers */}
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
                    {data.devices.map((_, i) => <Cell key={i} fill={GREENS[i % GREENS.length]} />)}
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
                      <div className="h-1 bg-[var(--green)] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : <p className="font-mono text-xs text-[var(--muted)] py-4">no data yet</p>}
            </div>
          </div>
        </div>

        {/* Referrers */}
        <div className="terminal-window">
          <div className="terminal-header">
            <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
            <span className="font-mono text-[10px] text-[var(--muted)] ml-3">top referrers</span>
          </div>
          <div className="bg-[var(--bg2)]">
            {data.referers.length > 0 ? data.referers.map((r, i) => (
              <div key={r.referer} className="flex justify-between items-center px-5 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg3)] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-[var(--muted)] w-4">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-mono text-sm text-[var(--text)]">{r.referer}</span>
                </div>
                <span className="font-mono text-sm text-[var(--green)] font-bold">{Number(r.count).toLocaleString()}</span>
              </div>
            )) : (
              <p className="font-mono text-xs text-[var(--muted)] text-center py-6">no referrer data yet</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}