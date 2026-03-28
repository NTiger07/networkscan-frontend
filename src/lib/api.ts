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
  if (filters.networkType) params.set('networkType', filters.networkType)
  if (filters.period) params.set('period', filters.period)
  if (filters.timeOfDay) params.set('timeOfDay', filters.timeOfDay)

  const res = await fetch(`${BASE}/tests/heatmap?${params}`)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchStats(filters: Partial<MapFilters>) {
  const params = new URLSearchParams()
  if (filters.providers?.length) params.set('providers', filters.providers.join(','))
  if (filters.networkType) params.set('networkType', filters.networkType)
  if (filters.period) params.set('period', filters.period)

  const res = await fetch(`${BASE}/tests/stats?${params}`)
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`)
  return res.json()
}

export async function detectProvider(): Promise<{ provider: string; networkType: string }> {
  try {
    const res = await fetch('https://ip-api.com/json/?fields=org,mobile,isp', {
      signal: AbortSignal.timeout(4000),
    })
    const data = await res.json()
    const org: string = (data.org || data.isp || '').toLowerCase()

    let provider = 'Unknown'
    if (org.includes('mtn')) provider = 'MTN'
    else if (org.includes('glo') || org.includes('globacom')) provider = 'Glo'
    else if (org.includes('airtel') || org.includes('bharti')) provider = 'Airtel'
    else if (org.includes('9mobile') || org.includes('emts') || org.includes('etisalat')) provider = '9mobile'

    // navigator.connection for network type hint
    const conn = (navigator as any).connection
    let networkType = 'Unknown'
    if (conn?.effectiveType) {
      const et = conn.effectiveType
      if (et === '4g') networkType = '4G'
      else if (et === '5g') networkType = '5G'
    }

    return { provider, networkType }
  } catch {
    return { provider: 'Unknown', networkType: 'Unknown' }
  }
}
