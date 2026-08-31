'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

export default function NewInvoicePage() {
  const { t, formatCurrency } = useLanguage()
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [items, setItems] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showProducts, setShowProducts] = useState(false)
  const [showCustomers, setShowCustomers] = useState(false)
  const [loading, setLoading] = useState(false)
  const [discountType, setDiscountType] = useState('fixed')
  const [discountValue, setDiscountValue] = useState('')
  
  const productRef = useRef(null)
  const customerRef = useRef(null)

  useEffect(() => {
    loadProducts()
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClickOutside = (e) => {
    if (productRef.current && !productRef.current.contains(e.target)) setShowProducts(false)
    if (customerRef.current && !customerRef.current.contains(e.target)) setShowCustomers(false)
  }

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name')
    setProducts(data || [])
  }

  const selectCustomer = (customer) => {
    setCustomerPhone(customer.phone)
    setCustomerName(customer.name)
    setCustomerAddress(customer.address || '')
    setCustomers([])
    setShowCustomers(false)
    setCustomerSearch('')
  }

  const addProduct = (product) => {
    const existing = items.find(item => item.product_id === product.id)
    if (existing) {
      setItems(items.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, item_total: (item.quantity + 1) * item.price }
          : item
      ))
    } else {
      setItems([...items, {
        product_id: product.id,
        product_name: product.name,
        product_unit: product.unit,
        quantity: 1,
        price: product.price,
        item_total: product.price
      }])
    }
    setProductSearch('')
    setShowProducts(false)
  }

  const updateQuantity = (index, qty) => {
    const newItems = [...items]
    newItems[index].quantity = qty
    newItems[index].item_total = qty * newItems[index].price
    setItems(newItems)
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateSubtotal = () => items.reduce((sum, item) => sum + item.item_total, 0)

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal()
    if (!discountValue || discountValue === '0') return 0
    if (discountType === 'percentage') {
      return (subtotal * parseFloat(discountValue)) / 100
    }
    return parseFloat(discountValue) || 0
  }

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount()
  }

  const handleSave = async (paidAmount) => {
    if (!customerName || items.length === 0) {
      alert('Please add customer and at least one product')
      return
    }

    setLoading(true)
    try {
      const total = calculateTotal()
      const due = total - paidAmount

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          total_amount: total,
          paid_amount: paidAmount,
          due_amount: due
        }])
        .select()
        .single()

      if (invoiceError) throw invoiceError

      for (const item of items) {
        await supabase.from('invoice_items').insert([{
          invoice_id: invoice.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_unit: item.product_unit,
          quantity: item.quantity,
          price: item.price,
          item_total: item.item_total
        }])
      }

      alert('Invoice saved successfully!')
      window.location.href = '/dashboard/invoices'
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{t('createInvoice')}</h1>
        <Link href="/dashboard/invoices" className="px-4 py-2 border rounded hover:bg-slate-50">
          {t('back')}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-4">{t('customerInformation')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative" ref={customerRef}>
                <label className="block text-sm text-slate-600 mb-1">{t('phone')}</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={async (e) => {
                    const query = e.target.value
                    setCustomerPhone(query)
                    if (query.length >= 3) {
                      const { data } = await supabase
                        .from('customers')
                        .select('id,name,phone,address')
                        .or(`phone.ilike.%${query}%,name.ilike.%${query}%`)
                        .limit(5)
                      setCustomers(data || [])
                      setShowCustomers(data?.length > 0)
                    } else {
                      setCustomers([])
                      setShowCustomers(false)
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="01XXXXXXXXX"
                />
                {showCustomers && customers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
                    {customers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-slate-500">{c.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">{t('name')}</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Customer name"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-slate-600 mb-1">{t('address')}</label>
              <textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows="2"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-4">{t('productItems')}</h2>
            <div className="mb-4 relative" ref={productRef}>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value)
                  setShowProducts(e.target.value.length >= 1)
                }}
                onFocus={() => productSearch.length >= 1 && setShowProducts(true)}
                placeholder={t('searchProducts')}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {showProducts && productSearch.length >= 1 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
                  {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm text-slate-500">
                        {formatCurrency(p.price)} - {p.stock_quantity} {p.unit}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-center text-slate-500 py-4">{t('noProductsAdded')}</p>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm">{t('name')}</th>
                    <th className="px-4 py-2 text-right text-sm">{t('quantity')}</th>
                    <th className="px-4 py-2 text-right text-sm">{t('price')}</th>
                    <th className="px-4 py-2 text-right text-sm">Total</th>
                    <th className="px-4 py-2 text-center text-sm"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2 text-sm">{item.product_name}</td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(index, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded text-right"
                          min="1"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(item.item_total)}</td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => removeItem(index)} className="text-red-600 hover:text-red-800">
                          {t('remove')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-4">{t('invoiceSummary')}</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">{t('totalAmount')}:</span>
                <span className="font-bold text-lg">{formatCurrency(calculateSubtotal())}</span>
              </div>
              
              <div className="border-t pt-3">
                <label className="block text-sm text-slate-600 mb-2">{t('discount')}</label>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="fixed">PKR Fixed</option>
                    <option value="percentage">% Percent</option>
                  </select>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '10' : '100'}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              {calculateDiscount() > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('discount')}:</span>
                  <span>-{formatCurrency(calculateDiscount())}</span>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">{t('afterDiscount')}:</span>
                  <span className="font-bold text-xl text-emerald-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-4">{t('payment')}</h2>
            <div className="space-y-3">
              <button
                onClick={() => handleSave(calculateTotal())}
                disabled={loading || items.length === 0}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-semibold"
              >
                {loading ? t('saving') : t('fullPayment')}
              </button>
              <button
                onClick={() => handleSave(0)}
                disabled={loading || items.length === 0}
                className="w-full py-3 border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 disabled:opacity-50 font-semibold"
              >
                {t('creditDue')}
              </button>
              
              <div className="border-t pt-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('partialPayment')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="partialAmount"
                    placeholder="Enter amount"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('partialAmount')
                      const amount = parseFloat(input.value) || 0
                      if (amount > 0 && amount < calculateTotal()) {
                        handleSave(amount)
                      } else if (amount >= calculateTotal()) {
                        handleSave(calculateTotal())
                      } else {
                        alert('Please enter valid amount less than total')
                      }
                    }}
                    disabled={loading || items.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {t('paidAmount')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}