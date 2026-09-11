'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// In-memory cache store
const cache = new Map()

/**
 * Retrieve cached item if within maxAge (default 60s)
 */
export function getCached(key, maxAge = 60000) {
  if (!key) return null
  const item = cache.get(key)
  if (!item) return null
  if (Date.now() - item.timestamp > maxAge) {
    // Stale but can be used for stale-while-revalidate
    return { data: item.data, isStale: true }
  }
  return { data: item.data, isStale: false }
}

/**
 * Save item to cache
 */
export function setCached(key, data) {
  if (!key) return
  cache.set(key, { data, timestamp: Date.now() })
}

/**
 * Invalidate specific key or keys matching prefix (e.g. 'products')
 */
export function invalidateCache(keyOrPrefix) {
  if (!keyOrPrefix) return
  for (const key of cache.keys()) {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
      cache.delete(key)
    }
  }
}

/**
 * Fast SWR (Stale-While-Revalidate) Query Hook
 * Returns cached data immediately (0ms delay) and revalidates in background.
 */
export function useFastQuery(key, fetcher, options = {}) {
  const { maxAge = 60000, enabled = true } = options
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  // Check initial cache synchronously for 0ms initial render
  const cached = enabled ? getCached(key, maxAge) : null

  const [data, setData] = useState(cached ? cached.data : null)
  const [loading, setLoading] = useState(enabled && !cached)
  const [error, setError] = useState(null)

  const executeFetch = useCallback(async (isBackground = false) => {
    if (!enabled || !key) return
    if (!isBackground) setLoading(true)
    setError(null)

    try {
      const freshData = await fetcherRef.current()
      setCached(key, freshData)
      setData(freshData)
    } catch (err) {
      console.error(`Error fetching ${key}:`, err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [key, enabled])

  useEffect(() => {
    if (!enabled || !key) return

    const currentCached = getCached(key, maxAge)
    if (currentCached) {
      setData(currentCached.data)
      // If stale, revalidate silently in background
      if (currentCached.isStale) {
        executeFetch(true)
      } else {
        setLoading(false)
      }
    } else {
      executeFetch(false)
    }
  }, [key, enabled, maxAge, executeFetch])

  const mutate = useCallback((updater) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      setCached(key, next)
      return next
    })
  }, [key])

  const refetch = useCallback(() => {
    return executeFetch(false)
  }, [executeFetch])

  return { data, loading, error, mutate, refetch, setData }
}
