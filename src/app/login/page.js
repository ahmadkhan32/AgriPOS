'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { isSuperAdmin as checkSuperAdmin } from '@/lib/superAdmin'
import { Sprout, Mail, Lock, ArrowRight, Loader2, Shield, KeyRound, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { signIn, user, initialized } = useAuth()
  const router = useRouter()
  const { t, language, toggleLanguage } = useLanguage()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (!initialized) return
    if (user) {
      if (checkSuperAdmin(user)) {
        router.push('/super-admin')
      } else {
        router.push('/dashboard')
      }
    }
  }, [user, initialized, router])

  const performLogin = async (loginEmail, loginPassword) => {
    setError('')
    setLoading(true)
    try {
      const data = await signIn(loginEmail, loginPassword)
      const loggedUser = data?.user
      const isSuper = checkSuperAdmin(loggedUser)
      const destination = isSuper ? '/super-admin' : '/dashboard'

      // Instant client transition
      router.push(destination)

      // Fallback reload if client transition is delayed
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/login') {
          window.location.href = destination
        }
      }, 600)
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    await performLogin(email, password)
  }

  const fillAndLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    performLogin(demoEmail, demoPass)
  }

  // Don't render until client-side mounted to avoid SSR/client mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" suppressHydrationWarning>
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" suppressHydrationWarning />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden py-10"
      suppressHydrationWarning
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" suppressHydrationWarning>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600 blur-[120px]" />
      </div>

      {/* Top bar */}
      <div className="absolute top-6 left-6">
        <a href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
          ← Back to home
        </a>
      </div>
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleLanguage}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm font-semibold text-sm hover:bg-slate-50 transition-colors"
        >
          {language === 'en' ? 'বাংলা' : 'English'}
        </button>
      </div>

      <div className="w-full max-w-[460px] px-6 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-emerald-600 p-4 rounded-3xl text-white shadow-xl shadow-emerald-200 mb-4 transform hover:rotate-12 transition-transform duration-500">
            <Sprout size={40} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">AgriPOS</h1>
          <p className="text-slate-500 mt-2 font-medium">Sign in to your account</p>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-xl border border-slate-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">{t('signIn')}</h2>
            <p className="text-slate-500 text-sm mt-1">Enter your credentials to access your dashboard.</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-medium flex items-start gap-3">
              <div className="mt-0.5">⚠️</div>
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('email')}</label>
              <div className="relative group" suppressHydrationWarning>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium text-sm"
                  placeholder="admin@agripos.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('password')}</label>
              <div className="relative group" suppressHydrationWarning>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium text-sm"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3.5 rounded-2xl hover:bg-emerald-700 disabled:opacity-50 font-bold shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>{t('signIn')}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              <KeyRound size={14} className="text-emerald-600" />
              <span>One-Click Quick Login</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fillAndLogin('admin@agripos.com', 'admin@agripos')}
                disabled={loading}
                className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Shop Admin (Dashboard)</div>
                  <div className="text-[11px] text-slate-500 font-mono">admin@agripos.com · admin@agripos</div>
                </div>
                <span className="text-xs font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Login <ArrowRight size={12} />
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillAndLogin('superadmin@agripos.com', 'admin@agripos')}
                disabled={loading}
                className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-violet-50 hover:border-violet-300 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-violet-700">Super Admin (Platform)</div>
                  <div className="text-[11px] text-slate-500 font-mono">superadmin@agripos.com · admin@agripos</div>
                </div>
                <span className="text-xs font-semibold text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Login <ArrowRight size={12} />
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
          <Shield size={12} />
          Secured by SabrWare
        </div>
      </div>
    </div>
  )
}