'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } from '@/lib/permissions'
import { Plus, Edit2, Trash2, UserCog, X, Save, Shield, Check } from 'lucide-react'

export default function UsersPage() {
  const { businessId, business, isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState({ full_name: '', role_id: '', is_admin: false, is_active: true })

  useEffect(() => {
    if (businessId && isAdmin) loadData()
  }, [businessId, isAdmin])

  const loadData = async () => {
    setLoading(true)
    const [{ data: u }, { data: r }] = await Promise.all([
      supabase.from('business_users').select('*, role:roles(name)').eq('business_id', businessId),
      supabase.from('roles').select('*').eq('business_id', businessId),
    ])
    setUsers(u || [])
    setRoles(r || [])
    setLoading(false)
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center" suppressHydrationWarning>
        <Shield size={48} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-lg font-bold text-slate-700 mb-2">Access Restricted</h2>
        <p className="text-slate-500">Only business admins can manage users.</p>
      </div>
    )
  }

  const updateUser = async (id, updates) => {
    await supabase.from('business_users').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
    loadData()
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this user from the business?')) return
    await supabase.from('business_users').delete().eq('id', id)
    loadData()
  }

  const toggleActive = (u) => updateUser(u.id, { is_active: !u.is_active })

  return (
    <div suppressHydrationWarning>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserCog size={24} className="text-violet-600" />
            Users
          </h1>
          {business && <p className="text-slate-500 text-sm mt-1">{business.name}</p>}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
        <strong>To add a new user:</strong> They must first register via the login page using their email. Then you'll see their account here once linked to this business.
        <br />The business code <strong className="font-mono">{business?.business_code}</strong> must be provided to them.
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto" /></div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No users yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {['Name', 'Email', 'Role', 'Admin', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-sm font-medium text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold">{u.full_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{u.user_id?.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={u.role_id || ''}
                      onChange={e => updateUser(u.id, { role_id: e.target.value || null })}
                      className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 outline-none"
                    >
                      <option value="">No Role</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => updateUser(u.id, { is_admin: !u.is_admin })}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${u.is_admin ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-400'}`}
                    >
                      <Check size={14} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => toggleActive(u)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
