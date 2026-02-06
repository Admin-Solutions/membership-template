import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, ChevronRight } from 'lucide-react'
import { pmc, walletGUID, BASE_URL } from '../store/config'

// CDN URL for the mountable wallet bundle (always from CDN)
// Random cache buster in first path segment ensures fresh fetch
const WALLET_BUNDLE_URL = `https://image.admin.solutions/mountable-wallet-${Math.random().toString(36).slice(2)}/58854df7-05b1-401d-a35e-4b7f1e407fc2/34186cc5-468e-4848-b273-781d859a96c5/ca08ee70-09c5-4324-bb2d-c244361a30d7`

// Track if the script has been loaded
let scriptLoaded = false
let scriptLoading = false
let loadPromise: Promise<void> | null = null

// Declare MountableWallet on window
declare global {
  interface Window {
    MountableWallet?: {
      mount: (container: HTMLElement, config: WalletConfig) => WalletInstance
    }
    eventInfo?: {
      authorName?: string
    }
  }
}

interface WalletConfig {
  walletGuid: string
  walletName: string
  authToken?: string
  pmc: string
  entityAuth?: string
  apiBaseUrl: string
  onAuthError?: (err: Error) => void
}

interface WalletInstance {
  unmount: () => void
  refresh?: () => void
}

/**
 * Dynamically load the wallet bundle from CDN
 */
function loadWalletBundle(): Promise<void> {
  if (scriptLoaded) {
    return Promise.resolve()
  }

  if (scriptLoading && loadPromise) {
    return loadPromise
  }

  scriptLoading = true
  loadPromise = new Promise((resolve, reject) => {
    // Capture any errors during script execution
    const errorHandler = (event: ErrorEvent) => {
      console.error('[LazyWallet] Script execution error:', event.error || event.message)
    }
    window.addEventListener('error', errorHandler)

    const script = document.createElement('script')
    script.src = WALLET_BUNDLE_URL
    script.async = true

    script.onload = () => {
      window.removeEventListener('error', errorHandler)
      scriptLoaded = true
      scriptLoading = false

      // Debug: Check what MountableWallet contains
      console.log('[LazyWallet] Script loaded. MountableWallet:', window.MountableWallet)

      resolve()
    }

    script.onerror = () => {
      window.removeEventListener('error', errorHandler)
      scriptLoading = false
      console.error('[LazyWallet] Script load error')
      reject(new Error('Failed to load wallet bundle'))
    }

    document.head.appendChild(script)
  })

  return loadPromise
}

interface LazyWalletProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Lazy-loading wallet component
 * Loads the mountable-wallet bundle on first open and mounts it
 */
