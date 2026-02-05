import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, BellOff, BellRing, CheckCircle, XCircle, PhoneMissed, MessageCircle, Ticket, Users, Trash2, Loader2, Eye, Check, Smartphone, Info } from 'lucide-react'
import { useNotifications, NOTIFICATION_TYPES } from '../context/NotificationContext'
import {
  requestNotificationPermission,
  getNotificationPermission,
  isPushEnabled,
  getDeviceInfo,
  canRequestPushPermission,
  getNotificationInstructions
} from '../services/notificationService'

// Notification categories for filtering
const NOTIFICATION_CATEGORIES = {
  ALL: 'all',
  MISSED_CALLS: 'missed_calls',
  MESSAGES: 'messages',
  GENERAL: 'general',
} as const

type NotificationCategory = typeof NOTIFICATION_CATEGORIES[keyof typeof NOTIFICATION_CATEGORIES]

// Map notification types to categories
function getNotificationCategory(type: string): NotificationCategory {
  switch (type) {
    case NOTIFICATION_TYPES.CALL_INCOMING:
      return NOTIFICATION_CATEGORIES.MISSED_CALLS
    case NOTIFICATION_TYPES.MESSAGE:
    case NOTIFICATION_TYPES.CHAT_REQUEST:
      return NOTIFICATION_CATEGORIES.MESSAGES
    default:
      return NOTIFICATION_CATEGORIES.GENERAL
  }
}

// Icon for notification type
function getNotificationIcon(type: string) {
  switch (type) {
    case NOTIFICATION_TYPES.CALL_INCOMING:
      return PhoneMissed
    case NOTIFICATION_TYPES.MESSAGE:
    case NOTIFICATION_TYPES.CHAT_REQUEST:
      return MessageCircle
    case NOTIFICATION_TYPES.BUDDY_REQUEST:
    case NOTIFICATION_TYPES.BUDDY_ACCEPTED:
      return Users
    case NOTIFICATION_TYPES.TOKEN_TRANSFER:
    case NOTIFICATION_TYPES.TOKEN_RECEIVED:
      return Ticket
    default:
      return Bell
  }
}

