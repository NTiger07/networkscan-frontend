import type { MapFilters } from '../lib/types'
import { PROVIDERS } from '../lib/types'

interface MapSidebarProps {
  filters: MapFilters
  onChange: (filters: MapFilters) => void
  totalPoints: number
  liveCount: number
}

const CHIP = (active: boolean) =>
  `px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer select-none transition-all duration-150 border ${
    active
      ? 'bg-signal-green/15 border-signal-green/50 text-signal-green'
      : 'bg-white/3 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
  }`

export default function MapSidebar({ filters, onChange, totalPoints, liveCount }: MapSidebarProps) {
  const toggle = (key: keyof MapFilters, value: string) => {
    if (key === 'providers') {
      const cur = filters.providers as string[]
      const next = cur.includes(value) ? cur.filter((p) => p !== value) : [...cur, value]
      onChange({ ...filters, providers: next })
    } else {
      onChange({ ...filters, [key]: filters[key as keyof MapFilters] === value ? '' : value })
    }
  }

  const setMetric = (metric: MapFilters['heatMetric']) => onChange({ ...filters, heatMetric: metric })
  const setView = (view: MapFilters['viewMode']) => onChange({ ...filters, viewMode: view })

  return (
    <aside className="absolute top-0 left-0 h-full w-64 bg-navy-900/95 backdrop-blur-md border-r border-white/5 z-[400] flex flex-col overflow-y-auto">

      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-1">
          <span className="font-display font-semibold text-sm text-white">Filters</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-signal-green animate-pulse" />
            <span className="font-mono text-xs text-signal-green">{liveCount} live</span>
          </div>
        </div>
        <div className="font-mono text-xs text-white/30">{totalPoints.toLocaleString()} data points</div>
      </div>

      <div className="flex-1 p-4 space-y-5">

        {/* View Mode */}
        <div>
          <label className="block text-xs font-mono text-white/30 uppercase tracking-widest mb-2">View</label>
          <div className="flex flex-col gap-1.5">
            <button className={CHIP(filters.viewMode === 'pixels')} onClick={() => setView('pixels')}>
              Pixel Map
            </button>
            <button className={CHIP(filters.viewMode === 'heatmap')} onClick={() => setView('heatmap')}>
              Heatmap
            </button>
          </div>
        </div>

        {/* Heat Metric (only for heatmap & pixels) */}
        {(filters.viewMode === 'heatmap' || filters.viewMode === 'pixels') && (
          <div>
            <label className="block text-xs font-mono text-white/30 uppercase tracking-widest mb-2">Metric</label>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  { key: 'downloadMbps', label: '↓ Download', color: 'text-signal-cyan' },
                  { key: 'uploadMbps', label: '↑ Upload', color: 'text-signal-green' },
                  { key: 'pingMs', label: '◎ Ping (lower = better)', color: 'text-signal-amber' },
                ] as const
              ).map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setMetric(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all duration-150 border text-left ${
                    filters.heatMetric === key
                      ? `bg-white/5 border-white/20 ${color}`
                      : 'bg-transparent border-transparent text-white/40 hover:text-white/60 hover:bg-white/3'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${filters.heatMetric === key ? 'bg-current' : 'bg-white/20'}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Providers */}
        <div>
          <label className="block text-xs font-mono text-white/30 uppercase tracking-widest mb-2">Provider</label>
          <div className="flex flex-wrap gap-1.5">
            {PROVIDERS.map((p) => (
              <button
                key={p}
                onClick={() => toggle('providers', p)}
                className={CHIP(filters.providers.includes(p))}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Network Type */}
        <div>
          <label className="block text-xs font-mono text-white/30 uppercase tracking-widest mb-2">Network</label>
          <div className="flex gap-2">
            {['4G', '5G'].map((n) => (
              <button key={n} onClick={() => toggle('networkType', n)} className={CHIP(filters.networkType === n)}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Time Period */}
        <div>
          <label className="block text-xs font-mono text-white/30 uppercase tracking-widest mb-2">Period</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { v: '24h', label: '24h' },
              { v: '7d', label: '7 days' },
              { v: 'all', label: 'All time' },
            ].map(({ v, label }) => (
              <button key={v} onClick={() => toggle('period', v)} className={CHIP(filters.period === v)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Time of Day */}
        <div>
          <label className="block text-xs font-mono text-white/30 uppercase tracking-widest mb-2">Time of day</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { v: 'morning', label: '☀ Morning' },
              { v: 'afternoon', label: '⛅ Afternoon' },
              { v: 'evening', label: '🌆 Evening' },
              { v: 'night', label: '🌙 Night' },
            ].map(({ v, label }) => (
              <button key={v} onClick={() => toggle('timeOfDay', v)} className={CHIP(filters.timeOfDay === v)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Include Baseline */}
        <div>
          <label className="block text-xs font-mono text-white/30 uppercase tracking-widest mb-2">Data</label>
          <button
            onClick={() => onChange({ ...filters, includeBaseline: !filters.includeBaseline })}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
              filters.includeBaseline
                ? 'bg-signal-green/15 border-signal-green/50 text-signal-green'
                : 'bg-white/3 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${filters.includeBaseline ? 'bg-signal-green' : 'bg-white/20'}`} />
            Include Ookla baseline
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Reset */}
        <button
          onClick={() => onChange({
            providers: [],
            networkType: '',
            period: 'all',
            timeOfDay: '',
            includeBaseline: true,
            heatMetric: 'downloadMbps',
            viewMode: 'pixels',
          })}
          className="w-full py-2 rounded-lg text-xs font-mono text-white/30 hover:text-white/60 border border-white/5 hover:border-white/15 transition-all"
        >
          Reset filters
        </button>
      </div>
    </aside>
  )
}
