import axios from 'axios'
import { pmc, walletGUID, BASE_URL } from '../store/config'

// VAPID public key for push notifications
const VAPID_PUBLIC_KEY = 'BAO70RFokJogeN8M1cdIol_BTqGnzF3YCuE5Jo2ddLLGqEDLMHNko5PSuP_M5KDJNhvMZUA-G0GvMAflnBTBd5U'

interface DeviceInfo {
  isIOS: boolean
  isAndroid: boolean
  isMobile: boolean
  isStandalone: boolean
  browser: string
}

interface CanRequestResult {
  canRequest: boolean
  reason: string | null
}

interface NotificationInstructions {
  title: string
  steps: string[]
  note: string | null
}

/**
 * Detect the device/platform type
 */
export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent || (navigator as unknown as { vendor?: string }).vendor || ''
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
  const isAndroid = /android/i.test(ua)
  const isMobile = isIOS || isAndroid || /webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)

  // Check if running as installed PWA (standalone mode)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')

  // Detect browser
  let browser = 'unknown'
  if (/CriOS/i.test(ua)) browser = 'chrome-ios'
  else if (/FxiOS/i.test(ua)) browser = 'firefox-ios'
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = isIOS ? 'safari-ios' : 'safari'
  else if (/Chrome/i.test(ua)) browser = 'chrome'
  else if (/Firefox/i.test(ua)) browser = 'firefox'
  else if (/Edg/i.test(ua)) browser = 'edge'

  return { isIOS, isAndroid, isMobile, isStandalone, browser }
}

/**
 * Check if push notifications can be requested on this device
 */
export function canRequestPushPermission(): CanRequestResult {
  const { isIOS, browser, isStandalone } = getDeviceInfo()

  // Basic support check
  if (!('Notification' in window)) return { canRequest: false, reason: 'no-notification-api' }
  if (!('serviceWorker' in navigator)) return { canRequest: false, reason: 'no-service-worker' }
  if (!('PushManager' in window)) return { canRequest: false, reason: 'no-push-manager' }

  // iOS specific checks
  if (isIOS) {
    // iOS Safari only supports push in standalone mode (PWA) on iOS 16.4+
    if (browser === 'safari-ios' && !isStandalone) {
      return { canRequest: false, reason: 'ios-needs-pwa' }
    }
    // Chrome/Firefox on iOS don't support push at all
    if (browser === 'chrome-ios' || browser === 'firefox-ios') {
      return { canRequest: false, reason: 'ios-wrong-browser' }
    }
  }

  return { canRequest: true, reason: null }
}

/**
 * Get device-specific instructions for enabling notifications
 */
