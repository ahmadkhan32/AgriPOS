'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

export default function InventoryPage() {
  const { t, formatCurrency } = useLanguage()
  const { businessId } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({ price: '', stock_quantity: '' })

  useEffect(() => {
    let mounted = true

    const loadProducts = async () => {
      setLoading(true)
      setError(null)
      try {
        let q = supabase.from('products').select('*').order('name')
        if (businessId) q = q.eq('business_id', businessId)
        const { data, error } = await q
        
        if (error) throw error
        if (mounted) setProducts(data || [])
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProducts()
    return () => { mounted = false }
  }, [businessId])

  const loadProductsAgain = async () => {
    try {
      let q = supabase.from('products').select('*').order('name')
      if (businessId) q = q.eq('business_id', businessId)
      const { data } = await q
      setProducts(data || [])
    } catch (err) { console.error(err) }
  }

  const startEdit = (product) => {
    setEditingId(product.id)
    setEditData({
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString()
    })
  }

  const saveEdit = async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          price: parseFloat(editData.price),
          stock_quantity: parseFloat(editData.stock_quantity)
        })
        .eq('id', id)
      
      if (error) throw error
      setEditingId(null)
      loadProductsAgain()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Error: {error}
        <button onClick={() => loadProductsAgain()} className="ml-4 underline">Retry</button>
      </div>
    )
  }

  return (
    <div>
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