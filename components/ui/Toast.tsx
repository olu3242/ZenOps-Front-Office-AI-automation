'use client'

import type { Toast, ToastType } from '@/hooks/useToast'

const TYPE_STYLES: Record<ToastType, string> = {
  success: 'bg-teal-700 text-white',
  error:   'bg-red-600   text-white',
  info:    'bg-gray-800  text-white',
}

const TYPE_ICON: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
}

interface ToastContainerProps {
  toasts: Toast[]
  dismiss: (id: string) => void
}

/**
 * Fixed-position toast stack (bottom-right).
 * Drop this once inside any page that uses useToast():
 *
 *   <ToastContainer toasts={toasts} dismiss={dismiss} />
 */
export function ToastContainer({ toasts, dismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-medium
            pointer-events-auto min-w-[220px] max-w-xs
            animate-in slide-in-from-bottom-2 fade-in duration-200
            ${TYPE_STYLES[t.type]}
          `}
        >
          <span className="shrink-0 font-bold text-xs opacity-80">
            {TYPE_ICON[t.type]}
          </span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity text-xs ml-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
