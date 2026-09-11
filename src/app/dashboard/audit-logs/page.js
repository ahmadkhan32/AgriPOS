'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/context/LanguageContext'

export default function AuditLogsPage() {
  const { t } = useLanguage()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadLogs()
  }, [filter])

  const loadLogs = async () => {
    setLoading(true)
    let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
    if (filter !== 'all') {
      query = query.eq('table_name', filter)
    }
    const { data } = await query
    setLogs(data || [])
    setLoading(false)
  }

  const formatDate = (date) => {
    const d = new Date(date)
    return d.toLocaleString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800'
      case 'UPDATE': return 'bg-blue-100 text-blue-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTableLabel = (table) => {
    const labels = {
      products: 'Product',
      customers: 'Customer',
      invoices: 'Invoice',
      shop_settings: 'Settings'
    }
    return labels[table] || table
  }

  return (
    <div suppressHydrationWarning>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Activity Log</h1>
        <button onClick={loadLogs} className="px-4 py-2 border rounded hover:bg-slate-50">
          Refresh
        </button>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {['all', 'products', 'customers', 'invoices'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg ${filter === f ? 'bg-emerald-600 text-white' : 'bg-white border hover:bg-slate-50'}`}
          >
            {f === 'all' ? 'All' : getTableLabel(f) + 's'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No activity logged yet</div>
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="font-medium">{getTableLabel(log.table_name)}</span>
                    {log.field_name && (
                      <span className="text-slate-500">- {log.field_name}</span>
                    )}
                  </div>
                  <span className="text-sm text-slate-400">{formatDate(log.created_at)}</span>
                </div>
                
                {log.old_value !== null && log.new_value !== null && (
                  <div className="mt-2 text-sm">
                    <span className="text-red-600 line-through">{log.old_value}</span>
                    <span className="mx-2">→</span>
                    <span className="text-green-600">{log.new_value}</span>
                  </div>
                )}
                
                {log.change_reason && (
                  <div className="mt-1 text-sm text-slate-500">
                    Reason: {log.change_reason}
                  </div>
                )}
                
                <div className="mt-1 text-xs text-slate-400">
                  Record ID: {log.record_id?.slice(0, 8)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}