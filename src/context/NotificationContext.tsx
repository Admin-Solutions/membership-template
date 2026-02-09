import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { startSignalR, stopSignalR, onSignalREvent, getConnectionState } from '../services/signalRService'
import { walletGUID } from '../store/config'

interface Toast {
  id: string
  type: string
  title?: string
  message?: string
  icon?: string
  duration: number
  timestamp?: string
  onClick?: () => void
  raw?: unknown
}

interface Notification {
  id: string
  timestamp: string
  read: boolean
  type: string
  title?: string
  message?: string
  icon?: string
  onClick?: () => void
  raw?: unknown
}

interface ConnectionState {
  state: 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
  connectionId?: string
  error?: Error
}

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  connectionState: string
  toasts: Toast[]
  addNotification: (notification: Partial<Notification> & { showToast?: boolean }) => Notification
  rememberNotification: (toast: Toast) => void
  showToast: (toast: Partial<Toast>) => string
  dismissToast: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  deleteNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

// LocalStorage key for remembered notifications
const NOTIFICATIONS_STORAGE_KEY = 'membership_remembered_notifications'

// Notification types
export const NOTIFICATION_TYPES = {
  BUDDY_REQUEST: 'buddy_request',
  BUDDY_ACCEPTED: 'buddy_accepted',
  TOKEN_TRANSFER: 'token_transfer',
  TOKEN_RECEIVED: 'token_received',
  MESSAGE: 'message',
  SYSTEM: 'system',
  CALL_INCOMING: 'call_incoming',
  CHAT_REQUEST: 'chat_request',
} as const

// Max notifications to keep in history
const MAX_NOTIFICATIONS = 50

// Load notifications from localStorage
function loadStoredNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Notification[]
      // Filter out notifications older than 7 days
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      return parsed.filter(n => new Date(n.timestamp).getTime() > sevenDaysAgo)
    }
  } catch (error) {
    console.error('Error loading stored notifications:', error)
  }
  return []
}

