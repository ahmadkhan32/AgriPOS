'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useFastQuery, invalidateCache } from '@/lib/cache'
import { Plus, Edit2, Trash2, Truck, X, Save } from 'lucide-react'

export default function SuppliersPage() {
  const { businessId } = useAuth()
  const { formatCurrency } = useLanguage()
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })

  const { data: suppliersData, loading, error, refetch, setData: setSuppliersData } = useFastQuery(
    businessId ? `suppliers_${businessId}` : null,
    async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, phone, email, address, total_purchases, total_due, business_id')
        .eq('business_id', businessId)
        .order('name')
      if (error) throw error
      return data || []
    },
    { enabled: !!businessId, maxAge: 60000 }
  )

  const suppliers = suppliersData || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSupplier) {
        const { error } = await supabase.from('suppliers').update(form).eq('id', editingSupplier.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('suppliers').insert([{ ...form, business_id: businessId }])
        if (error) throw error
      }
      invalidateCache(`suppliers_${businessId}`)
      setShowModal(false)
      resetForm()
      refetch()
    } catch (err) { alert(err.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return
    await supabase.from('suppliers').delete().eq('id', id)
    invalidateCache(`suppliers_${businessId}`)
    setSuppliersData(prev => (prev || []).filter(s => s.id !== id))
  }

  const resetForm = () => {
    setEditingSupplier(null)
    setForm({ name: '', phone: '', email: '', address: '' })
  }

  const handleEdit = (s) => {
    setEditingSupplier(s)
    setForm({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '' })
    setShowModal(true)
  }

  return (
    <div suppressHydrationWarning>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Truck size={24} className="text-teal-600" />
          Suppliers
        </h1>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 flex items-center gap-2 font-semibold transition-all"
        >
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading && !suppliersData ? (
          <div className="p-8 text-center animate-pulse">
            <div className="h-8 w-48 bg-slate-200 rounded mx-auto mb-4" />
            <div className="h-32 bg-slate-200 rounded-xl" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Truck size={40} className="mx-auto mb-3 text-slate-300" />
            <p>No suppliers yet. Add your first supplier.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {['Name', 'Phone', 'Email', 'Total Purchases', 'Due', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-sm font-medium text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id} className="border-t hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{s.email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(s.total_purchases)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={s.total_due > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                      {formatCurrency(s.total_due)}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    <button onClick={() => handleEdit(s)} className="text-blue-600 hover:text-blue-800 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-slate-800">{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Name *', key: 'name', required: true, placeholder: 'Supplier name' },
                { label: 'Phone', key: 'phone', placeholder: '03XX-XXXXXXX' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'supplier@email.com' },
                { label: 'Address', key: 'address', placeholder: 'City, Country' },
              ].map(({ label, key, required, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
                  <input
                    type={type || 'text'}
                    value={form[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    placeholder={placeholder}
                    required={required}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-teal-700 font-semibold transition-all">
                  <Save size={16} />
                  {editingSupplier ? 'Save' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
