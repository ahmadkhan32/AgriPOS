'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  en: {
    dashboard: 'Dashboard',
    products: 'Products',
    customers: 'Customers',
    invoices: 'Invoices',
    inventory: 'Inventory',
    settings: 'Settings',
    signOut: 'Sign Out',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    name: 'Name',
    category: 'Category',
    unit: 'Unit',
    price: 'Price',
    stock: 'Stock',
    stockQuantity: 'Stock Quantity',
    actions: 'Actions',
    save: 'Save',
    cancel: 'Cancel',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    searchProducts: 'Search products...',
    noProductsFound: 'No products found',
    addCustomer: 'Add Customer',
    editCustomer: 'Edit Customer',
    phone: 'Phone',
    address: 'Address',
    totalPurchase: 'Total Purchase',
    totalPaid: 'Total Paid',
    due: 'Due',
    viewProfile: 'View',
    todaySales: 'Today\'s Sales',
    totalDue: 'Total Due',
    totalCustomers: 'Total Customers',
    lowStockAlerts: 'Low Stock Alerts',
    recentInvoices: 'Recent Invoices',
    invoiceId: 'Invoice ID',
    customer: 'Customer',
    amount: 'Amount',
    date: 'Date',
    createInvoice: 'Create Invoice',
    back: 'Back',
    customerInformation: 'Customer Information',
    productItems: 'Products',
    invoiceSummary: 'Invoice Summary',
    totalAmount: 'Total Amount',
    discount: 'Discount',
    afterDiscount: 'After Discount',
    payment: 'Payment',
    fullPayment: 'Full Payment',
    creditDue: 'Credit (Due)',
    partialPayment: 'Partial Payment',
    paidAmount: 'Paid Amount',
    noProductsAdded: 'No products added yet',
    remove: 'Remove',
    quantity: 'Qty',
    selectProduct: 'Search products...',
    all: 'All',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    pesticide: 'Pesticide',
    fertilizer: 'Fertilizer',
    seed: 'Seed',
    kg: 'KG',
    liter: 'Liter',
    ml: 'ML',
    piece: 'Piece',
    login: 'Login',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    saving: 'Saving...',
    searchByPhone: 'Search by phone...',
    searchByCustomer: 'Search by customer...',
    taka: 'PKR',
  },
  bn: {
    dashboard: 'ড্যাশবোর্ড',
    products: 'পণ্য',
    customers: 'গ্রাহক',
    invoices: 'রসিদসমূহ',
    inventory: 'ইনভেন্টরি',
    settings: 'সেটিংস',
    signOut: 'সাইন আউট',
    addProduct: 'পণ্য যোগ করুন',
    editProduct: 'পণ্য সম্পাদনা',
    name: 'নাম',
    category: 'ক্যাটাগরি',
    unit: 'একক',
    price: 'দাম',
    stock: 'স্টক',
    stockQuantity: 'স্টক পরিমাণ',
    actions: 'কার্যক্রম',
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    add: 'যোগ',
    edit: 'সম্পাদনা',
    delete: 'মুছুন',
    search: 'অনুসন্ধান',
    searchProducts: 'পণ্য খুঁজুন...',
    noProductsFound: 'কোনো পণ্য পাওয়া যায়নি',
    addCustomer: 'গ্রাহক যোগ করুন',
    editCustomer: 'গ্রাহক সম্পাদনা',
    phone: 'ফোন',
    address: '�ঠিকানা',
    totalPurchase: 'মোট ক্রয়',
    totalPaid: 'মোট পরিশোধ',
    due: 'বকেয়া',
    viewProfile: 'দেখুন',
    todaySales: 'আজকের বিক্রয়',
    totalDue: 'মোট বকেয়া',
    totalCustomers: 'মোট গ্রাহক',
    lowStockAlerts: 'কম স্টক সতর্কতা',
    recentInvoices: 'সাম্প্রতিক রসিদ',
    invoiceId: 'রসিদ নং',
    customer: 'গ্রাহক',
    amount: 'টাকা',
    date: 'তারিখ',
    createInvoice: 'নতুন রসিদ',
    back: 'ফিরে যান',
    customerInformation: 'গ্রাহক তথ্য',
    productItems: 'পণ্যসমূহ',
    invoiceSummary: 'রসিদ সারাংশ',
    totalAmount: 'মোট টাকা',
    discount: 'ছাড়',
    afterDiscount: 'ছাড়ের পরে',
    payment: 'পরিশোধ',
    fullPayment: 'সম্পূর্ণ পরিশোধ',
    creditDue: 'বকেয়া',
    partialPayment: 'আংশিক পরিশোধ',
    paidAmount: 'পরিশোধের পরিমাণ',
    noProductsAdded: 'এখনো কোনো পণ্য যোগ করা হয়নি',
    remove: 'সরান',
    quantity: 'পরিমাণ',
    selectProduct: 'পণ্য খুঁজুন...',
    all: 'সব',
    lowStock: 'কম স্টক',
    outOfStock: 'স্টক নেই',
    pesticide: 'কীটনাশক',
    fertilizer: 'সার',
    seed: 'বীজ',
    kg: 'কেজি',
    liter: 'লিটার',
    ml: 'মিলি',
    piece: 'পিস',
    login: 'লগইন',
    email: 'ইমেইল',
    password: 'পাসওয়ার্ড',
    signIn: 'সাইন ইন',
    saving: 'সংরক্ষণ হচ্ছে...',
    searchByPhone: 'ফোন দিয়ে খুঁজুন...',
    searchByCustomer: 'গ্রাহক দিয়ে খুঁজুন...',
    taka: 'PKR',
  }
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('language')
    if (saved && (saved === 'en' || saved === 'bn')) {
      setLanguage(saved)
    }
    setMounted(true)
  }, [])

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'bn' : 'en'
    setLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key
  }

  const formatCurrency = (amount) => {
    const num = amount || 0
    return 'PKR ' + Math.round(num).toLocaleString()
  }

  const getUnit = (unit) => unit

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, formatCurrency, getUnit }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    return { 
      language: 'en', 
      toggleLanguage: () => {}, 
      t: (key) => key,
      formatCurrency: (amount) => 'PKR ' + (amount || 0),
      getUnit: (unit) => unit
    }
  }
  return context
}