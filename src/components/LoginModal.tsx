import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Eye, EyeOff, Loader2, Mail, Lock, KeyRound, ShieldCheck, Check,
} from 'lucide-react'
import { BASE_URL, walletGUID } from '../store/config'

const LOGIN_URL = `${BASE_URL}/api/UniversalPassword/login`
const RESET_URL = `${BASE_URL}/api/UniversalPassword/reset`
const TOS_KEY = 'mw:tosAccepted'

async function universAPILogin(
  data: Record<string, unknown>,
  endpoint: 'login' | 'reset' = 'login',
) {
  const url = endpoint === 'reset' ? RESET_URL : LOGIN_URL
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    return json?.data ?? json
  } catch (err) {
    return { statusCode: '1003', errorMessage: (err as Error).message || 'Request failed' }
  }
}

// ── Circular countdown timer for 2FA code ──────────────────────────────────
interface TimerHandle {
  resume: () => void
  pause: () => void
  reset: () => void
}

interface CircularTimerProps {
  duration?: number
  onComplete?: () => void
}

const CircularTimer = forwardRef<TimerHandle, CircularTimerProps>(
  ({ duration = 300, onComplete }, ref) => {
    const [timeLeft, setTimeLeft] = useState(duration)
    const [isPaused, setIsPaused] = useState(true)
    const endTimeRef = useRef<number | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const completedRef = useRef(false)

    useImperativeHandle(ref, () => ({
      resume: () => {
        endTimeRef.current = Date.now() + timeLeft * 1000
        completedRef.current = false
        setIsPaused(false)
      },
      pause: () => setIsPaused(true),
      reset: () => {
        setTimeLeft(duration)
        endTimeRef.current = null
        completedRef.current = false
        setIsPaused(true)
      },
    }))

    useEffect(() => {
      if (isPaused) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        return
      }
      const tick = () => {
        if (!endTimeRef.current) return
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
        setTimeLeft(remaining)
        if (remaining <= 0 && !completedRef.current) {
          completedRef.current = true
          clearInterval(intervalRef.current!)
          onComplete?.()
        }
      }
      tick()
      intervalRef.current = setInterval(tick, 100)
      return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [isPaused, onComplete])

    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const circumference = 2 * Math.PI * 40
    const dash = (timeLeft / duration) * circumference

    return (
      <div className="flex flex-col items-center mt-4">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90">
            <circle cx="48" cy="48" r="40" fill="none" stroke="var(--bg-muted)" strokeWidth="4" />
            <circle
              cx="48" cy="48" r="40" fill="none" strokeWidth="4" strokeLinecap="round"
              stroke="var(--accent)" strokeDasharray={circumference} strokeDashoffset={circumference - dash}
              className="timer-arc"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-mono text-[var(--text-primary)]">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">Code expires in</p>
      </div>
    )
  },
)
CircularTimer.displayName = 'CircularTimer'