// Save notifications to localStorage
function saveNotifications(notifications: Notification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
  } catch (error) {
    console.error('Error saving notifications:', error)
  }
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  // Load notifications from localStorage on initial render
  const [notifications, setNotifications] = useState<Notification[]>(() => loadStoredNotifications())
  const [unreadCount, setUnreadCount] = useState(() => {
    const stored = loadStoredNotifications()
    return stored.filter(n => !n.read).length
  })
  const [connectionState, setConnectionState] = useState<string>('disconnected')
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef(0)
  const hasInitialized = useRef(false)

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    saveNotifications(notifications)
  }, [notifications])

  // Dismiss a toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Show a toast notification
  const showToast = useCallback((toast: Partial<Toast>): string => {
    const id = `toast-${toastIdRef.current++}`
    const newToast: Toast = {
      id,
      type: 'info',
      duration: 4000,
      ...toast,
    }

    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss
    if (newToast.duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, newToast.duration)
    }

    return id
  }, [dismissToast])

  // Remember a notification - save to tray and localStorage
  const rememberNotification = useCallback((toast: Toast) => {
    const notification: Notification = {
      id: toast.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: toast.timestamp || new Date().toISOString(),
      read: false,
      type: toast.type,
      title: toast.title,
      message: toast.message,
      icon: toast.icon,
      onClick: toast.onClick,
      raw: toast.raw,
    }

    setNotifications((prev) => {
      // Check if already remembered (by id or content)
      const exists = prev.some(n => n.id === notification.id)
      if (exists) return prev
      const updated = [notification, ...prev].slice(0, MAX_NOTIFICATIONS)
      return updated
    })

    setUnreadCount((prev) => prev + 1)
  }, [])

  // Add a new notification - shows toast only, doesn't add to tray
  const addNotification = useCallback((notification: Partial<Notification> & { showToast?: boolean }): Notification => {
    const newNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
      type: notification.type || 'system',
      ...notification,
    }

    // Only show toast - don't add to notification tray automatically
    if (notification.showToast !== false) {
      showToast({
        ...newNotification,
        type: notification.type || 'info',
        title: notification.title,
        message: notification.message,
        icon: notification.icon,
        duration: 0, // No auto-dismiss - user must interact
        onClick: notification.onClick,
      })
    }

    return newNotification
  }, [showToast])

  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id && !n.read) {
          setUnreadCount((count) => Math.max(0, count - 1))
          return { ...n, read: true }
        }
        return n
      })
    )
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  // Clear all notifications (also clears localStorage)
  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
    localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY)
  }, [])

  // Delete a single notification
  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const notification = prev.find(n => n.id === id)
      // Decrement unread count if the deleted notification was unread
      if (notification && !notification.read) {
        setUnreadCount((count) => Math.max(0, count - 1))
      }
      return prev.filter(n => n.id !== id)
    })
  }, [])

  // Handle incoming SignalR messages
  const handleSignalRMessage = useCallback((data: unknown) => {
    // Parse the message and create appropriate notification
    const messageData = data as { action?: Array<{ valueTypeName?: string; message?: string }>; value?: Array<{ name?: string; message?: string; callerName?: string; preview?: string }> }
    const action = messageData.action?.[0]
    const value = messageData.value?.[0]

    if (!action) return

    // Determine notification type and content based on valueTypeName or other indicators
    const typeName = action.valueTypeName?.toLowerCase() || ''
    let notificationData: Partial<Notification> & { showToast?: boolean } = {
      raw: data,
    }

    // Route based on notification type
    if (typeName.includes('buddy') || typeName.includes('friend')) {
      if (typeName.includes('request')) {
        notificationData = {
          type: NOTIFICATION_TYPES.BUDDY_REQUEST,
          title: 'Buddy Request',
          message: value?.name ? `${value.name} wants to connect` : 'New buddy request',
          icon: 'user-plus',
        }
      } else if (typeName.includes('accept')) {
        notificationData = {
          type: NOTIFICATION_TYPES.BUDDY_ACCEPTED,
          title: 'Buddy Connected',
          message: value?.name ? `${value.name} accepted your request` : 'Connection accepted',
          icon: 'users',
        }
      }
    } else if (typeName.includes('token') || typeName.includes('transfer')) {
      notificationData = {
        type: NOTIFICATION_TYPES.TOKEN_TRANSFER,
        title: 'Token Update',
        message: value?.message || 'Token activity on your wallet',
        icon: 'ticket',
      }
    } else if (typeName.includes('call')) {
      notificationData = {
        type: NOTIFICATION_TYPES.CALL_INCOMING,
        title: 'Incoming Call',
        message: value?.callerName ? `${value.callerName} is calling` : 'Incoming call',
        icon: 'phone',
      }
    } else if (typeName.includes('chat') || typeName.includes('message')) {
      notificationData = {
        type: NOTIFICATION_TYPES.MESSAGE,
        title: 'New Message',
        message: value?.preview || 'You have a new message',
        icon: 'message-circle',
      }
    } else {
      // Generic notification
      notificationData = {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: action.message || 'Notification',
        message: value?.message || 'New update available',
        icon: 'bell',
      }
    }

    addNotification(notificationData)
  }, [addNotification])

  // Initialize SignalR connection
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Only connect if we have a wallet GUID
    if (walletGUID) {
      // Start SignalR connection
      startSignalR()

      // Subscribe to events
      const unsubMessage = onSignalREvent('message', handleSignalRMessage)
      const unsubState = onSignalREvent('connectionStateChanged', (data: unknown) => {
        const stateData = data as ConnectionState
        setConnectionState(stateData.state)
      })

      // Set initial connection state
      setConnectionState(getConnectionState())

      return () => {
        unsubMessage()
        unsubState()
        stopSignalR()
      }
    }
  }, [handleSignalRMessage])

  const value: NotificationContextValue = {
    // State
    notifications,
    unreadCount,
    connectionState,
    toasts,

    // Actions
    addNotification,
    rememberNotification,
    showToast,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    deleteNotification,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
