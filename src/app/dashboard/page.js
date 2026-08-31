'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

export default function DashboardPage() {
  const { t, formatCurrency } = useLanguage()
  const { businessId, business } = useAuth()
  const [stats, setStats] = useState({ todaySales: 0, totalDue: 0, totalCustomers: 0, lowStockCount: 0, todayTransactions: 0 })
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!businessId) return
    let mounted = true

    const loadDashboardData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]

        const [productsRes, customersRes, invoicesTodayRes, recentRes] = await Promise.all([
          supabase.from('products').select('id,stock_quantity').eq('business_id', businessId).lt('stock_quantity', 10),
          supabase.from('customers').select('id,total_due').eq('business_id', businessId),
          supabase.from('invoices').select('id,total_amount').eq('business_id', businessId).gte('created_at', `${today}T00:00:00`),
          supabase.from('invoices').select('id,total_amount,due_amount,created_at,customer_name,customer_phone').eq('business_id', businessId).order('created_at', { ascending: false }).limit(8),
        ])

        if (mounted) {
          const todaySales = invoicesTodayRes.data?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0
          const totalDue = customersRes.data?.reduce((sum, c) => sum + Number(c.total_due || 0), 0) || 0

          setStats({
            todaySales,
            totalDue,
            totalCustomers: customersRes.data?.length || 0,
            lowStockCount: productsRes.data?.length || 0,
            todayTransactions: invoicesTodayRes.data?.length || 0,
          })
          setRecentInvoices(recentRes.data || [])
          setLoading(false)
        }
      } catch (err) {
        console.error('Dashboard error:', err)
        if (mounted) { setError(err.message); setLoading(false) }
      }
    }

    loadDashboardData()
    return () => { mounted = false }
  }, [businessId])

  if (!businessId) {
    return (
      <div className="p-8 text-center">
        <div className="text-slate-400 mb-2">Not linked to any business</div>
        <p className="text-sm text-slate-500">Please contact your administrator to set up your account.</p>
      </div>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  )

  if (error) return (
    <div className="p-4 bg-red-50 text-red-600 rounded-lg">Error: {error}</div>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{t('dashboard')}</h1>
        {business && (
          <p className="text-slate-500 text-sm mt-1">{business.name} · {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
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