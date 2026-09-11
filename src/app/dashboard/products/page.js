'use client'

import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/context/LanguageContext'
import { Plus, Search, Edit2, Trash2, Package, X, Save } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useFastQuery, invalidateCache } from '@/lib/cache'

export default function ProductsPage() {
  const { t, formatCurrency, getUnit } = useLanguage()
  const { businessId } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    category: 'pesticide',
    unit: 'KG',
    price: '',
    stock_quantity: '',
  })

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseFloat(formData.stock_quantity),
        business_id: businessId,
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert([payload])
        if (error) throw error
      }

      invalidateCache(`products_${businessId}`)
      invalidateCache(`dashboard_data_${businessId}`)
      setShowModal(false)
      resetForm()
      refetch()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      unit: product.unit,
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      invalidateCache(`products_${businessId}`)
      invalidateCache(`dashboard_data_${businessId}`)
      setProductsData(prev => (prev || []).filter(p => p.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      category: 'pesticide',
      unit: 'KG',
      price: '',
      stock_quantity: '',
    })
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    )
  }, [products, searchTerm])

  const getCategoryColor = (cat) => {
    switch(cat) {
      case 'pesticide': return 'bg-rose-50 text-rose-600'
      case 'fertilizer': return 'bg-amber-50 text-amber-600'
      case 'seed': return 'bg-emerald-50 text-emerald-600'
      default: return 'bg-slate-50 text-slate-600'
    }
  }

  if (loading && !productsData) {
    return (
      <div className="space-y-4 animate-pulse" suppressHydrationWarning>
        <div className="h-10 w-48 bg-slate-200 rounded-lg" />
        <div className="h-10 w-80 bg-slate-200 rounded-lg" />
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{t('products')}</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
        >
          <Plus size={18} />
          {t('addProduct')}
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder={t('searchProducts')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Package size={40} className="mx-auto mb-2 text-slate-300" />
            <p>{t('noProductsFound')}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">{t('name')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">{t('category')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">{t('unit')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">{t('price')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">{t('stock')}</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-500">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(product.category)}`}>
                      {t(product.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{getUnit(product.unit)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={product.stock_quantity < 10 ? 'text-red-600 font-bold' : ''}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={16} />
                    </button>
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingProduct ? t('editProduct') : t('addProduct')}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('category')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="pesticide">{t('pesticide')}</option>
                    <option value="fertilizer">{t('fertilizer')}</option>
                    <option value="seed">{t('seed')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('unit')}</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="KG">{t('kg')}</option>
                    <option value="Liter">{t('liter')}</option>
                    <option value="ML">{t('ml')}</option>
                    <option value="Piece">{t('piece')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('price')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('stock')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                  {t('cancel')}
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2">
                  <Save size={18} />
                  {editingProduct ? t('save') : t('add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}