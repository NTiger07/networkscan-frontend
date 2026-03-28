interface Stats {
  total: number
  averages: {
    downloadMbps: number | null
    uploadMbps: number | null
    pingMs: number | null
  }
  byProvider: Array<{
    provider: string
    _avg: { downloadMbps: number | null }
    _count: { id: number }
  }>
}

interface StatsBarProps {
  stats: Stats | null
  loading: boolean
}

export default function StatsBar({ stats, loading }: StatsBarProps) {
  const bestProvider = stats?.byProvider?.[0]

  if (loading || !stats) {
    return (
      <div className="flex items-center gap-4 px-4 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-24 bg-white/5 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-5 px-4 py-2 overflow-x-auto">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-white/30 text-xs font-mono">tests</span>
        <span className="text-white font-mono font-semibold text-xs">{stats.total.toLocaleString()}</span>
      </div>
      {stats.averages.downloadMbps != null && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white/30 text-xs font-mono">avg ↓</span>
          <span className="text-signal-cyan font-mono font-semibold text-xs">
            {stats.averages.downloadMbps.toFixed(1)} Mbps
          </span>
        </div>
      )}
      {stats.averages.pingMs != null && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white/30 text-xs font-mono">avg ping</span>
          <span className="text-signal-amber font-mono font-semibold text-xs">
            {stats.averages.pingMs.toFixed(0)} ms
          </span>
        </div>
      )}
      {bestProvider && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white/30 text-xs font-mono">fastest</span>
          <span className="text-signal-green font-mono font-semibold text-xs">
            {bestProvider.provider} ({bestProvider._avg.downloadMbps?.toFixed(1)} Mbps)
          </span>
        </div>
      )}
    </div>
  )
}