// ── Main modal ─────────────────────────────────────────────────────────────
export interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = 'email' | 'password' | 'code' | 'resetPassword' | 'tos'

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [step, setStep] = useState<Step>('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [codeCheckGUID, setCodeCheckGUID] = useState('')
  const [loginTokenGUID, setLoginTokenGUID] = useState('')
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false)
  const [savedWalletGUID, setSavedWalletGUID] = useState('')

  const timerRef = useRef<TimerHandle>(null)

  useEffect(() => {
    if (!isOpen) {
      setEmail(''); setPassword(''); setCode('')
      setNewPassword(''); setConfirmPassword('')
      setStep('email'); setError(''); setLoading(false)
      setShowPassword(false); setShowConfirmPassword(false)
      setCodeCheckGUID(''); setLoginTokenGUID('')
      setNeedsPasswordReset(false); setSavedWalletGUID('')
    }
  }, [isOpen])

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

  const loginPayload = (extra: Record<string, unknown> = {}) => ({
    two_factor_address: email.trim(),
    ...(walletGUID ? { wallet_uid: walletGUID, is_wallet_present: true } : {}),
    ...extra,
  })

  const completeLogin = () => onSuccess()

  const handleLoginSuccess = (_data: Record<string, unknown>) => {
    if (!localStorage.getItem(TOS_KEY)) {
      setStep('tos')
      return
    }
    completeLogin()
  }

  const handleEmailSubmit = async () => {
    if (!email.trim()) return setError('Please enter your email')
    if (!isValidEmail(email)) return setError('Please enter a valid email address')
    setLoading(true); setError('')
    const res = await universAPILogin(loginPayload())
    setLoading(false)
    const sc = String(res?.statusCode ?? '')
    if (sc === '1003') return setError(res?.errorMessage || 'Email not recognised')
    if (sc === '1000') return setStep('password')
    if (sc === '1002') {
      setCodeCheckGUID(res?.codeCheckGUID ?? '')
      setLoginTokenGUID(res?.loginTokenGUID ?? '')
      setNeedsPasswordReset(true)
      setStep('code')
      setTimeout(() => timerRef.current?.resume(), 500)
    }
  }

  const handlePasswordSubmit = async () => {
    if (!password.trim()) return setError('Please enter your password')
    setLoading(true); setError('')
    const res = await universAPILogin(loginPayload({ input_password: password.trim() }))
    setLoading(false)
    const sc = String(res?.statusCode ?? '')
    if (sc === '1003') return setError(res?.errorMessage || 'Invalid password')
    if (sc === '1001') return handleLoginSuccess(res)
    if (sc === '1002') {
      setCodeCheckGUID(res?.codeCheckGUID ?? '')
      setLoginTokenGUID(res?.loginTokenGUID ?? '')
      setStep('code')
      setTimeout(() => timerRef.current?.resume(), 500)
    }
  }

  const handleRequestCode = async () => {
    setLoading(true); setError('')
    const res = await universAPILogin(loginPayload({ use_access_code: true }))
    setLoading(false)
    if (String(res?.statusCode ?? '') === '1002') {
      setCodeCheckGUID(res?.codeCheckGUID ?? '')
      setStep('code')
      setTimeout(() => timerRef.current?.resume(), 500)
    }
  }

  const handleCodeSubmit = async () => {
    if (!code.trim() || code.length !== 6) return setError('Please enter the 6-digit code')
    setLoading(true); setError('')
    const res = await universAPILogin(loginPayload({
      use_access_code: true,
      code_guid: codeCheckGUID,
      input_password: code,
    }))
    setLoading(false)
    const sc = String(res?.statusCode ?? '')
    if (sc === '1003') return setError(res?.errorMessage || 'Invalid code')
    if (sc === '1001') {
      setSavedWalletGUID(res?.walletGUID ?? '')
      if (needsPasswordReset) return setStep('resetPassword')
      handleLoginSuccess(res)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) return setError('Please fill in both fields')
    if (newPassword !== confirmPassword) return setError('Passwords do not match')
    const missing: string[] = []
    if (newPassword.length < 8) missing.push('8+ characters')
    if (!/[A-Z]/.test(newPassword)) missing.push('uppercase letter')
    if (!/[a-z]/.test(newPassword)) missing.push('lowercase letter')
    if (!/[0-9]/.test(newPassword)) missing.push('number')
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) missing.push('special character')
    if (missing.length) return setError(`Still needs: ${missing.join(', ')}`)
    setLoading(true); setError('')
    const res = await universAPILogin({
      two_factor_address: email.trim(),
      login_token_guid: loginTokenGUID,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }, 'reset')
    setLoading(false)
    const sc = String(res?.statusCode ?? '')
    if (sc === '1003') return setError(res?.errorMessage || 'Reset failed')
    if (!localStorage.getItem(TOS_KEY)) { setStep('tos'); return }
    completeLogin()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (step === 'email') handleEmailSubmit()
    else if (step === 'password') handlePasswordSubmit()
    else if (step === 'code') handleCodeSubmit()
    else if (step === 'resetPassword') handleResetPassword()
  }

  // Shared class strings
  const inputCls =
    'w-full py-3 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors'

  const primaryBtnCls =
    'w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-light)] disabled:opacity-50 rounded-xl font-semibold text-[var(--bg-darkest)] text-sm transition-colors flex items-center justify-center gap-2'

  const ghostBtnCls =
    'w-full py-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-sm transition-colors'

  const eyeBtnCls =
    'absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={step !== 'tos' ? onClose : undefined}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 z-[201] flex items-center justify-center pointer-events-none"
          >
            <div className="glass-card w-full max-w-sm p-6 pointer-events-auto relative">

              {step !== 'tos' && (
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface-border)] flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-[var(--accent)]" />
                </div>
              </div>

              {/* Email step */}
              {step === 'email' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      onKeyDown={handleKeyDown}
                      placeholder="Email"
                      autoComplete="email"
                      className={`${inputCls} pl-11 pr-4`}
                    />
                  </div>
                  {error && <p className="text-[var(--error)] text-sm">{error}</p>}
                  <button type="button" onClick={handleEmailSubmit} disabled={loading} className={primaryBtnCls}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                  </button>
                </div>
              )}

              {/* Password step */}
              {step === 'password' && (
                <div className="space-y-4">
                  <p className="text-[var(--text-muted)] text-sm text-center truncate">{email}</p>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError('') }}
                      onKeyDown={handleKeyDown}
                      placeholder="Password"
                      autoComplete="current-password"
                      className={`${inputCls} pl-11 pr-12`}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className={eyeBtnCls}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {error && <p className="text-[var(--error)] text-sm">{error}</p>}
                  <button type="button" onClick={handlePasswordSubmit} disabled={loading} className={primaryBtnCls}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
                  </button>
                  <button type="button" onClick={handleRequestCode} disabled={loading} className={ghostBtnCls}>
                    Request Code Instead
                  </button>
                </div>
              )}

              {/* 2FA code step */}
              {step === 'code' && (
                <div className="space-y-4">
                  <p className="text-[var(--text-muted)] text-sm text-center truncate">{email}</p>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                      type="tel"
                      value={code}
                      onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                      onKeyDown={handleKeyDown}
                      placeholder="6-digit code"
                      maxLength={6}
                      className={`${inputCls} pl-11 pr-4 text-center tracking-[0.5em] font-mono`}
                    />
                  </div>
                  {error && <p className="text-[var(--error)] text-sm">{error}</p>}
                  <button type="button" onClick={handleCodeSubmit} disabled={loading} className={primaryBtnCls}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit'}
                  </button>
                  <CircularTimer
                    ref={timerRef}
                    duration={300}
                    onComplete={() => {
                      setError('Code expired. Please try again.')
                      setStep('email')
                      timerRef.current?.reset()
                    }}
                  />
                </div>
              )}

              {/* Password reset step */}
              {step === 'resetPassword' && (
                <div className="space-y-4">
                  <h3 className="text-center text-lg font-semibold text-[var(--text-primary)]">Set Your Password</h3>
                  <div className="space-y-3">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                        placeholder="New Password"
                        autoComplete="new-password"
                        className={`${inputCls} pl-11 pr-12`}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(!showPassword)}
                        className={eyeBtnCls}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                        onKeyDown={handleKeyDown}
                        placeholder="Confirm Password"
                        autoComplete="new-password"
                        className={`${inputCls} pl-11 pr-12`}
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={eyeBtnCls}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  {newPassword && (
                    <div className="space-y-1">
                      {[
                        { met: newPassword.length >= 8, label: 'At least 8 characters' },
                        { met: /[A-Z]/.test(newPassword), label: 'Uppercase letter' },
                        { met: /[a-z]/.test(newPassword), label: 'Lowercase letter' },
                        { met: /[0-9]/.test(newPassword), label: 'Number' },
                        { met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword), label: 'Special character' },
                      ].map(({ met, label }) => (
                        <div key={label} className={`flex items-center gap-1.5 text-xs ${met ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                          <Check className={`w-3 h-3 ${met ? 'opacity-100' : 'opacity-30'}`} />
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {error && <p className="text-[var(--error)] text-sm">{error}</p>}
                  <button type="button" onClick={handleResetPassword} disabled={loading} className={primaryBtnCls}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Set Password'}
                  </button>
                  <button type="button" onClick={completeLogin} disabled={loading} className={ghostBtnCls}>
                    Skip for now
                  </button>
                </div>
              )}

              {/* ToS step */}
              {step === 'tos' && (
                <div className="space-y-4">
                  <h3 className="text-center text-base font-bold text-[var(--text-primary)]">Terms of Service</h3>
                  <p className="text-center text-sm text-[var(--text-muted)] leading-relaxed">
                    By continuing you agree to our Terms of Service, Privacy Policy, and Cookie Policy.
                  </p>
                  <button
                    type="button"
                    onClick={() => { localStorage.setItem(TOS_KEY, '1'); completeLogin() }}
                    className={primaryBtnCls}
                  >
                    Accept &amp; Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('AuthorizationToken')
                      localStorage.removeItem('EntityLoginToken')
                      onClose()
                    }}
                    className="w-full py-2 text-[var(--text-muted)] hover:text-[var(--error)] text-sm transition-colors"
                  >
                    Decline
                  </button>
                </div>
              )}

              {/* suppress unused savedWalletGUID warning */}
              {false && savedWalletGUID}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default LoginModal
