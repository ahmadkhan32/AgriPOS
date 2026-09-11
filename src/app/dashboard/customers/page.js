'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useFastQuery, invalidateCache } from '@/lib/cache'

export default function CustomersPage() {
  const { t, formatCurrency } = useLanguage()
  const { businessId } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' })

  const { data: customersData, loading, error, refetch, setData: setCustomersData } = useFastQuery(
    businessId ? `customers_${businessId}` : null,
    async () => {
      let q = supabase
        .from('customers')
        .select('id, name, phone, address, total_purchase, total_paid, total_due, business_id')
        .order('name')
      if (businessId) q = q.eq('business_id', businessId)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
    { enabled: !!businessId, maxAge: 60000 }
  )

  const customers = customersData || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCustomer) {
        const { error } = await supabase.from('customers').update(formData).eq('id', editingCustomer.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('customers').insert([{ ...formData, business_id: businessId }])
        if (error) throw error
      }
      invalidateCache(`customers_${businessId}`)
      invalidateCache(`dashboard_data_${businessId}`)
      setShowModal(false)
      resetForm()
      refetch()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setFormData({ name: customer.name, phone: customer.phone, address: customer.address || '' })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
      invalidateCache(`customers_${businessId}`)
      invalidateCache(`dashboard_data_${businessId}`)
      setCustomersData(prev => (prev || []).filter(c => c.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  const resetForm = () => {
    setEditingCustomer(null)
    setFormData({ name: '', phone: '', address: '' })
  }

  if (loading && !customersData) {
    return (
      <div className="space-y-4 animate-pulse" suppressHydrationWarning>
        <div className="h-10 w-48 bg-slate-200 rounded-lg" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    )
  }

  if (error && !customersData) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg" suppressHydrationWarning>
        Error: {error}
        <button onClick={() => refetch()} className="ml-4 underline">Retry</button>
      </div>
    )
  }

  return (
    <div suppressHydrationWarning>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{t('customers')}</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          {t('addCustomer')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No customers found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">{t('name')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">{t('phone')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">{t('totalPurchase')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">{t('totalPaid')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">{t('due')}</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-500">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium">{customer.name}</td>
                  <td className="px-4 py-3 text-sm">{customer.phone}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(customer.total_purchase)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(customer.total_paid)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={customer.total_due > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                      {formatCurrency(customer.total_due)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                    <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingCustomer ? t('editCustomer') : t('addCustomer')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('phone')}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('address')}</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="2"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                  {t('cancel')}
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg">
                  {editingCustomer ? t('save') : t('add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}