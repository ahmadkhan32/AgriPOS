'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Building2, Loader2, CheckCircle2, UserCircle } from 'lucide-react'

export default function NewBusinessPage() {
  const router = useRouter()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    name: '',
    business_code: '',
    email: '',
    phone: '',
    address: '',
    plan_id: 'business',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('subscription_plans').select('*').order('sort_order').then(({ data }) => setPlans(data || []))
  }, [])

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const generateCode = (name) => {
    const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'BIZ'
    const num = String(Math.floor(Math.random() * 9000) + 1000)
    return `${prefix}-${num}`
  }

  const handleNameChange = (e) => {
    const name = e.target.value
    setForm(prev => ({
      ...prev,
      name,
      business_code: prev.business_code || generateCode(name),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create business')
      }

      setSuccess(true)

      setTimeout(() => {
        router.push('/super-admin/businesses')
      }, 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600/20 rounded-full mb-6">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Business Created!</h2>
        <p className="text-slate-400 mb-2">Business Code: <strong className="text-white font-mono">{form.business_code.toUpperCase()}</strong></p>
        <p className="text-slate-400 mb-6">The business admin account was successfully created.</p>
        <p className="text-slate-500 text-sm">Redirecting to businesses list...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-12" suppressHydrationWarning>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/super-admin/businesses" className="p-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Create New Business</h1>
          <p className="text-slate-400 text-sm mt-1">Set up a new business on the AgriPOS platform</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Business Info */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Building2 size={20} className="text-violet-400" />
              Business Information
            </h2>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Business Name *</label>
              <input name="name" value={form.name} onChange={handleNameChange} required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl outline-none focus:border-violet-500 placeholder:text-slate-500"
                placeholder="Ahmad Agriculture Store" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Business Code *</label>
                <input name="business_code" value={form.business_code} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl outline-none focus:border-violet-500 font-mono"
                  placeholder="AGRI-0001" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Plan *</label>
                <select name="plan_id" value={form.plan_id} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl outline-none focus:border-violet-500">
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Business Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl outline-none focus:border-violet-500 placeholder:text-slate-500"
                placeholder="info@shop.com" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Business Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl outline-none focus:border-violet-500 placeholder:text-slate-500"
                placeholder="03XX-XXXXXXX" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} rows={2}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl outline-none focus:border-violet-500 placeholder:text-slate-500 resize-none"
                placeholder="Shop #5, Main Market, Lahore" />
            </div>
          </div>

          {/* Admin Account */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <UserCircle size={20} className="text-emerald-400" />
              Business Admin Account
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              This will create the master account for the business owner. They will use this email and password to log into their dashboard.
            </p>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Admin Full Name *</label>
              <input name="admin_name" value={form.admin_name} onChange={handleChange} required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl outline-none focus:border-emerald-500 placeholder:text-slate-500"
                placeholder="Ahmad Khan" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Login Email *</label>
              <input name="admin_email" type="email" value={form.admin_email} onChange={handleChange} required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl outline-none focus:border-emerald-500 placeholder:text-slate-500"
                placeholder="ahmad@gmail.com" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Password *</label>
              <input name="admin_password" type="password" value={form.admin_password} onChange={handleChange} required minLength={6}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl outline-none focus:border-emerald-500 placeholder:text-slate-500"
                placeholder="Min 6 characters" />
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400 bg-slate-700/50 p-3 rounded-lg">
                <strong className="text-white block mb-1">How it works:</strong>
                A Supabase Auth user will be created. They will be assigned the "Admin" role for this business automatically. They can log in immediately.
              </p>
            </div>
          </div>
          
        </div>

        <div className="flex gap-4 max-w-md ml-auto">
          <Link href="/super-admin/businesses"
            className="flex-1 py-3 border border-slate-600 text-slate-300 rounded-xl text-center font-semibold hover:bg-slate-700 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : 'Create Business'}
          </button>
        </div>
      </form>
    </div>
  )
}
