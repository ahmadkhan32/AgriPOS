'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  Sprout, LayoutDashboard, Building2, CreditCard, Users,
  Settings, LogOut, Menu, X, Shield, FileText
} from 'lucide-react'

const menuItems = [
  { href: '/super-admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/super-admin/businesses', label: 'Businesses', icon: Building2 },
  { href: '/super-admin/plans', label: 'Plans & Pricing', icon: CreditCard },
]

export default function SuperAdminLayout({ children }) {
  const { user, loading, initialized, isSuperAdmin, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => { setHasMounted(true) }, [])

  useEffect(() => {
    if (!initialized || loading) return
    if (!user || !isSuperAdmin) {
      router.replace('/login')
    }
  }, [user, isSuperAdmin, initialized, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  if (!hasMounted || loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900" suppressHydrationWarning>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-400" suppressHydrationWarning />
      </div>
    )
  }

  if (!user || !isSuperAdmin) return null

  const isActive = (href, exact) => exact ? pathname === href : pathname.startsWith(href)

  return (
    <div className="min-h-screen flex bg-slate-900" suppressHydrationWarning>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 border-r border-slate-700 flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:flex
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-violet-600 p-2 rounded-xl text-white shadow-lg shadow-violet-900">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="font-extrabold text-white text-lg leading-tight">Super Admin</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-violet-400">AgriPOS Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-violet-600 text-white font-semibold shadow-lg shadow-violet-900'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon size={20} className={active ? 'text-violet-200' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="text-sm">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-4 py-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-xs">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-300 truncate">{user.email}</p>
              <p className="text-[10px] text-violet-400 uppercase tracking-wider font-bold">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-all text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-violet-400" />
            <span className="font-bold text-white">Super Admin</span>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </div>

        <footer className="px-8 py-4 text-center border-t border-slate-700">
          <p className="text-xs text-slate-500 font-medium">AgriPOS Platform — Super Admin Console © {new Date().getFullYear()} SabrWare</p>
        </footer>
      </main>
    </div>
  )
}
