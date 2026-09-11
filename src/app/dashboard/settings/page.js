'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/context/LanguageContext'

export default function SettingsPage() {
  const { t } = useLanguage()
  const [settings, setSettings] = useState({
    name: '',
    address: '',
    phone: '',
    logo_url: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('shop_settings')
          .select('*')
          .limit(1)
        
        if (error) throw error
        if (data?.length && mounted) {
          setSettings({
            name: data[0].name || '',
            address: data[0].address || '',
            phone: data[0].phone || '',
            logo_url: data[0].logo_url || '',
          })
        }
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadSettings()
    return () => { mounted = false }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: existing } = await supabase
        .from('shop_settings')
        .select('id')
        .limit(1)

      if (existing?.length) {
        const { error } = await supabase
          .from('shop_settings')
          .update(settings)
          .eq('id', existing[0].id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('shop_settings')
          .insert([settings])
        if (error) throw error
      }
      alert('Settings saved successfully')
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('shop-logos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('shop-logos')
        .getPublicUrl(fileName)

      const newLogoUrl = data.publicUrl
      setSettings({ ...settings, logo_url: newLogoUrl })
      alert('Logo uploaded successfully')
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" suppressHydrationWarning>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" suppressHydrationWarning></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg" suppressHydrationWarning>
        Error: {error}
      </div>
    )
  }

  return (
    <div suppressHydrationWarning>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{t('settings')}</h1>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Shop Information</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Shop Logo
            </label>
            <div className="flex items-center gap-4">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="Shop Logo"
                  className="w-24 h-24 object-contain border rounded"
                />
              ) : (
                <div className="w-24 h-24 border rounded flex items-center justify-center text-slate-400">
                  No Logo
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </label>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Shop Name
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter shop name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Shop Address
            </label>
            <textarea
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows="2"
              placeholder="Enter shop address"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="01XXXXXXXXX"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}