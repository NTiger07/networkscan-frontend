export type Provider = 'MTN' | 'Glo' | 'Airtel' | 'T2' | 'Unknown'
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
  includeBaseline: boolean
  viewMode: 'heatmap' | 'pixels'
}

export const PROVIDERS: Provider[] = ['MTN', 'Glo', 'Airtel', 'T2']

export const PROVIDER_COLORS: Record<string, string> = {
  MTN: '#ffb800',
  Glo: '#00cc44',
  Airtel: '#ff2222',
  T2: '#009966',
  Unknown: '#888888',
}
