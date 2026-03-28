import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { HeatmapPoint } from '../lib/types'
import { PROVIDER_COLORS } from '../lib/types'

interface MarkersLayerProps {
  points: HeatmapPoint[]
}

function makeIcon(color: string) {
  return L.divIcon({
    html: `<div style="
      width:10px;height:10px;
      border-radius:50%;
      background:${color};
      border:2px solid rgba(255,255,255,0.3);
      box-shadow:0 0 6px ${color}80;
    "></div>`,
    className: '',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function MarkersLayer({ points }: MarkersLayerProps) {
  // Limit markers to 2000 for performance
  const visible = points.slice(0, 2000)

  return (
    <>
      {visible.map((p, i) => {
        const color = PROVIDER_COLORS[p.provider] || PROVIDER_COLORS.Unknown
        const icon = makeIcon(color)

        return (
          <Marker key={`${p.latitude}-${p.longitude}-${i}`} position={[p.latitude, p.longitude]} icon={icon}>
            <Popup>
              <div className="font-mono text-xs space-y-1.5 min-w-[160px]">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="px-2 py-0.5 rounded text-navy-950 font-semibold text-xs"
                    style={{ background: color }}
                  >
                    {p.provider}
                  </span>
                  <span className="text-white/40 text-xs">{p.networkType}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <span className="text-white/40">↓ Down</span>
                  <span className="text-signal-cyan font-semibold">{p.downloadMbps.toFixed(1)} Mbps</span>
                  <span className="text-white/40">↑ Up</span>
                  <span className="text-signal-green font-semibold">{p.uploadMbps.toFixed(1)} Mbps</span>
                  <span className="text-white/40">◎ Ping</span>
                  <span className="text-signal-amber font-semibold">{p.pingMs.toFixed(0)} ms</span>
                </div>
                <div className="pt-1 border-t border-white/10 text-white/30 text-xs">
                  {formatTime(p.createdAt)}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}
