'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react'

export default function NewPurchasePage() {
  const { businessId, user } = useAuth()
  const { formatCurrency } = useLanguage()
  const router = useRouter()
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ supplier_id: '', reference_no: '', paid_amount: '0', notes: '' })
  const [items, setItems] = useState([{ product_id: '', product_name: '', quantity: '', cost_price: '', unit: '' }])

  useEffect(() => {
    if (businessId) loadData()
  }, [businessId])

  const loadData = async () => {
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('suppliers').select('id, name').eq('business_id', businessId).eq('is_active', true),
      supabase.from('products').select('id, name, unit').eq('business_id', businessId).order('name'),
    ])
    setSuppliers(s || [])
    setProducts(p || [])
  }

  const addItem = () => setItems(prev => [...prev, { product_id: '', product_name: '', quantity: '', cost_price: '', unit: '' }])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i, key, val) => setItems(prev => prev.map((item, idx) => {
    if (idx !== i) return item
    if (key === 'product_id') {
      const prod = products.find(p => p.id === val)
      return { ...item, product_id: val, product_name: prod?.name || '', unit: prod?.unit || '' }
    }
    return { ...item, [key]: val }
  }))

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.cost_price || 0)), 0)
  const dueAmount = totalAmount - parseFloat(form.paid_amount || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.some(i => !i.product_id || !i.quantity || !i.cost_price)) {
      alert('Please fill all item fields')
      return
    }
    setLoading(true)
    try {
      const supplier = suppliers.find(s => s.id === form.supplier_id)

      const { data: purchase, error } = await supabase.from('purchases').insert([{
        business_id: businessId,
        supplier_id: form.supplier_id || null,
        supplier_name: supplier?.name || 'Walk-in',
        reference_no: form.reference_no || `PO-${Date.now()}`,
        total_amount: totalAmount,
        paid_amount: parseFloat(form.paid_amount || 0),
        due_amount: Math.max(0, dueAmount),
        status: dueAmount <= 0 ? 'received' : 'partial',
        notes: form.notes,
        created_by: user?.id,
      }]).select().single()

      if (error) throw error

      // Insert items
      await supabase.from('purchase_items').insert(
        items.map(item => ({
          purchase_id: purchase.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_unit: item.unit,
          quantity: parseFloat(item.quantity),
          cost_price: parseFloat(item.cost_price),
          item_total: parseFloat(item.quantity) * parseFloat(item.cost_price),
        }))
      )

      // Update product stock (add to stock on purchase)
      for (const item of items) {
        await supabase.from('products')
          .update({ stock_quantity: supabase.rpc('stock_quantity', {}) })
          .eq('id', item.product_id)
        // Simple increment
        const { data: prod } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single()
        await supabase.from('products').update({
          stock_quantity: (prod?.stock_quantity || 0) + parseFloat(item.quantity),
          updated_at: new Date().toISOString()
        }).eq('id', item.product_id)
      }

      // Update supplier totals
      if (form.supplier_id) {
        const { data: sup } = await supabase.from('suppliers').select('total_purchases, total_paid, total_due').eq('id', form.supplier_id).single()
        await supabase.from('suppliers').update({
          total_purchases: (sup?.total_purchases || 0) + totalAmount,
          total_paid: (sup?.total_paid || 0) + parseFloat(form.paid_amount || 0),
          total_due: (sup?.total_due || 0) + Math.max(0, dueAmount),
          updated_at: new Date().toISOString()
        }).eq('id', form.supplier_id)
      }

      router.push('/dashboard/purchases')
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/purchases" className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">New Purchase Order</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h2 className="font-bold text-slate-700">Purchase Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Supplier</label>
              <select value={form.supplier_id} onChange={e => setForm(p => ({ ...p, supplier_id: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500">
                <option value="">Walk-in Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Reference No.</label>
              <input value={form.reference_no} onChange={e => setForm(p => ({ ...p, reference_no: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500"
                placeholder="INV-001 (optional)" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-orange-500 resize-none" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-700">Items</h2>
            <button type="button" onClick={addItem}
              className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-xl text-sm font-semibold hover:bg-orange-200 flex items-center gap-1">
              <Plus size={16} /> Add Item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none text-sm focus:border-orange-500">
                    <option value="">Select Product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none text-sm focus:border-orange-500" />
                </div>
                <div className="col-span-3">
                  <input type="number" placeholder="Cost (PKR)" value={item.cost_price} onChange={e => updateItem(i, 'cost_price', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none text-sm focus:border-orange-500" />
                </div>
                <div className="col-span-1 text-sm text-right font-semibold text-slate-600">
                  {item.quantity && item.cost_price ? formatCurrency(parseFloat(item.quantity) * parseFloat(item.cost_price)) : '—'}
                </div>
                <div className="col-span-1 flex justify-end">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-sm">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span><span>{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Amount Paid (PKR)</span>
              <input type="number" value={form.paid_amount} onChange={e => setForm(p => ({ ...p, paid_amount: e.target.value }))}
                className="w-36 px-3 py-2 border border-slate-200 rounded-xl text-right outline-none focus:border-orange-500 font-semibold" />
            </div>
            <div className="flex justify-between">
              <span className={dueAmount > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>Due</span>
              <span className={dueAmount > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>{formatCurrency(Math.max(0, dueAmount))}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/dashboard/purchases" className="flex-1 py-3 border border-slate-200 rounded-xl text-center text-slate-600 font-semibold hover:bg-slate-50">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-700 transition-all disabled:opacity-50">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Save size={18} /> Save Purchase</>}
          </button>
        </div>
      </form>
    </div>
  )
}
