import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, UserPlus, Users, Ticket, Phone, MessageCircle, AlertCircle, CheckCircle, Info, Bookmark } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

// Auto-fade timeout in milliseconds
const AUTO_FADE_TIMEOUT = 7000

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'bell': Bell,
  'user-plus': UserPlus,
  'users': Users,
  'ticket': Ticket,
  'phone': Phone,
  'message-circle': MessageCircle,
  'alert': AlertCircle,
  'success': CheckCircle,
  'info': Info,
}

// Type to color mapping - using CSS variables
const typeColors: Record<string, { bg: string; border: string; icon: string; text: string; accent: string }> = {
  success: {
    bg: 'bg-[var(--bg-card)]',
    border: 'border-[var(--success)]',
    icon: 'text-[var(--success)]',
    text: 'text-[var(--success)]',
    accent: 'bg-[var(--success)]',
  },
  error: {
    bg: 'bg-[var(--bg-card)]',
    border: 'border-[var(--error)]',
    icon: 'text-[var(--error)]',
    text: 'text-[var(--error)]',
    accent: 'bg-[var(--error)]',
  },
  warning: {
    bg: 'bg-[var(--bg-card)]',
    border: 'border-[var(--warning)]',
    icon: 'text-[var(--warning)]',
    text: 'text-[var(--warning)]',
    accent: 'bg-[var(--warning)]',
  },
  info: {
    bg: 'bg-[var(--bg-card)]',
    border: 'border-[var(--accent)]',
    icon: 'text-[var(--accent)]',
    text: 'text-[var(--text-primary)]',
    accent: 'bg-[var(--accent)]',
  },
  buddy_request: {
    bg: 'bg-[var(--bg-card)]',
    border: 'border-[var(--accent)]',
    icon: 'text-[var(--accent)]',
    text: 'text-[var(--text-primary)]',
    accent: 'bg-[var(--accent)]',
  },
  call_incoming: {
    bg: 'bg-[var(--bg-card)]',
    border: 'border-[var(--success)]',
    icon: 'text-[var(--success)]',
    text: 'text-[var(--success)]',
    accent: 'bg-[var(--success)]',
  },
}

interface ToastData {
  id: string
  type: string
  title?: string
  message?: string
  icon?: string
  timestamp?: string
  onClick?: () => void
  raw?: unknown
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
  onRemember: (toast: ToastData) => void
}

function Toast({ toast, onDismiss, onRemember }: ToastProps) {
  const colors = typeColors[toast.type] || typeColors.info
  const IconComponent = iconMap[toast.icon || 'bell'] || Bell

  // Auto-fade after 7 seconds and remember
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemember(toast)
    }, AUTO_FADE_TIMEOUT)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`
        relative flex flex-col gap-2 p-4 rounded-xl
        ${colors.bg} border-l-4 ${colors.border}
        shadow-xl shadow-black/40
        max-w-sm w-full
      `}
    >
      {/* Header row with icon and content */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2 rounded-lg bg-[var(--bg-hover)] ${colors.icon}`}>
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className={`font-semibold text-sm ${colors.text}`}>
              {toast.title}
            </p>
          )}
          {toast.message && (
            <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-3">
              {toast.message}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDismiss(toast.id)
          }}
          className="flex-shrink-0 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemember(toast)
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-light)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 rounded-lg transition-colors"
        >
          <Bookmark className="w-3.5 h-3.5" />
          Save
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDismiss(toast.id)
          }}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-hover)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors"
        >
          Dismiss
        </button>
      </div>

      {/* Progress bar for auto-fade */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: AUTO_FADE_TIMEOUT / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 right-0 h-1 origin-left rounded-b-xl ${colors.accent} opacity-50`}
      />
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts, dismissToast, rememberNotification } = useNotifications()

  const handleRemember = (toast: ToastData) => {
    rememberNotification(toast as Parameters<typeof rememberNotification>[0])
    dismissToast(toast.id)
  }

  return (
    <div className="fixed bottom-20 right-4 z-[300] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              toast={toast}
              onDismiss={dismissToast}
              onRemember={handleRemember}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Utility functions for showing toasts directly
export function createToastHelpers(showToast: (toast: Partial<ToastData & { duration?: number }>) => string) {
  return {
    success: (message: string, options: Partial<ToastData> = {}) =>
      showToast({ type: 'success', icon: 'success', message, ...options }),
    error: (message: string, options: Partial<ToastData> = {}) =>
      showToast({ type: 'error', icon: 'alert', message, ...options }),
    warning: (message: string, options: Partial<ToastData> = {}) =>
      showToast({ type: 'warning', icon: 'alert', message, ...options }),
    info: (message: string, options: Partial<ToastData> = {}) =>
      showToast({ type: 'info', icon: 'info', message, ...options }),
  }
}
