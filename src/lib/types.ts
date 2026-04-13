export type Provider = 'MTN' | 'Glo' | 'Airtel' | '9mobile' | 'Unknown'
export type NetworkType = '4G' | '5G' | 'Unknown'

export interface SpeedTestResult {
  downloadMbps: number
  uploadMbps: number
  pingMs: number
  jitterMs: number
}

export interface SpeedTestRecord extends SpeedTestResult {
  id: string
  createdAt: string
  provider: Provider
  networkType: NetworkType
  latitude: number
  longitude: number
}

export type TestPhase = 'idle' | 'detecting' | 'ping' | 'download' | 'upload' | 'done' | 'error'

export interface HeatmapPoint {
  latitude: number
  longitude: number
  downloadMbps: number
  uploadMbps: number
  pingMs: number
  provider: string | null
  networkType: string | null
  createdAt: string | null
  source: 'baseline' | 'crowdsourced'
}

export interface MapFilters {
  providers: string[]
  networkType: string  // '' | '4G' | '5G'
  period: string       // '24h' | '7d' | 'all'
  timeOfDay: string    // '' | 'morning' | 'afternoon' | 'evening' | 'night'
  includeBaseline: boolean
  heatMetric: 'downloadMbps' | 'uploadMbps' | 'pingMs'
  viewMode: 'heatmap' | 'pixels'
}

export const PROVIDERS: Provider[] = ['MTN', 'Glo', 'Airtel', '9mobile']

export const PROVIDER_COLORS: Record<string, string> = {
  MTN: '#ffb800',
  Glo: '#00cc44',
  Airtel: '#ff2222',
  '9mobile': '#009966',
  Unknown: '#888888',
}
