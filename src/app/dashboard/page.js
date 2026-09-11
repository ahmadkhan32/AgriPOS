'use client'

import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useFastQuery } from '@/lib/cache'

export default function DashboardPage() {
  const { t, formatCurrency } = useLanguage()
  const { businessId, business } = useAuth()

  const { data, loading, error } = useFastQuery(
    businessId ? `dashboard_data_${businessId}` : null,
    async () => {
      const today = new Date().toISOString().split('T')[0]

      const [productsRes, customersRes, invoicesTodayRes, recentRes] = await Promise.all([
        supabase.from('products').select('id,stock_quantity').eq('business_id', businessId).lt('stock_quantity', 10),
        supabase.from('customers').select('id,total_due').eq('business_id', businessId),
        supabase.from('invoices').select('id,total_amount').eq('business_id', businessId).gte('created_at', `${today}T00:00:00`),
        supabase.from('invoices').select('id,total_amount,due_amount,created_at,customer_name,customer_phone').eq('business_id', businessId).order('created_at', { ascending: false }).limit(8),
      ])

      const todaySales = invoicesTodayRes.data?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0
      const totalDue = customersRes.data?.reduce((sum, c) => sum + Number(c.total_due || 0), 0) || 0

      return {
        stats: {
          todaySales,
          totalDue,
          totalCustomers: customersRes.data?.length || 0,
          lowStockCount: productsRes.data?.length || 0,
          todayTransactions: invoicesTodayRes.data?.length || 0,
        },
        recentInvoices: recentRes.data || []
      }
    },
    { enabled: !!businessId, maxAge: 30000 }
  )

  const stats = data?.stats || { todaySales: 0, totalDue: 0, totalCustomers: 0, lowStockCount: 0, todayTransactions: 0 }
  const recentInvoices = data?.recentInvoices || []

  if (!businessId) {
    return (
      <div className="p-8 text-center" suppressHydrationWarning>
        <div className="text-slate-400 mb-2">Not linked to any business</div>
        <p className="text-sm text-slate-500">Please contact your administrator to set up your account.</p>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse" suppressHydrationWarning>
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
            ))}
          </div>
          <div className="h-60 bg-slate-200 rounded-2xl" />
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    )
  }

  if (error && !data) return (
    <div className="p-4 bg-red-50 text-red-600 rounded-lg" suppressHydrationWarning>Error: {error}</div>
  )

  return (
    <div suppressHydrationWarning>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{t('dashboard')}</h1>
        {business && (
          <p className="text-slate-500 text-sm mt-1">{business.name} · {business.plan_id ? business.plan_id.toUpperCase() : 'STARTER'} · <span className="text-emerald-600 font-semibold uppercase">{business.status}</span></p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Main Stats (left span 2) */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 md:p-5 rounded-2xl shadow-lg shadow-green-100 text-white">
            <div className="text-white/80 text-xs md:text-sm mb-1">{t('todaySales')}</div>
            <div className="text-lg md:text-2xl font-bold">{formatCurrency(stats.todaySales)}</div>
            <div className="text-white/70 text-xs mt-1">{stats.todayTransactions} transactions</div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 md:p-5 rounded-2xl shadow-lg shadow-red-100 text-white">
            <div className="text-white/80 text-xs md:text-sm mb-1">{t('totalDue')}</div>
            <div className="text-lg md:text-2xl font-bold">{formatCurrency(stats.totalDue)}</div>
            <div className="text-white/70 text-xs mt-1">Outstanding balance</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 md:p-5 rounded-2xl shadow-lg shadow-blue-100 text-white">
            <div className="text-white/80 text-xs md:text-sm mb-1">{t('totalCustomers')}</div>
            <div className="text-lg md:text-2xl font-bold">{stats.totalCustomers}</div>
            <div className="text-white/70 text-xs mt-1">Registered customers</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 md:p-5 rounded-2xl shadow-lg shadow-orange-100 text-white">
            <div className="text-white/80 text-xs md:text-sm mb-1">{t('lowStockAlerts')}</div>
            <div className="text-lg md:text-2xl font-bold">{stats.lowStockCount}</div>
            <div className="text-white/70 text-xs mt-1">Products low stock</div>
          </div>
        </div>

        {/* Subscription Card (right span 1) */}
        <div className="bg-slate-800 rounded-2xl p-5 text-white shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Your Subscription</h3>
            <div className="text-xl font-extrabold mb-1 capitalize">{business?.plan_id || 'Starter'}</div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold mb-4 uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {business?.status || 'Active'}
            </div>
            
            <div className="space-y-3 mt-2">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1 text-slate-300">
                  <span>Products</span>
                  <span>{stats.lowStockCount} / {business?.plan_features?.max_products || 'Unlimited'}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-medium mb-1 text-slate-300">
                  <span>Customers</span>
                  <span>{stats.totalCustomers} / {business?.plan_features?.max_customers || 'Unlimited'}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <a href="/dashboard/subscription" className="w-full block text-center py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl text-sm font-semibold">
              View Plan
            </a>
          </div>
        </div>

      </div>

      {/* Recent invoices */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('recentInvoices')}</h2>
        </div>
        <div className="overflow-x-auto">
          {recentInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No invoices yet</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Invoice ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">Due</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-slate-500">#{inv.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm font-medium">{inv.customer_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(inv.total_amount)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={Number(inv.due_amount) > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600'}>
                        {formatCurrency(inv.due_amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}