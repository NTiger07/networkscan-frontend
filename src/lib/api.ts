import type { HeatmapPoint, MapFilters, SpeedTestResult } from './types'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function submitTest(payload: {
  latitude: number
  longitude: number
  provider: string
  networkType: string
} & SpeedTestResult): Promise<void> {
  const res = await fetch(`${BASE}/tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Submit failed: ${res.status}`)
}

export async function fetchHeatmapData(filters: Partial<MapFilters>): Promise<HeatmapPoint[]> {
  const params = new URLSearchParams()
  if (filters.providers?.length) params.set('providers', filters.providers.join(','))
  if (filters.includeBaseline !== undefined) params.set('includeBaseline', String(filters.includeBaseline))

  const res = await fetch(`${BASE}/tests/heatmap?${params}`)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchStats(filters: Partial<MapFilters>) {
  const params = new URLSearchParams()
  if (filters.providers?.length) params.set('providers', filters.providers.join(','))

  const res = await fetch(`${BASE}/tests/stats?${params}`)
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`)
  return res.json()
}

export async function fetchBaselineStats() {
  const res = await fetch(`${BASE}/tests/baseline-stats`)
  if (!res.ok) throw new Error(`Baseline stats failed: ${res.status}`)
  return res.json()
}

export async function checkHealth() {
  try {
    const res = await fetch(`${BASE}/tests/health`)
    if (!res.ok) return false
    return true
  } catch {
    return false
  }
}

export async function detectProvider(): Promise<{ provider: string; networkType: string }> {
  try {
    const res = await fetch('https://ip-api.com/json/?fields=org,mobile,isp', {
      signal: AbortSignal.timeout(4000),
    })
    const data = await res.json()

    // Check both org and isp independently — org may be an upstream ASN that doesn't name the carrier
    const haystack = `${data.org || ''} ${data.isp || ''}`.toLowerCase()

    let provider = 'Unknown'
    if (haystack.includes('mtn')) provider = 'MTN'
    else if (haystack.includes('glo') || haystack.includes('globacom')) provider = 'Glo'
    else if (haystack.includes('airtel') || haystack.includes('bharti')) provider = 'Airtel'
    else if (haystack.includes('9mobile') || haystack.includes('emts') || haystack.includes('etisalat') || haystack.includes('t2')) provider = '9mobile'

    // navigator.connection for network type hint
    const conn = (navigator as any).connection
    let networkType = 'Unknown'
    if (conn?.effectiveType) {
      const et = conn.effectiveType
      if (et === '4g') networkType = '4G'
      else if (et === '3g') networkType = '3G'
      else if (et === '2g' || et === 'slow-2g') networkType = '2G'
    }
    // fall back to mobile flag if effectiveType wasn't useful
    if (networkType === 'Unknown' && data.mobile === true) networkType = 'Mobile'

    return { provider, networkType }
  } catch {
    return { provider: 'Unknown', networkType: 'Unknown' }
  }
}