// Format time ago
function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface Notification {
  id: string
  timestamp: string
  read: boolean
  type: string
  title?: string
  message?: string
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const detailModalRef = useRef<HTMLDivElement>(null)
  const [permission, setPermission] = useState(() => getNotificationPermission())
  const [isEnabled, setIsEnabled] = useState(() => isPushEnabled())
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>(NOTIFICATION_CATEGORIES.ALL)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showPushStatusModal, setShowPushStatusModal] = useState(false)

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    deleteNotification,
  } = useNotifications()

  // Refresh status on mount
  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission())
      setIsEnabled(isPushEnabled())
    }
  }, [isOpen])

  // Close on click outside (but not when detail modal is open)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Don't close if clicking inside the panel
      if (panelRef.current && panelRef.current.contains(event.target as Node)) {
        return
      }
      // Don't close if clicking inside the detail modal
      if (detailModalRef.current && detailModalRef.current.contains(event.target as Node)) {
        return
      }
      // Don't close if detail modal is open (clicks on backdrop should only close modal)
      if (selectedNotification) {
        return
      }
      onClose()
    }

    if (isOpen) {
      // Delay adding listener to prevent immediate close
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen, onClose, selectedNotification])

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleEnableNotifications = async () => {
    setLoading(true)
    const result = await requestNotificationPermission()
    setLoading(false)
    setPermission(getNotificationPermission())
    if (result.success) {
      setIsEnabled(true)
    }
  }

  // Get device info and push capability
  const deviceInfo = getDeviceInfo()
  const pushCapability = canRequestPushPermission()
  const instructions = getNotificationInstructions()

  // Get status display info
  const getStatusInfo = () => {
    if (permission === 'unsupported') {
      return {
        icon: XCircle,
        color: 'text-[var(--error)]',
        bgColor: 'bg-[var(--error)]/20',
        label: 'Not Supported',
      }
    }
    if (permission === 'denied') {
      return {
        icon: BellOff,
        color: 'text-[var(--error)]',
        bgColor: 'bg-[var(--error)]/20',
        label: 'Blocked',
      }
    }
    // Show as "On" if permission is granted (even if not fully registered)
    if (permission === 'granted') {
      return {
        icon: BellRing,
        color: 'text-[var(--success)]',
        bgColor: 'bg-[var(--success)]/20',
        label: isEnabled ? 'On' : 'On',
      }
    }
    // Check if device can't request (iOS not in PWA mode, etc.)
    if (!pushCapability.canRequest) {
      return {
        icon: Info,
        color: 'text-[var(--warning)]',
        bgColor: 'bg-[var(--warning)]/20',
        label: 'Setup Required',
      }
    }
    return {
      icon: Bell,
      color: 'text-[var(--text-muted)]',
      bgColor: 'bg-[var(--bg-hover)]',
      label: 'Off',
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon
  // Can show enable button only if permission not denied/unsupported AND device can request
  const canShowEnableButton = permission !== 'unsupported' && permission !== 'denied' && permission !== 'granted' && pushCapability.canRequest
  // Need to show instructions instead if device can't request automatically
  const needsManualSetup = !pushCapability.canRequest && permission !== 'granted' && permission !== 'denied'

  // Filter notifications by category
  const filteredNotifications = (notifications as Notification[]).filter((n) => {
    if (activeCategory === NOTIFICATION_CATEGORIES.ALL) return true
    return getNotificationCategory(n.type) === activeCategory
  })

  // Count by category
  const categoryCounts = {
    [NOTIFICATION_CATEGORIES.ALL]: notifications.length,
    [NOTIFICATION_CATEGORIES.MISSED_CALLS]: (notifications as Notification[]).filter(n => getNotificationCategory(n.type) === NOTIFICATION_CATEGORIES.MISSED_CALLS).length,
    [NOTIFICATION_CATEGORIES.MESSAGES]: (notifications as Notification[]).filter(n => getNotificationCategory(n.type) === NOTIFICATION_CATEGORIES.MESSAGES).length,
    [NOTIFICATION_CATEGORIES.GENERAL]: (notifications as Notification[]).filter(n => getNotificationCategory(n.type) === NOTIFICATION_CATEGORIES.GENERAL).length,
  }

  const categoryTabs = [
    { id: NOTIFICATION_CATEGORIES.ALL, label: 'All', icon: Bell },
    { id: NOTIFICATION_CATEGORIES.MISSED_CALLS, label: 'Calls', icon: PhoneMissed },
    { id: NOTIFICATION_CATEGORIES.MESSAGES, label: 'Messages', icon: MessageCircle },
    { id: NOTIFICATION_CATEGORIES.GENERAL, label: 'General', icon: Info },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 left-4 sm:left-auto sm:w-96 z-[201] glass-card p-4 max-h-[80vh] overflow-hidden flex flex-col"
            style={{ top: 'calc(1rem + env(safe-area-inset-top, 0px))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
              <div className="flex items-center gap-2">
                {/* Push notification status - clickable for more info */}
                <button
                  onClick={() => setShowPushStatusModal(true)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${statusInfo.bgColor} hover:opacity-80 transition-opacity`}
                >
                  <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
                  <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Enable Push Notifications - show button or instructions */}
            {canShowEnableButton && (
              <button
                onClick={handleEnableNotifications}
                disabled={loading}
                className="w-full mb-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-light)] disabled:opacity-50 rounded-lg font-medium text-sm text-black transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Enable Push Notifications
                  </>
                )}
              </button>
            )}

            {/* Show setup instructions for iOS or unsupported scenarios */}
            {needsManualSetup && (
              <button
                onClick={() => setShowPushStatusModal(true)}
                className="w-full mb-4 py-2.5 bg-[var(--warning)]/20 hover:bg-[var(--warning)]/30 border border-[var(--warning)]/30 rounded-lg font-medium text-sm text-[var(--warning)] transition-colors flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                {deviceInfo.isIOS ? 'Setup for iOS' : 'Setup Notifications'}
              </button>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-card)]/50 mb-3">
              {categoryTabs.map((tab) => {
                const TabIcon = tab.icon
                const count = categoryCounts[tab.id]
                const isActive = activeCategory === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`
                      flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors
                      ${isActive ? 'bg-[var(--accent)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}
                    `}
                  >
                    <TabIcon className="w-3 h-3" />
                    {count > 0 && (
                      <span className={`min-w-[16px] h-[16px] flex items-center justify-center text-[10px] rounded-full ${isActive ? 'bg-white/20' : 'bg-[var(--bg-muted)]'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {filteredNotifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="w-10 h-10 mx-auto text-[var(--text-muted)]/30 mb-2" />
                  <p className="text-sm text-[var(--text-muted)]">No notifications</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => {
                  const NotifIcon = getNotificationIcon(notification.type)
                  return (
                    <div
                      key={notification.id}
                      className={`
                        p-3 rounded-lg transition-colors
                        ${notification.read ? 'bg-[var(--bg-card)]/30 opacity-70' : 'bg-[var(--bg-card)]/50'}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 p-2 rounded-lg bg-[var(--bg-hover)]">
                          <NotifIcon className="w-4 h-4 text-[var(--accent)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${notification.read ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-[10px] text-[var(--text-muted)]/60 mt-1">
                            {formatTimeAgo(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--accent)] mt-2" />
                        )}
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--surface-border)]">
                        <button
                          onClick={() => setSelectedNotification(notification)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)]/50 rounded transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Read more
                        </button>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--success)] hover:bg-[var(--success)]/10 rounded transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded transition-colors ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>

          {/* Notification Detail Modal */}
          <AnimatePresence>
            {selectedNotification && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[202] bg-black/60 flex items-center justify-center p-4"
                onClick={() => setSelectedNotification(null)}
              >
                <motion.div
                  ref={detailModalRef}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card p-6 max-w-md w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 p-3 rounded-lg bg-[var(--bg-hover)]">
                      {(() => {
                        const NotifIcon = getNotificationIcon(selectedNotification.type)
                        return <NotifIcon className="w-6 h-6 text-[var(--accent)]" />
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        {selectedNotification.title}
                      </h3>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        {formatTimeAgo(selectedNotification.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedNotification(null)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-[var(--bg-card)]/50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                      {selectedNotification.message || 'No additional details available.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    {!selectedNotification.read && (
                      <button
                        onClick={() => {
                          markAsRead(selectedNotification.id)
                          setSelectedNotification({ ...selectedNotification, read: true })
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--success)] hover:bg-[var(--success)]/10 rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => {
                        deleteNotification(selectedNotification.id)
                        setSelectedNotification(null)
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedNotification(null)}
                      className="px-4 py-2 text-sm font-medium bg-[var(--bg-hover)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Push Notification Status Modal */}
          <AnimatePresence>
            {showPushStatusModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[202] bg-black/60 flex items-center justify-center p-4"
                onClick={() => setShowPushStatusModal(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card p-6 max-w-md w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`flex-shrink-0 p-3 rounded-lg ${statusInfo.bgColor}`}>
                      <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        Push Notifications
                      </h3>
                      <p className={`text-sm mt-1 ${statusInfo.color}`}>
                        {statusInfo.label}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPushStatusModal(false)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content based on status */}
                  <div className="bg-[var(--bg-card)]/50 rounded-lg p-4 mb-4">
                    {permission === 'unsupported' && (
                      <div className="text-sm text-[var(--text-secondary)]">
                        <p className="mb-2">Push notifications are not supported in this browser.</p>
                        <p>Try using a modern browser like Chrome, Firefox, Safari, or Edge for push notification support.</p>
                      </div>
                    )}

                    {permission === 'denied' && (
                      <div className="text-sm text-[var(--text-secondary)]">
                        <p className="font-medium mb-3">{instructions.title}</p>
                        <ol className="list-decimal list-inside space-y-2 text-[var(--text-muted)]">
                          {instructions.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                        {instructions.note && (
                          <p className="mt-3 text-xs text-[var(--text-muted)]/80 italic">
                            {instructions.note}
                          </p>
                        )}
                      </div>
                    )}

                    {permission === 'granted' && (
                      <div className="text-sm text-[var(--text-secondary)]">
                        <p className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                          Push notifications are enabled!
                        </p>
                        <p className="mt-2 text-[var(--text-muted)]">
                          You'll receive notifications for buddy requests, messages, calls, and more even when the app is in the background.
                        </p>
                      </div>
                    )}

                    {permission === 'default' && !pushCapability.canRequest && (
                      <div className="text-sm text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2 mb-3">
                          {deviceInfo.isIOS && <Smartphone className="w-5 h-5 text-[var(--warning)]" />}
                          <p className="font-medium">{instructions.title}</p>
                        </div>
                        <ol className="list-decimal list-inside space-y-2 text-[var(--text-muted)]">
                          {instructions.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                        {instructions.note && (
                          <p className="mt-3 text-xs text-[var(--warning)]/80 bg-[var(--warning)]/10 p-2 rounded">
                            {instructions.note}
                          </p>
                        )}
                      </div>
                    )}

                    {permission === 'default' && pushCapability.canRequest && (
                      <div className="text-sm text-[var(--text-secondary)]">
                        <p>Enable push notifications to receive alerts for:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-[var(--text-muted)]">
                          <li>Buddy requests and connections</li>
                          <li>New messages and chat requests</li>
                          <li>Incoming calls</li>
                          <li>Token transfers and updates</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 justify-end">
                    {canShowEnableButton && (
                      <button
                        onClick={async () => {
                          await handleEnableNotifications()
                          setShowPushStatusModal(false)
                        }}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[var(--accent)] hover:bg-[var(--accent-light)] disabled:opacity-50 text-black rounded-lg transition-colors"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enabling...
                          </>
                        ) : (
                          <>
                            <Bell className="w-4 h-4" />
                            Enable Notifications
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setShowPushStatusModal(false)}
                      className="px-4 py-2 text-sm font-medium bg-[var(--bg-hover)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-lg transition-colors"
                    >
                      {canShowEnableButton ? 'Maybe Later' : 'Close'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
