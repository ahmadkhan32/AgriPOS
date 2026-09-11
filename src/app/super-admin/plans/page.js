'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CreditCard, Edit2, Save, X } from 'lucide-react'

export default function PlansPage() {
  const [plans, setPlans] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    setLoading(true)
    const { data } = await supabase.from('subscription_plans').select('*').order('sort_order')
    setPlans(data || [])
    setLoading(false)
  }

  const startEdit = (plan) => {
    setEditingId(plan.id)
    setEditData({ monthly_price: plan.monthly_price, yearly_price: plan.yearly_price, max_users: plan.max_users, max_branches: plan.max_branches, max_products: plan.max_products })
  }

  const saveEdit = async (id) => {
    await supabase.from('subscription_plans').update({
      monthly_price: parseFloat(editData.monthly_price),
      yearly_price: parseFloat(editData.yearly_price),
      max_users: parseInt(editData.max_users),
      max_branches: parseInt(editData.max_branches),
      max_products: parseInt(editData.max_products),
    }).eq('id', id)
    setEditingId(null)
    loadPlans()
  }

  return (
    <div suppressHydrationWarning>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white">Plans & Pricing</h1>
        <p className="text-slate-400 text-sm mt-1">Manage subscription plans and their pricing</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {loading ? (
          <div className="p-8 text-center col-span-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400 mx-auto" />
          </div>
        ) : plans.map(plan => (
          <div key={plan.id} className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard size={20} className="text-violet-400" />
                {plan.name}
              </h3>
              {editingId === plan.id ? (
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(plan.id)} className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/40 transition-colors">
                    <Save size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={() => startEdit(plan)} className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors">
                  <Edit2 size={16} />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {[
                { label: 'Monthly Price (PKR)', key: 'monthly_price' },
                { label: 'Yearly Price (PKR)', key: 'yearly_price' },
                { label: 'Max Users (-1 = unlimited)', key: 'max_users' },
                { label: 'Max Branches (-1 = unlimited)', key: 'max_branches' },
                { label: 'Max Products (-1 = unlimited)', key: 'max_products' },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">{label}</span>
                  {editingId === plan.id ? (
                    <input
                      type="number"
                      value={editData[key] ?? ''}
                      onChange={e => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-32 px-3 py-1.5 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg outline-none focus:border-violet-500 text-right"
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {plan[key] === -1 ? '∞ Unlimited' : (key.includes('price') ? `PKR ${Number(plan[key]).toLocaleString()}` : plan[key])}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${plan.advanced_reports ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                {plan.advanced_reports ? '✓' : '✗'} Advanced Reports
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${plan.offline_enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                {plan.offline_enabled ? '✓' : '✗'} Offline POS
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
