'use client';
import { useEffect, useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastData[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }: { toast: ToastData; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 10);
    // Animate out then remove
    const t2 = setTimeout(() => setVisible(false), 2700);
    const t3 = setTimeout(() => onRemove(toast.id), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded border font-mono text-xs transition-all duration-300 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    } ${
      toast.type === 'success'
        ? 'bg-[var(--bg2)] border-[var(--green)] text-[var(--text)]'
        : 'bg-[var(--bg2)] border-red-500/50 text-[var(--text)]'
    }`}>
      {toast.type === 'success'
        ? <Check size={12} className="text-[var(--green)] flex-shrink-0" />
        : <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
      }
      <span>{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="ml-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors">
        <X size={10} />
      </button>
    </div>
  );
}