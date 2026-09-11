'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Link from 'next/link'
import { ShoppingBag, Plus, Eye } from 'lucide-react'

export default function PurchasesPage() {
  const { businessId } = useAuth()
  const { formatCurrency } = useLanguage()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (businessId) loadPurchases()
  }, [businessId])

  const loadPurchases = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('purchases')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
    setPurchases(data || [])
    setLoading(false)
  }

  const statusBadge = (status) => {
    const map = { received: 'bg-emerald-100 text-emerald-700', pending: 'bg-yellow-100 text-yellow-700', partial: 'bg-blue-100 text-blue-700' }
    return map[status] || 'bg-slate-100 text-slate-600'
  }

  return (
    <div suppressHydrationWarning>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShoppingBag size={24} className="text-orange-600" />
          Purchases
        </h1>
        <Link href="/dashboard/purchases/new"
          className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 flex items-center gap-2 font-semibold transition-all">
          <Plus size={18} /> New Purchase
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto" /></div>
        ) : purchases.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <ShoppingBag size={40} className="mx-auto mb-3 text-slate-300" />
            <p>No purchases yet. Create your first purchase order.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {['Reference', 'Supplier', 'Total', 'Paid', 'Due', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-sm font-medium text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono text-slate-600">{p.reference_no || `PO-${p.id.slice(0, 6).toUpperCase()}`}</td>
                  <td className="px-4 py-3 text-sm font-medium">{p.supplier_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(p.total_amount)}</td>
                  <td className="px-4 py-3 text-sm text-right text-emerald-700">{formatCurrency(p.paid_amount)}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(p.due_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusBadge(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
