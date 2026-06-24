import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { _registerToastListener, ToastItem } from '../services/toast';

const STYLES: Record<ToastItem['type'], { icon: React.ReactNode; ring: string; iconColor: string }> = {
  success: { icon: <CheckCircle2 size={20} />, ring: 'border-l-4 border-success', iconColor: 'text-success' },
  error: { icon: <AlertCircle size={20} />, ring: 'border-l-4 border-danger', iconColor: 'text-danger' },
  info: { icon: <Info size={20} />, ring: 'border-l-4 border-primary', iconColor: 'text-primary' },
};

const DURATION = 4000;

const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    _registerToastListener((toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => remove(toast.id), DURATION);
    });
    return () => _registerToastListener(null);
  }, [remove]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 w-[min(92vw,380px)]">
      {toasts.map(toast => {
        const s = STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className={`toast-enter bg-white ${s.ring} rounded-field shadow-pop px-4 py-3.5 flex items-start gap-3`}
          >
            <span className={`${s.iconColor} mt-0.5 shrink-0`}>{s.icon}</span>
            <p className="flex-1 text-sm font-medium text-ink leading-snug">{toast.message}</p>
            <button
              onClick={() => remove(toast.id)}
              className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
              aria-label="Yopish"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toaster;
