'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api, Link } from '@/lib/api';
import { LinkCard } from '@/components/dashboard/LinkCard';
import { ShortenForm } from '@/components/dashboard/ShortenForm';
import { ToastContainer } from '@/components/ui/Toast';
import { LogOut } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.links.list().then(setLinks).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  async function handleCreated(link: Link) {
    setLinks(prev => [link, ...prev]);
    // Auto-copy to clipboard
    const shortUrl = link.shortUrl || `${process.env.NEXT_PUBLIC_API_URL}/${link.slug}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      addToast(`✓ Sniped + copied to clipboard`, 'success');
    } catch {
      addToast(`✓ Link created: /${link.slug}`, 'success');
    }
  }

  async function handleDelete(id: string) {
    await api.links.delete(id);
    setLinks(prev => prev.filter(l => l.id !== id));
    addToast('Link deleted', 'success');
  }

  function handleCopied() {
    addToast('Copied to clipboard', 'success');
  }

  const totalClicks = links.reduce((sum, l) => sum + Number(l.click_count), 0);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse-green" />
          <span className="font-mono text-[var(--green)] font-bold tracking-widest glow-text">snip</span>
          <span className="font-mono text-[10px] text-[var(--muted)] hidden sm:block">// dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] text-[var(--muted)] hidden sm:block">{user?.email}</span>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted)] hover:text-red-400 transition-colors"
          >
            <LogOut size={12} /> logout
          </button>
        </div>
      </nav>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-8">
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'TOTAL LINKS', value: links.length, color: 'text-[var(--text)]' },
            { label: 'TOTAL CLICKS', value: totalClicks.toLocaleString(), color: 'text-[var(--green)]' },
            { label: 'CACHE STATUS', value: 'ACTIVE', color: 'text-[var(--green)]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass rounded p-4 border border-[var(--border)]">
              <p className={`font-mono font-bold text-xl md:text-2xl ${color}`}>{value}</p>
              <p className="font-mono text-[9px] text-[var(--muted)] tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>

        <ShortenForm onCreated={handleCreated} />

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-[10px] text-[var(--muted)] tracking-widest">YOUR LINKS</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="font-mono text-[10px] text-[var(--muted)]">{links.length}</span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-12 font-mono text-xs text-[var(--muted)]">
                <span className="animate-blink">█</span> loading...
              </div>
            ) : links.length === 0 ? (
              <div className="terminal-window">
                <div className="terminal-header">
                  <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
                </div>
                <div className="bg-[var(--bg2)] p-8 text-center">
                  <p className="font-mono text-xs text-[var(--muted)]">$ ls links/</p>
                  <p className="font-mono text-xs text-[var(--muted)] mt-2">no links found. paste a URL above to get started.</p>
                </div>
              </div>
            ) : (
              links.map(link => (
                <LinkCard key={link.id} link={link} onDelete={handleDelete} onCopied={handleCopied} />
              ))
            )}
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}