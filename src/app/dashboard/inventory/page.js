'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useFastQuery, invalidateCache } from '@/lib/cache'

export default function InventoryPage() {
  const { t, formatCurrency } = useLanguage()
  const { businessId } = useAuth()
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({ price: '', stock_quantity: '' })

  const { data: productsData, loading, error, refetch, setData: setProductsData } = useFastQuery(
    businessId ? `products_${businessId}` : null,
    async () => {
      let q = supabase
        .from('products')
        .select('id, name, category, unit, price, stock_quantity, business_id')
        .order('name')
      if (businessId) q = q.eq('business_id', businessId)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
    { enabled: !!businessId, maxAge: 60000 }
  )

  const products = productsData || []

  const startEdit = (product) => {
    setEditingId(product.id)
    setEditData({
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString()
    })
  }

  const saveEdit = async (id) => {
    try {
      const newPrice = parseFloat(editData.price)
      const newStock = parseFloat(editData.stock_quantity)

      const { error } = await supabase
        .from('products')
        .update({
          price: newPrice,
          stock_quantity: newStock
        })
        .eq('id', id)
      
      if (error) throw error

      invalidateCache(`products_${businessId}`)
      invalidateCache(`dashboard_data_${businessId}`)
      setProductsData(prev =>
        (prev || []).map(p => p.id === id ? { ...p, price: newPrice, stock_quantity: newStock } : p)
      )
      setEditingId(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditData({ price: '', stock_quantity: '' })
  }

  const getFilteredProducts = () => {
    switch (filter) {
      case 'low':
        return products.filter((p) => p.stock_quantity < 10)
      case 'out':
        return products.filter((p) => p.stock_quantity <= 0)
      default:
        return products
    }
  }

  if (loading && !productsData) {
    return (
      <div className="space-y-4 animate-pulse" suppressHydrationWarning>
        <div className="h-10 w-48 bg-slate-200 rounded-lg" />
        <div className="flex gap-4 mb-6">
          <div className="h-10 w-24 bg-slate-200 rounded" />
          <div className="h-10 w-28 bg-slate-200 rounded" />
          <div className="h-10 w-28 bg-slate-200 rounded" />
        </div>
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    )
  }

  if (error && !productsData) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg" suppressHydrationWarning>
        Error: {error}
        <button onClick={() => refetch()} className="ml-4 underline">Retry</button>
      </div>
    )
  }

  return (
    <div suppressHydrationWarning>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{t('inventory')}</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-white border'}`}
        >
          All ({products.length})
        </button>
        <button
          onClick={() => setFilter('low')}
          className={`px-4 py-2 rounded ${filter === 'low' ? 'bg-orange-500 text-white' : 'bg-white border'}`}
        >
          Low Stock ({products.filter((p) => p.stock_quantity < 10).length})
        </button>
        <button
          onClick={() => setFilter('out')}
          className={`px-4 py-2 rounded ${filter === 'out' ? 'bg-red-500 text-white' : 'bg-white border'}`}
        >
          Out of Stock ({products.filter((p) => p.stock_quantity <= 0).length})
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">{t('name')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">{t('category')}</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">{t('price')}</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">{t('stock')}</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-500">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredProducts().map((product) => (
              <tr key={product.id} className="border-t">
                <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                <td className="px-4 py-3 text-sm capitalize">{product.category}</td>
                <td className="px-4 py-3 text-sm text-right">
                  {editingId === product.id ? (
                    <input
                      type="number"
                      value={editData.price}
                      onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                      className="w-24 px-2 py-1 border rounded"
                    />
                  ) : (
                    formatCurrency(product.price)
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {editingId === product.id ? (
                    <input
                      type="number"
                      value={editData.stock_quantity}
                      onChange={(e) => setEditData({ ...editData, stock_quantity: e.target.value })}
                      className="w-24 px-2 py-1 border rounded"
                    />
                  ) : (
                    <span className={product.stock_quantity < 10 ? 'text-red-600 font-bold' : ''}>
                      {product.stock_quantity}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {editingId === product.id ? (
                    <>
                      <button onClick={() => saveEdit(product.id)} className="text-green-600 mr-2">Save</button>
                      <button onClick={cancelEdit} className="text-gray-600">Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(product)} className="text-blue-600 hover:text-blue-800">Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}