'use client'

import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useFastQuery } from '@/lib/cache'
import jsPDF from 'jspdf'

export default function InvoicesPage() {
  const { t, formatCurrency } = useLanguage()
  const { businessId } = useAuth()
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [invoiceItems, setInvoiceItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const { data: invoicesData, loading, error, refetch } = useFastQuery(
    businessId ? `invoices_${businessId}` : null,
    async () => {
      const [invoicesRes, settingsRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, customer_name, customer_phone, customer_address, total_amount, paid_amount, due_amount, created_at, business_id')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false }),
        supabase.from('shop_settings').select('*').eq('business_id', businessId).limit(1)
      ])

      if (invoicesRes.error) throw invoicesRes.error

      return {
        invoices: invoicesRes.data || [],
        shopSettings: settingsRes.data?.[0] || null,
      }
    },
    { enabled: !!businessId, maxAge: 30000 }
  )

  const invoices = invoicesData?.invoices || []
  const shopSettings = invoicesData?.shopSettings || null

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices
    const q = searchQuery.toLowerCase()
    return invoices.filter(inv =>
      (inv.customer_name || '').toLowerCase().includes(q) ||
      (inv.customer_phone || '').toLowerCase().includes(q) ||
      (inv.id || '').toLowerCase().includes(q)
    )
  }, [invoices, searchQuery])

  const loadInvoiceItems = async (invoiceId) => {
    const { data } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
    setInvoiceItems(data || [])
  }

  const viewInvoice = async (invoice) => {
    setSelectedInvoice(invoice)
    await loadInvoiceItems(invoice.id)
  }

  const searchInvoices = (query) => {
    setSearchQuery(query)
  }

  const closeInvoice = () => {
    setSelectedInvoice(null)
    setInvoiceItems([])
  }

  const formatDate = (date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-BD')
  }

  const downloadPDF = () => {
    if (!selectedInvoice) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(shopSettings?.name || 'Agricultural Shop', pageWidth / 2, 20, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(shopSettings?.address || '', pageWidth / 2, 28, { align: 'center' })
    doc.text(shopSettings?.phone || '', pageWidth / 2, 34, { align: 'center' })
    
    // Invoice title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', pageWidth / 2, 48, { align: 'center' })
    
    // Invoice info
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Invoice No: #${selectedInvoice.id.slice(0, 8).toUpperCase()}`, pageWidth - 15, 58, { align: 'right' })
    doc.text(`Date: ${formatDate(selectedInvoice.created_at)}`, pageWidth - 15, 64, { align: 'right' })
    
    // Customer info
    doc.text(`Customer: ${selectedInvoice.customer_name || 'N/A'}`, 15, 58)
    doc.text(`Phone: ${selectedInvoice.customer_phone || 'N/A'}`, 15, 64)
    doc.text(`Address: ${selectedInvoice.customer_address || 'N/A'}`, 15, 70)
    
    // Table header
    let y = 85
    doc.setFillColor(241, 245, 249)
    doc.rect(15, y - 5, pageWidth - 30, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text('Product', 18, y)
    doc.text('Qty', 110, y)
    doc.text('Price', 135, y)
    doc.text('Total', pageWidth - 18, y, { align: 'right' })
    
    // Table rows
    doc.setFont('helvetica', 'normal')
    y += 10
    invoiceItems.forEach((item) => {
      doc.text(item.product_name, 18, y)
      doc.text(`${item.quantity} ${item.product_unit}`, 110, y)
      doc.text(formatCurrency(item.price), 135, y)
      doc.text(formatCurrency(item.item_total), pageWidth - 18, y, { align: 'right' })
      y += 8
    })
    
    // Totals
    y += 10
    doc.setDrawColor(200)
    doc.line(15, y - 5, pageWidth - 15, y - 5)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Total Amount:', 120, y)
    doc.text(formatCurrency(selectedInvoice.total_amount), pageWidth - 18, y, { align: 'right' })
    
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.text('Paid:', 120, y)
    doc.text(formatCurrency(selectedInvoice.paid_amount), pageWidth - 18, y, { align: 'right' })
    
    y += 8
    doc.setTextColor(220, 50, 50)
    doc.text('Due:', 120, y)
    doc.text(formatCurrency(selectedInvoice.due_amount), pageWidth - 18, y, { align: 'right' })
    
    doc.save(`invoice-${selectedInvoice.id.slice(0, 8)}.pdf`)
  }

  if (loading && !invoicesData) {
    return (
      <div className="space-y-4 animate-pulse" suppressHydrationWarning>
        <div className="h-10 w-48 bg-slate-200 rounded-lg" />
        <div className="h-10 w-80 bg-slate-200 rounded-lg" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    )
  }

  if (error && !invoicesData) {
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
        <h1 className="text-2xl font-bold text-slate-800">{t('invoices')}</h1>
        <Link href="/dashboard/invoices/new" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          {t('createInvoice')}
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => searchInvoices(e.target.value)}
          placeholder="Search by phone number, customer name, or ID..."
          className="w-full max-w-md px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No invoices found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">{t('invoiceId')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">{t('customer')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">{t('phone')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">{t('amount')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">{t('paidAmount')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">{t('due')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">{t('date')}</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono">#{inv.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-sm">{inv.customer_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">{inv.customer_phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(inv.total_amount)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(inv.paid_amount)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={inv.due_amount > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                      {formatCurrency(inv.due_amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatDate(inv.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => viewInvoice(inv)} className="text-blue-600 hover:text-blue-800">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-auto" id="invoice-full">
            <div className="flex justify-end gap-3 p-4 border-t bg-slate-50 print:hidden">
              <button onClick={closeInvoice} className="px-4 py-2 border rounded hover:bg-slate-100">{t('close') || 'Close'}</button>
              <button onClick={downloadPDF} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Download PDF</button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">{t('print') || 'Print'}</button>
            </div>
            <div>
              <div className="p-6 border-b">
                <div className="text-center">
                  <h1 className="text-xl font-bold">{shopSettings?.name || 'Agricultural Shop'}</h1>
                  <p className="text-sm text-slate-600">{shopSettings?.address}</p>
                  <p className="text-sm text-slate-600">{shopSettings?.phone}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4 pb-4 border-b">
                  <h2 className="text-lg font-bold">INVOICE</h2>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p><strong>Customer:</strong> {selectedInvoice.customer_name}</p>
                      <p><strong>Phone:</strong> {selectedInvoice.customer_phone}</p>
                      <p><strong>Address:</strong> {selectedInvoice.customer_address || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p><strong>Date:</strong> {formatDate(selectedInvoice.created_at)}</p>
                      <p><strong>Invoice No:</strong> #{selectedInvoice.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                <table className="w-full mb-4">
                  <thead className="border-b">
                    <tr>
                      <th className="py-2 text-left text-sm">Product</th>
                      <th className="py-2 text-right text-sm">Qty</th>
                      <th className="py-2 text-right text-sm">Price</th>
                      <th className="py-2 text-right text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2 text-sm">{item.product_name}</td>
                        <td className="py-2 text-sm text-right">{item.quantity} {item.product_unit}</td>
                        <td className="py-2 text-sm text-right">{formatCurrency(item.price)}</td>
                        <td className="py-2 text-sm text-right">{formatCurrency(item.item_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-bold">{formatCurrency(selectedInvoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span>{formatCurrency(selectedInvoice.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Due:</span>
                    <span className="font-bold">{formatCurrency(selectedInvoice.due_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}