import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen grid-bg flex flex-col items-center justify-center px-4 text-center">
      <div className="terminal-window w-full max-w-md">
        <div className="terminal-header">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
          <span className="font-mono text-[10px] text-[var(--muted)] ml-3">snip:error</span>
        </div>
        <div className="bg-[var(--bg2)] p-8">
          <p className="font-mono text-[10px] text-red-400 tracking-widest mb-2">// 404 NOT FOUND</p>
          <p className="font-display text-5xl font-bold text-[var(--text)] mb-2">404</p>
          <p className="font-mono text-xs text-[var(--muted)] mb-6 leading-relaxed">
            $ snip resolve <span className="text-red-400">this-slug</span><br />
            {'>'} Error: slug not found in database<br />
            {'>'} Cache miss. No record exists.<br />
            {'>'} Exit code 1
          </p>
          <Link
            href="/"
            className="font-mono text-xs bg-[var(--green)] text-[var(--bg)] font-bold px-5 py-2.5 rounded hover:bg-[var(--green-dim)] transition-colors inline-block"
          >
            $ cd /home →
          </Link>
        </div>
      </div>
    </main>
  );
}