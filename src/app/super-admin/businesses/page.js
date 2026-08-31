'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, Search, CheckCircle2, Ban, Clock, AlertCircle, RefreshCw } from 'lucide-react'

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [{ data: biz }, { data: pl }] = await Promise.all([
      supabase.from('businesses').select('*, subscription_plans(name, monthly_price)').order('created_at', { ascending: false }),
      supabase.from('subscription_plans').select('*').order('sort_order'),
    ])
    setBusinesses(biz || [])
    setPlans(pl || [])
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    await supabase.from('businesses').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    loadData()
  }

  const updatePlan = async (id, plan_id) => {
    await supabase.from('businesses').update({ plan_id, updated_at: new Date().toISOString() }).eq('id', id)
    loadData()
  }

  const filtered = businesses.filter(b => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.business_code?.toLowerCase().includes(search.toLowerCase()) || b.email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || b.status === statusFilter
    return matchSearch && matchStatus
  })

  const statusBadge = (status) => {
    const map = {
      active: 'bg-emerald-100 text-emerald-700',
      trial: 'bg-blue-100 text-blue-700',
      suspended: 'bg-red-100 text-red-700',
      expired: 'bg-slate-200 text-slate-600',
    }
    return map[status] || 'bg-slate-100 text-slate-600'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Businesses</h1>
          <p className="text-slate-400 text-sm mt-1">{businesses.length} total businesses on the platform</p>
        </div>
        <Link
          href="/super-admin/businesses/new"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
        >
          <Plus size={18} /> New Business
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, code, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl outline-none focus:border-violet-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
          <option value="expired">Expired</option>
        </select>
        <button onClick={loadData} className="px-4 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400 mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No businesses found.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  {['Business', 'Code', 'Plan', 'Status', 'Trial Ends', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(biz => (
                  <tr key={biz.id} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white text-sm">{biz.name}</div>
                      <div className="text-slate-400 text-xs">{biz.email} {biz.phone ? `· ${biz.phone}` : ''}</div>
                    </td>
                    <td className="px-5 py-4 text-sm font-mono text-slate-300">{biz.business_code}</td>
                    <td className="px-5 py-4">
                      <select
                        value={biz.plan_id}
                        onChange={e => updatePlan(biz.id, e.target.value)}
                        className="text-xs bg-slate-700 text-slate-200 border border-slate-600 rounded-lg px-2 py-1 outline-none focus:border-violet-500"
                      >
                        {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusBadge(biz.status)}`}>
                        {biz.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {biz.trial_ends_at ? new Date(biz.trial_ends_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {biz.status !== 'active' && (
                          <button onClick={() => updateStatus(biz.id, 'active')}
                            className="px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded text-xs font-semibold hover:bg-emerald-600/40 transition-colors">
                            Activate
                          </button>
                        )}
                        {biz.status !== 'suspended' && (
                          <button onClick={() => updateStatus(biz.id, 'suspended')}
                            className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs font-semibold hover:bg-red-600/40 transition-colors">
                            Suspend
                          </button>
                        )}
                        {biz.status !== 'trial' && (
                          <button onClick={() => updateStatus(biz.id, 'trial')}
                            className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-semibold hover:bg-blue-600/40 transition-colors">
                            Set Trial
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
