'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { CreditCard, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react'

const PLANS = [
  { id: 'starter', name: 'Starter', monthly: 1999, yearly: 19990, users: 2, branches: 1, products: '1,000', popular: false },
  { id: 'business', name: 'Business', monthly: 3999, yearly: 39990, users: 5, branches: 2, products: '10,000', popular: true },
  { id: 'professional', name: 'Professional', monthly: 6999, yearly: 69990, users: 15, branches: 5, products: 'Unlimited', popular: false },
]

export default function SubscriptionPage() {
  const { businessId, business } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [usageStats, setUsageStats] = useState({ users: 0, products: 0 })

  useEffect(() => {
    if (businessId) loadData()
  }, [businessId])

  const loadData = async () => {
    setLoading(true)
    const [{ data: sub }, { data: users }, { data: prods }] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('business_id', businessId).eq('status', 'active').limit(1).single(),
      supabase.from('business_users').select('id').eq('business_id', businessId).eq('is_active', true),
      supabase.from('products').select('id').eq('business_id', businessId),
    ])
    setSubscription(sub)
    setUsageStats({ users: users?.length || 0, products: prods?.length || 0 })
    setLoading(false)
  }

  const currentPlan = PLANS.find(p => p.id === business?.plan_id) || PLANS[0]

  const daysLeft = business?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(business.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : null

  const isTrialing = business?.status === 'trial'

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CreditCard size={24} className="text-emerald-600" />
          Subscription
        </h1>
        {business && <p className="text-slate-500 text-sm mt-1">{business.name}</p>}
      </div>

      {/* Trial banner */}
      {isTrialing && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-5 rounded-2xl mb-6 flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">Free Trial</div>
            <div className="text-blue-100 text-sm mt-0.5">
              {daysLeft > 0 ? `${daysLeft} days remaining` : 'Trial expired'} — Upgrade to continue after trial
            </div>
          </div>
          {daysLeft <= 3 && <AlertCircle size={24} className="text-yellow-300" />}
        </div>
      )}

      {/* Current plan */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <h2 className="font-bold text-slate-800 mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-slate-800">{currentPlan.name}</div>
            <div className="text-slate-500 text-sm mt-1">
              PKR {currentPlan.monthly.toLocaleString()}/month
            </div>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1.5 rounded-full text-sm font-bold capitalize ${
              business?.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
              business?.status === 'trial' ? 'bg-blue-100 text-blue-700' :
              'bg-red-100 text-red-700'
            }`}>
              {business?.status}
            </span>
          </div>
        </div>

        {/* Usage */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Users', used: usageStats.users, max: currentPlan.users },
            { label: 'Products', used: usageStats.products, max: typeof currentPlan.products === 'number' ? currentPlan.products : null },
          ].map(({ label, used, max }) => {
            const pct = max ? Math.min((used / max) * 100, 100) : 50
            return (
              <div key={label} className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span>{label}</span>
                  <span>{used} {max ? `/ ${max}` : '/ Unlimited'}</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full">
                  <div className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upgrade plans */}
      <h2 className="font-bold text-slate-800 mb-4">Available Plans</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const isCurrent = plan.id === business?.plan_id
          return (
            <div key={plan.id} className={`bg-white rounded-2xl border p-5 ${isCurrent ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200'}`}>
              {plan.popular && !isCurrent && (
                <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block mb-2">⭐ Popular</div>
              )}
              {isCurrent && (
                <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-2">✓ Current Plan</div>
              )}
              <h3 className="font-bold text-slate-800 mb-1">{plan.name}</h3>
              <div className="text-2xl font-extrabold text-slate-900 mb-3">
                PKR {plan.monthly.toLocaleString()}<span className="text-sm font-normal text-slate-400">/mo</span>
              </div>
              <div className="space-y-1.5 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> {plan.users} Users</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> {plan.branches} Branch{plan.branches > 1 ? 'es' : ''}</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> {plan.products} Products</div>
              </div>
              {!isCurrent && (
                <button className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-1">
                  Upgrade <ArrowRight size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 text-center mt-6">
        To upgrade, contact <a href="mailto:sales@sabrware.com" className="underline">sales@sabrware.com</a> or your SabrWare representative.
      </p>
    </div>
  )
}
