import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { invoice, shopSettings, language } = await request.json()
    
    const formatCurrency = (amount) => {
      const num = amount || 0
      if (language === 'bn') {
        return 'PKR ' + Math.round(num).toLocaleString()
      }
      return 'PKR ' + Math.round(num).toLocaleString()
    }

    const invoiceItems = invoice.items || []
    const itemsHtml = invoiceItems.map(item => `
      <tr>
        <td>${item.product_name}</td>
        <td style="text-align:right">${item.quantity} ${item.product_unit}</td>
        <td style="text-align:right">${formatCurrency(item.price)}</td>
        <td style="text-align:right;font-weight:bold">${formatCurrency(item.item_total)}</td>
      </tr>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 20px; }
          .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 8px; border-bottom: 1px solid #ddd; }
          th { text-align: left; background: #f3f4f6; }
          .totals { text-align: right; }
          .totals div { margin: 5px 0; }
          .due { color: red; font-weight: bold; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${shopSettings?.name || 'Agricultural Shop'}</h1>
          <p>${shopSettings?.address || ''}</p>
          <p>${shopSettings?.phone || ''}</p>
        </div>
        
        <div class="info">
          <div>
            <strong>${language === 'bn' ? 'গ্রাহক' : 'Customer'}:</strong> ${invoice.customer_name}<br>
            <strong>${language === 'bn' ? 'ফোন' : 'Phone'}:</strong> ${invoice.customer_phone}
          </div>
          <div style="text-align:right">
            <strong>${language === 'bn' ? 'রসিদ নং' : 'Invoice #'}:</strong> #${invoice.id.slice(0, 8).toUpperCase()}<br>
            <strong>${language === 'bn' ? 'তারিখ' : 'Date'}:</strong> ${new Date(invoice.created_at).toLocaleDateString()}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>${language === 'bn' ? 'পণ্য' : 'Product'}</th>
              <th style="text-align:right">${language === 'bn' ? 'পরিমাণ' : 'Qty'}</th>
              <th style="text-align:right">${language === 'bn' ? 'দাম' : 'Price'}</th>
              <th style="text-align:right">${language === 'bn' ? 'মোট' : 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div><strong>${language === 'bn' ? 'মোট' : 'Total'}:</strong> ${formatCurrency(invoice.total_amount)}</div>
          <div>${language === 'bn' ? 'পরিশোধ' : 'Paid'}: ${formatCurrency(invoice.paid_amount)}</div>
          <div class="due">${language === 'bn' ? 'বকেয়া' : 'Due'}: ${formatCurrency(invoice.due_amount)}</div>
        </div>

        <div style="margin-top:30px;text-align:center;font-size:12px;color:#666">
          <p>${language === 'bn' ? 'ধন্যবাদ! আবার আসতে আসতে হবে।' : 'Thank you! Visit again.'}</p>
        </div>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}