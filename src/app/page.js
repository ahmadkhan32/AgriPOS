'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

import {
  Sprout, BarChart3, Users, Package, ShoppingCart, Wifi, WifiOff,
  CheckCircle2, ArrowRight, Star, Building2, Shield, Zap, Globe,
  ChevronDown, ChevronUp, Phone, Mail, MessageCircle, TrendingUp,
  Receipt, Truck, Settings, Lock, RefreshCw
} from 'lucide-react'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 1999,
    yearlyPrice: 19990,
    users: 2,
    branches: 1,
    products: '1,000',
    popular: false,
    color: 'from-slate-600 to-slate-700',
    features: [
      'POS Terminal',
      'Inventory Management',
      'Customer Accounts',
      'Basic Reports',
      'Offline Operation',
      'Online Sync',
      '2 Users',
      '1 Branch',
      'Email Support',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 3999,
    yearlyPrice: 39990,
    users: 5,
    branches: 2,
    products: '10,000',
    popular: true,
    color: 'from-emerald-500 to-emerald-700',
    features: [
      'Everything in Starter',
      'Supplier Management',
      'Purchase Orders',
      'Advanced Reports',
      'Role Permissions',
      '5 Users',
      '2 Branches',
      'Priority Support',
      'Financial Reports',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 6999,
    yearlyPrice: 69990,
    users: 15,
    branches: 5,
    products: 'Unlimited',
    popular: false,
    color: 'from-violet-600 to-violet-800',
    features: [
      'Everything in Business',
      'Unlimited Products',
      'Custom Roles',
      'Export Reports',
      '15 Users',
      '5 Branches',
      'API Access',
      'Dedicated Support',
      'Custom Integrations',
    ],
  },
]

const features = [
  {
    icon: ShoppingCart,
    title: 'Lightning Fast POS',
    desc: 'Process sales in seconds. Search products, apply discounts, print receipts — all in one seamless flow.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Package,
    title: 'Smart Inventory',
    desc: 'Track stock in real-time. Get low-stock alerts, manage purchase orders, and never run out again.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: WifiOff,
    title: 'Works Offline',
    desc: 'Internet goes down? Keep selling. Data syncs automatically when your connection returns.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Users,
    title: 'Multi-User & Roles',
    desc: 'Add cashiers, managers, storekeepers. Control who sees what with granular permissions.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Building2,
    title: 'Multi-Branch',
    desc: 'Manage multiple shop locations from one dashboard. Centralized reporting across all branches.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: BarChart3,
    title: 'Powerful Reports',
    desc: 'Daily sales, profit/loss, top products, customer dues — make data-driven decisions.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Truck,
    title: 'Supplier & Purchases',
    desc: 'Manage suppliers, record purchase orders, and track what you owe to whom.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    desc: 'Row-level security ensures your data is 100% isolated. No business can see another\'s data.',
    color: 'bg-slate-50 text-slate-600',
  },
]

const faqs = [
  {
    q: 'Can I use it without an internet connection?',
    a: 'Yes! AgriPOS is designed for Pakistan\'s internet challenges. It works fully offline and automatically syncs when your connection returns.',
  },
  {
    q: 'How many devices can I use?',
    a: 'You can use AgriPOS on any device — desktop, laptop, tablet, or phone. Each user in your plan can log in from any browser.',
  },
  {
    q: 'Can I try before I pay?',
    a: 'Absolutely. Every new business gets a 14-day free trial on the Business plan. No credit card required.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your data belongs to you. You can export everything before cancellation. We retain data for 30 days after cancellation.',
  },
  {
    q: 'Can I add more users later?',
    a: 'Yes. You can upgrade your plan at any time to get more users, branches, and features.',
  },
  {
    q: 'Is my business data safe?',
    a: 'Yes. Each business\'s data is completely isolated using row-level security. No other business can access your data — ever.',
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-800">{q}</span>
        {open ? <ChevronUp size={20} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
          {a}
        </div>
      )}
    </div>
  )
}

