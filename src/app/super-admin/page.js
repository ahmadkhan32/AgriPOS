'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Building2, Users, TrendingUp, AlertCircle, Plus, CheckCircle2, Clock, Ban } from 'lucide-react'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, trial: 0, suspended: 0, expired: 0 })
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('businesses')
        .select('*, subscription_plans(name, monthly_price)')
        .order('created_at', { ascending: false })

      const all = data || []
      setBusinesses(all.slice(0, 10))
      setStats({
        total: all.length,
        active: all.filter(b => b.status === 'active').length,
        trial: all.filter(b => b.status === 'trial').length,
        suspended: all.filter(b => b.status === 'suspended').length,
        expired: all.filter(b => b.status === 'expired').length,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statusBadge = (status) => {
    const map = {
      active: 'bg-emerald-100 text-emerald-700',
      trial: 'bg-blue-100 text-blue-700',
      suspended: 'bg-red-100 text-red-700',
      expired: 'bg-slate-100 text-slate-600',
    }
    return map[status] || 'bg-slate-100 text-slate-600'
  }

  const updateStatus = async (id, status) => {
    await supabase.from('businesses').update({ status }).eq('id', id)
    loadData()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Platform Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage all businesses on the AgriPOS platform</p>
        </div>
        <Link
          href="/super-admin/businesses/new"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-900"
        >
          <Plus size={18} />
          New Business
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Businesses', val: stats.total, icon: Building2, color: 'from-slate-600 to-slate-700' },
          { label: 'Active', val: stats.active, icon: CheckCircle2, color: 'from-emerald-600 to-emerald-700' },
          { label: 'Trial', val: stats.trial, icon: Clock, color: 'from-blue-600 to-blue-700' },
          { label: 'Suspended', val: stats.suspended, icon: Ban, color: 'from-red-600 to-red-700' },
          { label: 'Expired', val: stats.expired, icon: AlertCircle, color: 'from-orange-600 to-orange-700' },
        ].map(({ label, val, icon: Icon, color }) => (
          <div key={label} className={`bg-gradient-to-br ${color} p-5 rounded-2xl text-white shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={18} className="opacity-80" />
              <span className="text-xs font-semibold opacity-80 uppercase tracking-wide">{label}</span>
            </div>
            <div className="text-3xl font-extrabold">{loading ? '—' : val}</div>
          </div>
        ))}
      </div>

      {/* Businesses table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent Businesses</h2>
          <Link href="/super-admin/businesses" className="text-violet-400 hover:text-violet-300 text-sm font-semibold transition-colors">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400 mx-auto" />
            </div>
          ) : businesses.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No businesses yet.{' '}
              <Link href="/super-admin/businesses/new" className="text-violet-400 hover:underline">Create one →</Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  {['Business', 'Code', 'Plan', 'Status', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {businesses.map(biz => (
                  <tr key={biz.id} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white text-sm">{biz.name}</div>
                      <div className="text-slate-400 text-xs">{biz.email}</div>
                    </td>
                    <td className="px-5 py-4 text-sm font-mono text-slate-300">{biz.business_code}</td>
                    <td className="px-5 py-4 text-sm text-slate-300">{biz.subscription_plans?.name || biz.plan_id}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusBadge(biz.status)}`}>
                        {biz.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {new Date(biz.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {biz.status !== 'active' && (
                          <button
                            onClick={() => updateStatus(biz.id, 'active')}
                            className="px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded text-xs font-semibold hover:bg-emerald-600/40 transition-colors"
                          >
                            Activate
                          </button>
                        )}
                        {biz.status !== 'suspended' && (
                          <button
                            onClick={() => updateStatus(biz.id, 'suspended')}
                            className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs font-semibold hover:bg-red-600/40 transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
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
