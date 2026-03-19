import { useState, useEffect, useRef } from 'react'
import { BASE_URL } from '../store/config'
import { LoginModal } from './LoginModal'
import {
  acquireCdnStyleGuard,
  releaseCdnStyleGuard,
  startCapturingCdnStyles,
} from '../utils/cdnStyleGuard'

// Random cache-buster in the first path segment prevents CDN from serving stale bundle
const WALLET_BUNDLE_URL = `https://image.admin.solutions/mountable-wallet-${Math.random().toString(36).slice(2)}/58854df7-05b1-401d-a35e-4b7f1e407fc2/34186cc5-468e-4848-b273-781d859a96c5/ca08ee70-09c5-4324-bb2d-c244361a30d7`

let bundlePromise: Promise<void> | null = null

declare global {
  interface Window {
    MountableWallet?: {
      open: (config: WalletOpenConfig) => WalletController
    }
  }
}

interface WalletOpenConfig {
  walletName?: string
  apiBaseUrl: string
  onClose: () => void
}

interface WalletController {
  unmount: () => void
}

function loadWalletBundle(): Promise<void> {
  if (bundlePromise) return bundlePromise
  bundlePromise = new Promise((resolve, reject) => {
    if (window.MountableWallet) { resolve(); return }
    startCapturingCdnStyles()
    const script = document.createElement('script')
    script.src = WALLET_BUNDLE_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      bundlePromise = null
      reject(new Error('Failed to load wallet bundle'))
    }
    document.head.appendChild(script)
  })
  return bundlePromise
}

interface LazyWalletProps {
  isOpen: boolean
  onClose: () => void
}

export function LazyWallet({ isOpen, onClose }: LazyWalletProps) {
  const controllerRef = useRef<WalletController | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const authVersionRef = useRef(0)

  // When the wallet requests login, show the login modal
  useEffect(() => {
    const handler = () => setLoginOpen(true)
    window.addEventListener('mw:requireLogin', handler)
    return () => window.removeEventListener('mw:requireLogin', handler)
  }, [])

  // Open / close the wallet via the bundle's own bottom-sheet UI
  useEffect(() => {
    if (!isOpen) {
      controllerRef.current?.unmount()
      controllerRef.current = null
      return
    }

    acquireCdnStyleGuard()

    loadWalletBundle()
      .then(() => {
        if (!window.MountableWallet) throw new Error('MountableWallet global not found')
        controllerRef.current = window.MountableWallet.open({
          walletName: window.eventInfo?.Attendee?.ProfileTitle || 'User',
          apiBaseUrl: import.meta.env.DEV ? window.location.origin : (BASE_URL || 'https://seemynft.page'),
          onClose: () => {
            releaseCdnStyleGuard()
            controllerRef.current = null
            onClose()
          },
        })
      })
      .catch((err) => {
        console.error('[LazyWallet] Failed to open wallet:', err)
        releaseCdnStyleGuard()
        onClose()
      })
  }, [isOpen])

  const handleLoginSuccess = () => {
    setLoginOpen(false)
    authVersionRef.current += 1
    window.dispatchEvent(new CustomEvent('mw:loginComplete'))
    if (import.meta.env.DEV) {
      fetch('/__dev/refresh-bootstrap').finally(() => location.reload())
    }
  }

  return (
    <LoginModal
      isOpen={loginOpen}
      onClose={() => setLoginOpen(false)}
      onSuccess={handleLoginSuccess}
    />
  )
}

export default LazyWallet