export default function LandingPage() {
  const [billing, setBilling] = useState('monthly')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-100">
              <Sprout size={22} />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg">AgriPOS</span>
              <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase block leading-none">by SabrWare</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/login" className="text-sm font-bold bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 hover:shadow-emerald-200 active:scale-[0.98]">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 pt-24 pb-32">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-emerald-500/30">
              <Zap size={14} />
              14-Day Free Trial — No Credit Card Required
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Powerful POS for<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                Your Growing Business
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              Sell faster. Manage inventory. Control every branch, user, and rupee — 
              <strong className="text-white"> online and offline</strong>.
              Built specifically for Pakistan's agricultural businesses.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-400/40 active:scale-[0.98]"
              >
                Start Free Trial
                <ArrowRight size={20} />
              </Link>
              <a href="#pricing"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-lg px-8 py-4 rounded-2xl transition-all border border-white/20"
              >
                See Pricing
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-slate-400 text-sm">
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> No credit card</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> 14-day free trial</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Cancel anytime</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Offline support</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
            {[
              { val: '14 Days', label: 'Free Trial' },
              { val: 'PKR 1,999', label: 'Starting Price/Month' },
              { val: '3 Levels', label: 'User Roles' },
              { val: '100%', label: 'Data Isolated' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-2xl font-extrabold text-white mb-1">{val}</div>
                <div className="text-slate-400 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">How AgriPOS Works</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Three levels of control, one unified platform.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Super Admin',
                desc: 'Creates businesses, assigns plans, manages subscriptions and monitors the entire platform.',
                color: 'from-violet-500 to-purple-600',
                icon: Shield,
              },
              {
                step: '02',
                title: 'Business Admin',
                desc: 'Manages their shop: adds products, users, suppliers. Controls everything within their business.',
                color: 'from-emerald-500 to-teal-600',
                icon: Building2,
              },
              {
                step: '03',
                title: 'Staff Users',
                desc: 'Cashiers, managers, storekeepers — each sees only what their role permits.',
                color: 'from-blue-500 to-indigo-600',
                icon: Users,
              },
            ].map(({ step, title, desc, color, icon: Icon }) => (
              <div key={step} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${color} text-white mb-6 shadow-lg`}>
                  <Icon size={24} />
                </div>
                <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Step {step}</div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
                <p className="text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              A complete business management system — not just a cash register.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="group p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all">
                <div className={`inline-flex p-3 rounded-xl ${color} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OFFLINE SECTION */}
      <section className="py-24 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-orange-500/30">
                <WifiOff size={14} />
                Offline-First Architecture
              </div>
              <h2 className="text-4xl font-extrabold text-white mb-6">
                Internet Down?<br />
                <span className="text-orange-400">Keep Selling.</span>
              </h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Pakistan's internet can be unpredictable. AgriPOS works completely offline. 
                Your sales continue, receipts print, and inventory updates — all without internet.
                When connectivity returns, everything syncs automatically.
              </p>
              <div className="space-y-4">
                {[
                  'Create sales without internet',
                  'Print receipts offline',
                  'Inventory updates locally',
                  'Auto-sync when online',
                  'No duplicate transactions',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 size={18} className="text-orange-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[
                { icon: WifiOff, title: 'Offline Mode Active', desc: 'Sales stored locally in browser', color: 'text-orange-400' },
                { icon: RefreshCw, title: 'Sync Queue', desc: '3 transactions pending upload', color: 'text-blue-400' },
                { icon: Wifi, title: 'Connection Restored', desc: 'Syncing to cloud database...', color: 'text-emerald-400' },
                { icon: CheckCircle2, title: 'Sync Complete', desc: 'All data uploaded successfully', color: 'text-emerald-400' },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                  <div className={`${color} flex-shrink-0`}><Icon size={24} /></div>
                  <div>
                    <div className="text-white font-semibold">{title}</div>
                    <div className="text-slate-400 text-sm">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-500 text-lg mb-8">Pay for what you need. Upgrade anytime. Cancel anytime.</p>

            {/* Billing toggle */}
            <div className="inline-flex bg-slate-200 rounded-xl p-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${billing === 'monthly' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${billing === 'yearly' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
              >
                Yearly
                <span className="ml-2 text-xs text-emerald-600 font-bold">Save 17%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 ${plan.popular
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-2xl shadow-emerald-200 scale-105'
                  : 'bg-white border border-slate-200 text-slate-900'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Star size={12} fill="currentColor" />
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-lg font-bold mb-2 ${plan.popular ? 'text-white' : 'text-slate-800'}`}>{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                      PKR {(billing === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)).toLocaleString()}
                    </span>
                    <span className={`mb-1 text-sm ${plan.popular ? 'text-emerald-100' : 'text-slate-400'}`}>/month</span>
                  </div>
                  {billing === 'yearly' && (
                    <p className={`text-sm mt-1 ${plan.popular ? 'text-emerald-100' : 'text-slate-500'}`}>
                      PKR {plan.yearlyPrice.toLocaleString()}/year — billed annually
                    </p>
                  )}
                </div>

                <div className={`text-sm mb-6 flex gap-4 ${plan.popular ? 'text-emerald-100' : 'text-slate-500'}`}>
                  <span>{plan.users} Users</span>
                  <span>·</span>
                  <span>{plan.branches} Branch{plan.branches > 1 ? 'es' : ''}</span>
                  <span>·</span>
                  <span>{plan.products} Products</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.popular ? 'text-emerald-50' : 'text-slate-600'}`}>
                      <CheckCircle2 size={16} className={plan.popular ? 'text-emerald-200 flex-shrink-0' : 'text-emerald-500 flex-shrink-0'} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`block w-full text-center py-3.5 rounded-2xl font-bold text-sm transition-all ${plan.popular
                    ? 'bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg shadow-emerald-800/30'
                    : 'bg-slate-900 text-white hover:bg-slate-700'}`}
                >
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>

          {/* Enterprise */}
          <div className="mt-8 max-w-5xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Enterprise</h3>
              <p className="text-slate-500">Custom users, unlimited branches, dedicated support, custom integrations. Tailored for large operations.</p>
            </div>
            <a href="mailto:sales@sabrware.com"
              className="flex-shrink-0 flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-700 transition-all"
            >
              <Mail size={18} />
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500">Everything you need to know about AgriPOS.</p>
          </div>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => <FAQItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">
            Ready to transform your business?
          </h2>
          <p className="text-emerald-100 text-xl mb-10">
            Start your 14-day free trial today. No credit card. No setup fees.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold text-lg px-10 py-4 rounded-2xl hover:bg-emerald-50 transition-all shadow-xl active:scale-[0.98]"
            >
              Get Started Free
              <ArrowRight size={20} />
            </Link>
            <a href="tel:+923001234567"
              className="inline-flex items-center gap-2 bg-white/20 text-white font-semibold text-lg px-8 py-4 rounded-2xl hover:bg-white/30 transition-all border border-white/30"
            >
              <Phone size={20} />
              Call Us
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-xl text-white">
                <Sprout size={20} />
              </div>
              <div>
                <span className="font-bold text-white">AgriPOS</span>
                <span className="text-xs text-emerald-500 font-bold tracking-widest uppercase block leading-none">by SabrWare</span>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} SabrWare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}