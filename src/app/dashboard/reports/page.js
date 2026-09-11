'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useFastQuery } from '@/lib/cache'
import { BarChart3, TrendingUp, Receipt, Package, Users, DollarSign, Download } from 'lucide-react'

export default function ReportsPage() {
  const { businessId, business } = useAuth()
  const { formatCurrency } = useLanguage()
  const [period, setPeriod] = useState('today')

  const getDateRange = (p) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    if (p === 'today') return [`${today}T00:00:00`, `${today}T23:59:59`]
    if (p === 'week') {
      const d = new Date(now); d.setDate(d.getDate() - 7)
      return [d.toISOString(), now.toISOString()]
    }
    if (p === 'month') {
      return [new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), now.toISOString()]
    }
    if (p === 'year') {
      return [new Date(now.getFullYear(), 0, 1).toISOString(), now.toISOString()]
    }
    return [null, null]
  }

  const { data: reportData, loading, error, refetch } = useFastQuery(
    businessId ? `reports_${businessId}_${period}` : null,
    async () => {
      const [start, end] = getDateRange(period)

      let invQ = supabase.from('invoices').select('id,total_amount,paid_amount,due_amount').eq('business_id', businessId)
      if (start) invQ = invQ.gte('created_at', start).lte('created_at', end)

      let custQ = supabase.from('customers').select('id,created_at').eq('business_id', businessId)
      if (start) custQ = custQ.gte('created_at', start)

      let purchQ = supabase.from('purchases').select('total_amount').eq('business_id', businessId)
      if (start) purchQ = purchQ.gte('created_at', start)

      const [invoicesRes, customersRes, purchasesRes] = await Promise.all([invQ, custQ, purchQ])

      const invoices = invoicesRes.data || []
      const customers = customersRes.data || []
      const purchases = purchasesRes.data || []

      // Fetch invoice items for up to 100 recent invoices to prevent payload timeout
      let items = []
      if (invoices.length > 0) {
        const invoiceIds = invoices.slice(0, 100).map(i => i.id)
        const { data: fetchedItems } = await supabase
          .from('invoice_items')
          .select('product_name, quantity, item_total, invoice_id')
          .in('invoice_id', invoiceIds)
        items = fetchedItems || []
      }

      // Aggregate top products
      const productMap = {}
      items.forEach(item => {
        if (!productMap[item.product_name]) productMap[item.product_name] = { qty: 0, revenue: 0 }
        productMap[item.product_name].qty += Number(item.quantity)
        productMap[item.product_name].revenue += Number(item.item_total)
      })
      const topProducts = Object.entries(productMap)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      return {
        totalSales: invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0),
        totalPaid: invoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0),
        totalDue: invoices.reduce((s, i) => s + Number(i.due_amount || 0), 0),
        invoiceCount: invoices.length,
        newCustomers: customers.length,
        totalPurchases: purchases.reduce((s, p) => s + Number(p.total_amount || 0), 0),
        topProducts,
      }
    },
    { enabled: !!businessId, maxAge: 60000 }
  )

  const data = reportData || { totalSales: 0, totalDue: 0, totalPaid: 0, invoiceCount: 0, topProducts: [], newCustomers: 0, totalPurchases: 0 }
  const periodLabels = { today: "Today", week: "Last 7 Days", month: "This Month", year: "This Year" }

  return (
    <div suppressHydrationWarning>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 size={24} className="text-purple-600" />
            Reports
          </h1>
          {business && <p className="text-slate-500 text-sm mt-1">{business.name}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(periodLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${period === key ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && !reportData ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Sales', val: formatCurrency(data.totalSales), icon: TrendingUp, color: 'from-emerald-500 to-emerald-600' },
              { label: 'Amount Collected', val: formatCurrency(data.totalPaid), icon: DollarSign, color: 'from-blue-500 to-blue-600' },
              { label: 'Outstanding Due', val: formatCurrency(data.totalDue), icon: Receipt, color: 'from-red-500 to-red-600' },
              { label: 'Total Invoices', val: data.invoiceCount, icon: Receipt, color: 'from-slate-600 to-slate-700' },
              { label: 'New Customers', val: data.newCustomers, icon: Users, color: 'from-violet-500 to-violet-600' },
              { label: 'Purchases', val: formatCurrency(data.totalPurchases), icon: Package, color: 'from-orange-500 to-orange-600' },
            ].map(({ label, val, icon: Icon, color }) => (
              <div key={label} className={`bg-gradient-to-br ${color} p-5 rounded-2xl text-white shadow-lg`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className="opacity-80" />
                  <span className="text-xs font-semibold opacity-80 uppercase tracking-wide">{label}</span>
                </div>
                <div className="text-2xl font-bold">{val}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <h2 className="font-bold text-slate-800">Top Products — {periodLabels[period]}</h2>
            </div>
            {data.topProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No sales data for this period</div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Product</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">Qty Sold</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p, i) => (
                    <tr key={p.name} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600">{p.qty.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-700">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
