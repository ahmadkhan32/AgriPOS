'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import {
  LayoutDashboard, FileText, Leaf, Users, ClipboardList, Package,
  Settings, PlusCircle, LogOut, Sprout, History, Menu, X, Truck,
  ShoppingBag, BarChart3, UserCog, CreditCard, Building2
} from 'lucide-react'

export default function DashboardLayout({ children }) {
  const { user, loading: authLoading, initialized, signOut, businessUser, business, isAdmin, permissions } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { t, language, toggleLanguage } = useLanguage()
  const [hasMounted, setHasMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setHasMounted(true) }, [])

  useEffect(() => {
    if (initialized && !authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, initialized, router])

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [sidebarOpen])

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  const closeSidebar = () => setSidebarOpen(false)

  const can = (perm) => isAdmin || hasPermission(permissions, perm)

  const menuItems = useMemo(() => {
    const items = [
      { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard, always: true },
    ]

    if (can(PERMISSIONS.SALES_CREATE)) {
      items.push({ href: '/dashboard/invoices/new', label: t('createInvoice'), icon: PlusCircle })
    }
    if (can(PERMISSIONS.PRODUCTS_VIEW)) {
      items.push({ href: '/dashboard/products', label: t('products'), icon: Leaf })
    }
    if (can(PERMISSIONS.CUSTOMERS_VIEW)) {
      items.push({ href: '/dashboard/customers', label: t('customers'), icon: Users })
    }
    if (can(PERMISSIONS.SUPPLIERS_VIEW)) {
      items.push({ href: '/dashboard/suppliers', label: 'Suppliers', icon: Truck })
    }
    if (can(PERMISSIONS.SALES_VIEW)) {
      items.push({ href: '/dashboard/invoices', label: t('invoices'), icon: ClipboardList })
    }
    if (can(PERMISSIONS.PURCHASES_VIEW)) {
      items.push({ href: '/dashboard/purchases', label: 'Purchases', icon: ShoppingBag })
    }
    if (can(PERMISSIONS.INVENTORY_VIEW)) {
      items.push({ href: '/dashboard/inventory', label: t('inventory'), icon: Package })
    }
    if (can(PERMISSIONS.REPORTS_VIEW)) {
      items.push({ href: '/dashboard/reports', label: 'Reports', icon: BarChart3 })
    }
    if (isAdmin) {
      items.push({ href: '/dashboard/users', label: 'Users', icon: UserCog })
      items.push({ href: '/dashboard/roles', label: 'Roles', icon: Shield })
      items.push({ href: '/dashboard/audit-logs', label: 'Activity Log', icon: History })
    }
    if (can(PERMISSIONS.SETTINGS_VIEW)) {
      items.push({ href: '/dashboard/settings', label: t('settings'), icon: Settings })
    }
    items.push({ href: '/dashboard/subscription', label: 'Subscription', icon: CreditCard, always: true })

    return items
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, isAdmin, permissions])

  if (!hasMounted || authLoading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" suppressHydrationWarning>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" suppressHydrationWarning />
      </div>
    )
  }

  if (!user) return null

  const displayName = businessUser?.full_name || user.email?.split('@')[0] || 'User'
  const planName = business?.subscription_plans?.name || business?.plan_id || 'Starter'

  const SidebarContent = () => (
    <>
      <div className="p-4 xl:p-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-200">
              <Sprout size={22} />
            </div>
            <div>
              <h1 className="text-base xl:text-lg font-extrabold text-slate-800 tracking-tight">AgriPOS</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">by SabrWare</p>
            </div>
          </div>
          <button onClick={toggleLanguage} className="px-2 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-200 transition">
            {language === 'en' ? 'বাংলা' : 'English'}
          </button>
        </div>

        {/* Business info */}
        {business && (
          <div className="mt-3 px-3 py-2 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-emerald-800 truncate">{business.name}</span>
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5 pl-5">{planName} Plan · {business.status}</div>
          </div>
        )}
      </div>

      <div className="p-3">
        <Link href="/dashboard/invoices/new" prefetch={true} onClick={closeSidebar}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 hover:shadow-emerald-200 active:scale-[0.98] text-sm">
          <PlusCircle size={18} />
          <span>New Invoice</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} prefetch={true} onClick={closeSidebar}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'} />
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 px-3 py-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
            {displayName[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{displayName}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Admin' : (businessUser?.role?.name || 'Staff')}
            </p>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="w-full px-4 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-all text-sm font-medium group">
          <LogOut size={18} className="text-slate-400 group-hover:text-red-500" />
          <span>{t('signOut')}</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex bg-slate-50" suppressHydrationWarning>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 xl:w-64 bg-white border-r border-slate-200 flex-col fixed h-screen z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col h-screen z-40 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-end p-3 border-b border-slate-100">
          <button onClick={closeSidebar} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-60 xl:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 p-1.5 rounded-lg text-white"><Sprout size={18} /></div>
              <span className="font-bold text-slate-800">AgriPOS</span>
            </div>
            <button onClick={toggleLanguage} className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">
              {language === 'en' ? 'বাংলা' : 'English'}
            </button>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>

        <footer className="px-4 md:px-6 lg:px-8 py-4 text-center border-t border-slate-100 bg-white/50">
          <p className="text-xs text-slate-400 font-medium tracking-wide">All Rights Reserved © {new Date().getFullYear()} SabrWare</p>
        </footer>
      </main>
    </div>
  )
}

// Need to import Shield for roles menu
function Shield({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}