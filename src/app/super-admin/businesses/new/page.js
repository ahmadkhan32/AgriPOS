'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Building2, Loader2, CheckCircle2 } from 'lucide-react'

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
    admin_email: '',
    admin_name: '',
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
      // 1. Create business record
      const { data: biz, error: bizErr } = await supabase
        .from('businesses')
        .insert([{
          name: form.name,
          business_code: form.business_code.toUpperCase(),
          email: form.email,
          phone: form.phone,
          address: form.address,
          plan_id: form.plan_id,
          status: 'trial',
        }])
        .select()
        .single()

      if (bizErr) throw bizErr

      // 2. Create admin role for this business
      const { data: adminRole, error: roleErr } = await supabase
        .from('roles')
        .insert([{
          business_id: biz.id,
          name: 'Admin',
          description: 'Full access to all features',
          is_system: true,
        }])
        .select()
        .single()

      if (roleErr) throw roleErr

      // 3. Create main branch
      await supabase.from('branches').insert([{
        business_id: biz.id,
        name: 'Main Branch',
        is_main: true,
      }])

      // 4. Create shop settings
      await supabase.from('shop_settings').insert([{
        business_id: biz.id,
        name: form.name,
        phone: form.phone,
        address: form.address,
      }])

      // Note: Creating the Supabase Auth user requires admin API key
      // For now, show success and instruct admin to register separately
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
        <p className="text-slate-400 mb-6">The business admin can now register via Supabase Auth and will be linked to this business.</p>
        <p className="text-slate-500 text-sm">Redirecting to businesses list...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
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
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
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
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} — PKR {p.monthly_price?.toLocaleString()}/mo</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl outline-none focus:border-violet-500 placeholder:text-slate-500"
                placeholder="admin@shop.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl outline-none focus:border-violet-500 placeholder:text-slate-500"
                placeholder="03XX-XXXXXXX" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Address</label>
            <textarea name="address" value={form.address} onChange={handleChange} rows={2}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl outline-none focus:border-violet-500 placeholder:text-slate-500 resize-none"
              placeholder="Shop #5, Main Market, Lahore" />
          </div>
        </div>

        <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-4 text-sm text-slate-400">
          <strong className="text-slate-300">Next Steps:</strong> After creating the business, the business admin should register at <code className="text-violet-400">/login</code> using their email. You will then need to create their <code className="text-violet-400">business_users</code> record in Supabase to link their account to this business.
        </div>

        <div className="flex gap-4">
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
