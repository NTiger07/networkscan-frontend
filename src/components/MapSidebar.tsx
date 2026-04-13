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
  const toggleProvider = (provider: string) => {
    // Single-select: if clicking the same one, deselect; otherwise select only this one
    const newProviders = filters.providers.includes(provider) ? [] : [provider]
    onChange({ ...filters, providers: newProviders })
  }

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

        {/* Providers */}
        <div>
          <label className="block text-xs font-mono text-white/30 uppercase tracking-widest mb-2">Provider</label>
          <div className="flex flex-wrap gap-1.5">
            {PROVIDERS.map((p) => (
              <button
                key={p}
                onClick={() => toggleProvider(p)}
                className={CHIP(filters.providers.includes(p))}
              >
                {p}
                {p === 'T2' && <span className="text-xs opacity-75 ml-1">(formerly 9mobile)</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
