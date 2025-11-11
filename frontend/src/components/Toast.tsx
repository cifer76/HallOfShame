import { ReactNode } from 'react';

interface ToastProps {
  message: ReactNode;
  type?: 'success' | 'error';
}

const toastStyles: Record<'success' | 'error', string> = {
  success: 'bg-emerald-100 border-emerald-300 text-emerald-900',
  error: 'bg-red-100 border-red-300 text-red-900',
};

export function Toast({ message, type = 'success' }: ToastProps) {
  return (
    <div
      className={`fixed top-4 inset-x-0 flex justify-center pointer-events-none z-50`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto border px-4 py-2 rounded shadow-sm text-sm font-medium ${toastStyles[type]}`}
      >
        {message}
      </div>
    </div>
  );
}
