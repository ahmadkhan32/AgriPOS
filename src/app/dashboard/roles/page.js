'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions'
import { Plus, Edit2, Trash2, Shield, X, Save, Check, ChevronDown } from 'lucide-react'

// Module groupings for display
const PERMISSION_MODULES = {
  Sales: ['sales.view','sales.create','sales.edit','sales.delete','sales.discount'],
  Products: ['products.view','products.create','products.edit','products.delete','products.cost'],
  Inventory: ['inventory.view','inventory.adjust'],
  Purchases: ['purchases.view','purchases.create','purchases.edit'],
  Customers: ['customers.view','customers.create','customers.edit','customers.delete'],
  Suppliers: ['suppliers.view','suppliers.create','suppliers.edit'],
  Reports: ['reports.view','reports.financial','reports.export'],
  Users: ['users.view','users.create','users.edit','users.delete'],
  Settings: ['settings.view','settings.edit'],
}

const PERMISSION_LABELS = {
  'sales.view':'View','sales.create':'Create','sales.edit':'Edit','sales.delete':'Delete','sales.discount':'Discount',
  'products.view':'View','products.create':'Create','products.edit':'Edit','products.delete':'Delete','products.cost':'View Cost',
  'inventory.view':'View','inventory.adjust':'Adjust Stock',
  'purchases.view':'View','purchases.create':'Create','purchases.edit':'Edit',
  'customers.view':'View','customers.create':'Create','customers.edit':'Edit','customers.delete':'Delete',
  'suppliers.view':'View','suppliers.create':'Create','suppliers.edit':'Edit',
  'reports.view':'View','reports.financial':'Financial','reports.export':'Export',
  'users.view':'View','users.create':'Create','users.edit':'Edit','users.delete':'Delete',
  'settings.view':'View','settings.edit':'Edit',
}

export default function RolesPage() {
  const { businessId, isAdmin } = useAuth()
  const [roles, setRoles] = useState([])
  const [selectedRole, setSelectedRole] = useState(null)
  const [rolePerms, setRolePerms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewRole, setShowNewRole] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (businessId && isAdmin) loadRoles()
  }, [businessId, isAdmin])

  useEffect(() => {
    if (selectedRole) loadRolePerms(selectedRole.id)
  }, [selectedRole])

  const loadRoles = async () => {
    setLoading(true)
    const { data } = await supabase.from('roles').select('*').eq('business_id', businessId).order('name')
    setRoles(data || [])
    if (data?.length && !selectedRole) setSelectedRole(data[0])
    setLoading(false)
  }

  const loadRolePerms = async (roleId) => {
    const { data } = await supabase.from('role_permissions').select('permission_id').eq('role_id', roleId)
    setRolePerms(data?.map(rp => rp.permission_id) || [])
  }

  const togglePerm = (permId) => {
    setRolePerms(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    )
  }

  const savePerms = async () => {
    setSaving(true)
    await supabase.from('role_permissions').delete().eq('role_id', selectedRole.id)
    if (rolePerms.length) {
      await supabase.from('role_permissions').insert(rolePerms.map(p => ({ role_id: selectedRole.id, permission_id: p })))
    }
    setSaving(false)
    alert('Permissions saved!')
  }

  const applyPreset = (preset) => {
    const perms = DEFAULT_ROLE_PERMISSIONS[preset] || []
    setRolePerms(perms)
  }

  const createRole = async (e) => {
    e.preventDefault()
    if (!newRoleName.trim()) return
    const { data, error } = await supabase.from('roles').insert([{ business_id: businessId, name: newRoleName.trim() }]).select().single()
    if (!error) {
      setShowNewRole(false)
      setNewRoleName('')
      await loadRoles()
      setSelectedRole(data)
    }
  }

  const deleteRole = async (id) => {
    if (!confirm('Delete this role?')) return
    await supabase.from('roles').delete().eq('id', id)
    setSelectedRole(null)
    loadRoles()
  }

  if (!isAdmin) return (
    <div className="p-8 text-center">
      <Shield size={48} className="mx-auto mb-4 text-slate-300" />
      <p className="text-slate-500">Only admins can manage roles.</p>
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Shield size={24} className="text-indigo-600" />
          Roles & Permissions
        </h1>
        <button onClick={() => setShowNewRole(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 font-semibold transition-all">
          <Plus size={18} /> New Role
        </button>
      </div>

      {showNewRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Create Role</h2>
            <form onSubmit={createRole} className="space-y-4">
              <input
                type="text"
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                placeholder="Role name (e.g. Cashier)"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                required
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewRole(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Roles list */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <h2 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Roles</h2>
          {loading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto" /> : (
            <div className="space-y-1">
              {roles.map(role => (
                <div key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${selectedRole?.id === role.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  <span className="text-sm">{role.name}</span>
                  {!role.is_system && (
                    <button onClick={(e) => { e.stopPropagation(); deleteRole(role.id) }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permissions editor */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {!selectedRole ? (
            <div className="p-8 text-center text-slate-500">Select a role to edit permissions</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800">{selectedRole.name} — Permissions</h2>
                <div className="flex gap-2">
                  {['cashier','manager','storekeeper'].map(preset => (
                    <button key={preset} onClick={() => applyPreset(preset)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 capitalize">
                      {preset}
                    </button>
                  ))}
                  <button onClick={savePerms} disabled={saving}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1">
                    <Save size={13} /> {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(PERMISSION_MODULES).map(([module, perms]) => (
                  <div key={module}>
                    <h3 className="text-sm font-bold text-slate-600 mb-2">{module}</h3>
                    <div className="flex flex-wrap gap-2">
                      {perms.map(perm => (
                        <button
                          key={perm}
                          onClick={() => togglePerm(perm)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            rolePerms.includes(perm)
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-500 border border-transparent hover:bg-slate-200'
                          }`}
                        >
                          {rolePerms.includes(perm) && <Check size={11} />}
                          {PERMISSION_LABELS[perm] || perm}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