export function getNotificationInstructions(): NotificationInstructions {
  const { isIOS, isAndroid, browser, isStandalone } = getDeviceInfo()
  const permission = getNotificationPermission()

  // If permission is denied, show how to unblock
  if (permission === 'denied') {
    if (isIOS) {
      return {
        title: 'Notifications Blocked',
        steps: [
          'Open Settings app on your device',
          'Scroll down and tap Safari (or this app if installed)',
          'Tap Notifications',
          'Enable "Allow Notifications"',
          'Return here and refresh the page'
        ],
        note: 'You previously blocked notifications. Follow these steps to allow them.'
      }
    }

    if (isAndroid) {
      return {
        title: 'Notifications Blocked',
        steps: [
          'Tap the lock icon in the address bar',
          'Tap "Site settings" or "Permissions"',
          'Find "Notifications" and tap it',
          'Select "Allow"',
          'Refresh the page'
        ],
        note: 'You previously blocked notifications. Follow these steps to allow them.'
      }
    }

    // Desktop
    return {
      title: 'Notifications Blocked',
      steps: [
        'Click the lock/info icon in the address bar',
        'Find "Notifications" in the permissions list',
        'Change from "Block" to "Allow"',
        'Refresh the page'
      ],
      note: 'You previously blocked notifications. Follow these steps to allow them.'
    }
  }

  if (isIOS) {
    if (browser === 'chrome-ios' || browser === 'firefox-ios') {
      return {
        title: 'Use Safari for Notifications',
        steps: [
          'Push notifications on iOS only work in Safari',
          'Open this page in Safari browser',
          'Tap the Share button (square with arrow)',
          'Select "Add to Home Screen"',
          'Open the app from your home screen',
          'Then enable notifications'
        ],
        note: 'iOS requires Safari and the app must be added to your home screen.'
      }
    }

    if (!isStandalone) {
      return {
        title: 'Add to Home Screen',
        steps: [
          'Tap the Share button (square with arrow) at the bottom of Safari',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" in the top right',
          'Open the app from your home screen',
          'Then you can enable notifications'
        ],
        note: 'iOS requires the app to be installed on your home screen for push notifications.'
      }
    }

    // iOS PWA - can request normally
    return {
      title: 'Enable Notifications',
      steps: [
        'Tap "Enable Notifications" button',
        'When prompted, tap "Allow"'
      ],
      note: null
    }
  }

  if (isAndroid) {
    return {
      title: 'Enable Notifications',
      steps: [
        'Tap "Enable Notifications" button',
        'When prompted, tap "Allow"'
      ],
      note: 'If you don\'t see a prompt, check your browser settings.'
    }
  }

  // Desktop
  return {
    title: 'Enable Notifications',
    steps: [
      'Click "Enable Notifications" button',
      'When prompted by your browser, click "Allow"'
    ],
    note: null
  }
}

// Service worker URL (served from backend)
const getServiceWorkerUrl = (): string => {
  return `${BASE_URL}/sorig/141f6617-6095-43ee-bd53-44124cd7909e/b73c49c2-f723-454f-af07-9743478fc67f/33b1dae6-1056-451f-9dd4-68ee0c04c416`
}

/**
 * Convert URL-safe base64 string to Uint8Array for VAPID key
 */
function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

/**
 * Convert ArrayBuffer to URL-safe base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Register push subscription with the backend
 */
export async function registerPushSubscription(auth: string, p256dh: string, endpoint: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const payload = {
    '@TargetWalletGUID': walletGUID,
    '@ManageSubscription': 1,
    '@endpoint': endpoint,
    '@p256dh': p256dh,
    '@auth': auth,
  }

  try {
    const response = await axios.post(`${BASE_URL}/api/universalapi/process`, {
      force_use_external_pmc: true,
      pmc,
      endPointGUID: 'e4e54196-ebb0-4976-8e77-14220589059c',
      useDevEnvironment: false,
      additionalPayload: payload,
    })

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error('Failed to register push subscription:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Request notification permission and subscribe to push notifications
 */
export async function requestNotificationPermission(): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      return { success: false, error: 'Notifications not supported' }
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      return { success: false, error: 'Service workers not supported' }
    }

    // Check if push is supported
    if (!('PushManager' in window)) {
      return { success: false, error: 'Push notifications not supported' }
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register(getServiceWorkerUrl())
    console.log('Service Worker registered:', registration)

    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, error: 'Permission denied' }
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })

    console.log('Push subscription:', subscription)

    // Extract keys
    const rawKey = subscription.getKey('p256dh')
    const rawAuth = subscription.getKey('auth')

    if (!rawKey || !rawAuth) {
      return { success: false, error: 'Failed to get subscription keys' }
    }

    const p256dh = arrayBufferToBase64(rawKey)
    const auth = arrayBufferToBase64(rawAuth)
    const endpoint = subscription.endpoint

    // Register with backend
    const result = await registerPushSubscription(auth, p256dh, endpoint)

    if (result.success) {
      // Store that we've subscribed
      localStorage.setItem('pushNotificationsEnabled', 'true')
    }

    return result
  } catch (error) {
    console.error('Push notification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

/**
 * Check if push notifications are enabled for this wallet
 */
export function isPushEnabled(): boolean {
  return localStorage.getItem('pushNotificationsEnabled') === 'true'
}