export function LazyWallet({ isOpen, onClose }: LazyWalletProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [pillY, setPillY] = useState(50)
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 768)
  const containerRef = useRef<HTMLDivElement>(null)
  const walletRef = useRef<WalletInstance | null>(null)
  const dragStart = useRef({ x: 0, y: 0 })

  // Track desktop vs mobile
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Mount the wallet when opened
  const mountWallet = useCallback(async () => {
    if (!isOpen || mounted) return

    setLoading(true)
    setError(null)

    try {
      // Load the bundle if not already loaded
      await loadWalletBundle()

      // Check if MountableWallet is available
      if (!window.MountableWallet) {
        throw new Error('MountableWallet not found after loading bundle')
      }

      // Mount the wallet
      if (containerRef.current) {
        walletRef.current = window.MountableWallet.mount(containerRef.current, {
          walletGuid: walletGUID,
          walletName: window.eventInfo?.authorName || 'User',
          pmc: pmc,
          apiBaseUrl: BASE_URL,
          onAuthError: (err) => {
            console.error('Wallet auth error:', err)
            setError('Authentication error')
          },
        })
        setMounted(true)
      }
    } catch (err) {
      console.error('Failed to load wallet:', err)
      setError(err instanceof Error ? err.message : 'Failed to load wallet')
    } finally {
      setLoading(false)
    }
  }, [isOpen, mounted])

  // Effect to mount wallet when opened
  useEffect(() => {
    if (isOpen && !mounted) {
      mountWallet()
    }
  }, [isOpen, mounted, mountWallet])

  // Unmount wallet when closed
  useEffect(() => {
    if (!isOpen && mounted && walletRef.current) {
      walletRef.current.unmount()
      walletRef.current = null
      setMounted(false)
    }
  }, [isOpen, mounted])

  // Lock body scroll when open and reset drag state
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      setDragOffset(0)
      setPillY(50)
      setIsDragging(false)

      return () => {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  // Touch handlers for drag-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches || !e.touches[0]) return
    e.preventDefault()
    const touch = e.touches[0]
    setIsDragging(true)
    dragStart.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !e.touches || !e.touches[0]) return
    e.preventDefault()
    const touch = e.touches[0]
    const deltaX = touch.clientX - dragStart.current.x
    setDragOffset(Math.max(0, deltaX))
    setPillY(Math.max(10, Math.min(90, (touch.clientY / window.innerHeight) * 100)))
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragOffset > window.innerWidth * 0.3) {
      setDragOffset(window.innerWidth)
      setTimeout(() => onClose(), 250)
    } else {
      setDragOffset(0)
    }
  }

  // Mouse handlers for desktop drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
  }

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.current.x
      setDragOffset(Math.max(0, deltaX))
      setPillY(Math.max(10, Math.min(90, (e.clientY / window.innerHeight) * 100)))
    }
    const handleMouseUp = () => {
      setIsDragging(false)
      if (dragOffset > window.innerWidth * 0.3) {
        setDragOffset(window.innerWidth)
        setTimeout(() => onClose(), 250)
      } else {
        setDragOffset(0)
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50"
          />

          {/* Full-screen panel */}
          <motion.div
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            exit={{ clipPath: 'inset(0 100% 0 0)' }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-[100]"
            style={{ pointerEvents: 'auto' }}
          >
            <div
              className="h-full bg-[#0a0a0a] flex flex-col overflow-hidden"
              style={{
                transform: `translateX(${dragOffset}px)`,
                transition: isDragging ? 'none' : 'transform 0.25s ease-out'
              }}
            >
              {/* Draggable edge zone with floating pill */}
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                className="absolute left-0 top-0 bottom-0 w-10 z-[110] cursor-grab active:cursor-grabbing"
                style={{
                  touchAction: 'none',
                  background: 'linear-gradient(to right, rgba(255, 255, 255, 0.05), transparent)'
                }}
              >
                {/* Floating pill - ChevronRight on mobile, X on desktop */}
                <div
                  onClick={(e) => {
                    if (isDesktop && !isDragging) {
                      e.stopPropagation()
                      onClose()
                    }
                  }}
                  className={`absolute left-1/2 flex items-center justify-center p-3 rounded-xl ${
                    isDragging ? 'bg-[#6366f1]' : 'bg-white/15 backdrop-blur-md'
                  } border border-white/20 shadow-lg transition-colors ${
                    isDesktop ? 'cursor-pointer hover:bg-white/25' : ''
                  }`}
                  style={{
                    top: `${pillY}%`,
                    transform: 'translate(-50%, -50%)',
                    transition: isDragging ? 'none' : 'top 0.15s ease-out'
                  }}
                >
                  {isDesktop ? (
                    <X className="w-6 h-6 text-white" />
                  ) : (
                    <ChevronRight className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>

              {/* Loading state */}
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin mx-auto mb-4" />
                    <p className="text-[#6b6b6b]">Loading wallet...</p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && !loading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                      onClick={() => {
                        setError(null)
                        setMounted(false)
                        mountWallet()
                      }}
                      className="px-4 py-2 bg-[#6366f1] text-white rounded-lg hover:bg-[#818cf8] transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* Wallet container - edge to edge, pill overlays */}
              <div
                ref={containerRef}
                className={`flex-1 overflow-y-auto overflow-x-hidden ${loading || error ? 'hidden' : ''}`}
                style={{
                  paddingTop: 'env(safe-area-inset-top, 0px)',
                  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                  WebkitOverflowScrolling: 'touch',
                  minHeight: 0,
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default LazyWallet
