'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/lib/api';
import { Copy, Check, Trash2, BarChart2, ExternalLink } from 'lucide-react';

export function LinkCard({ link, onDelete, onCopied }: {
  link: Link;
  onDelete: (id: string) => void;
  onCopied: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const shortUrl = link.shortUrl || link.short_url || `${process.env.NEXT_PUBLIC_API_URL}/${link.slug}`;
  const displaySlug = shortUrl.split('/').pop();

  async function copy() {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    onCopied();
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    setDeleting(true);
    await onDelete(link.id);
  }

  return (
    <div className="glass rounded border border-[var(--border)] hover:border-[var(--green-muted)] transition-all duration-200 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[var(--muted)] text-[10px]">→</span>
            <span className="font-mono text-[var(--green)] text-sm font-bold">/{displaySlug}</span>
            {link.title && (
              <span className="font-mono text-[10px] text-[var(--muted)] bg-[var(--bg3)] px-2 py-0.5 rounded truncate max-w-[120px]">
                {link.title}
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] text-[var(--muted)] truncate pl-4">{link.original_url}</p>
        </div>

        <div className="flex items-center gap-4 pl-4 sm:pl-0">
          <div className="text-right hidden sm:block">
            <p className="font-mono text-[var(--green)] text-sm font-bold">{Number(link.click_count).toLocaleString()}</p>
            <p className="font-mono text-[9px] text-[var(--muted)] tracking-widest">CLICKS</p>
          </div>

          <div className="flex items-center gap-1 border-l border-[var(--border)] pl-4">
            <button onClick={copy} title="Copy short link"
              className="p-2 text-[var(--muted)] hover:text-[var(--green)] hover:bg-[var(--green-muted)] rounded transition-colors">
              {copied ? <Check size={13} className="text-[var(--green)]" /> : <Copy size={13} />}
            </button>
            <a href={link.original_url} target="_blank" rel="noopener noreferrer" title="Open original"
              className="p-2 text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg3)] rounded transition-colors">
              <ExternalLink size={13} />
            </a>
            <button onClick={() => router.push(`/dashboard/analytics/${link.id}`)} title="Analytics"
              className="p-2 text-[var(--muted)] hover:text-[var(--green)] hover:bg-[var(--green-muted)] rounded transition-colors">
              <BarChart2 size={13} />
            </button>
            <button onClick={handleDelete} disabled={deleting} title="Delete"
              className="p-2 text-[var(--muted)] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-40">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}