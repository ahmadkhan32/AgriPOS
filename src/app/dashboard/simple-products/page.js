'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SimpleProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        console.log('Simple load starting...')
        const { data, error } = await supabase.from('products').select('*')
        console.log('Simple load finished:', { data, error })
        if (error) throw error
        setProducts(data || [])
      } catch (err) {
        console.error('Simple load error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div>Simple Loading...</div>
  if (error) return <div>Simple Error: {error}</div>

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Simple Products Page</h1>
      <ul>
        {products.map(p => (
          <li key={p.id}>{p.name} - {p.price}</li>
        ))}
      </ul>
      {products.length === 0 && <p>No products found.</p>}
    </div>
  )
}
