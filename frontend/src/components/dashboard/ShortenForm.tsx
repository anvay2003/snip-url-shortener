'use client';
import { useState } from 'react';
import { api, Link } from '@/lib/api';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export function ShortenForm({ onCreated }: { onCreated: (link: Link) => void }) {
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const link = await api.links.create({ url, slug: slug || undefined, title: title || undefined });
      onCreated(link);
      setUrl(''); setSlug(''); setTitle('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
        <span className="font-mono text-[10px] text-[var(--muted)] ml-3">snip:shorten</span>
      </div>
      <div className="bg-[var(--bg2)] p-5">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 flex-1 bg-[var(--bg)] border border-[var(--border)] rounded px-3 focus-within:border-[var(--green)] transition-colors">
              <span className="font-mono text-[var(--green)] text-xs select-none">$</span>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://your-long-url.com/goes/here"
                className="flex-1 bg-transparent py-2.5 font-mono text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[var(--green)] hover:bg-[var(--green-dim)] disabled:opacity-50 text-[var(--bg)] font-mono font-bold text-xs px-5 py-2.5 rounded transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : null}
              snip →
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="font-mono text-[10px] text-[var(--muted)] hover:text-[var(--green)] mt-3 flex items-center gap-1 transition-colors tracking-widest"
          >
            {showAdvanced ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {showAdvanced ? 'HIDE OPTIONS' : 'ADVANCED OPTIONS'}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
              <div>
                <label className="font-mono text-[10px] text-[var(--muted)] tracking-widest block mb-1.5">CUSTOM SLUG</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-link"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 font-mono text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--green)] transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-[var(--muted)] tracking-widest block mb-1.5">TITLE</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="optional label"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 font-mono text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--green)] transition-colors"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="font-mono text-xs text-red-400 mt-3 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
              ERROR: {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}