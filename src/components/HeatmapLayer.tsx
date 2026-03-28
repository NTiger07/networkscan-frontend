import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import type { HeatmapPoint, MapFilters } from '../lib/types'

interface HeatmapLayerProps {
  points: HeatmapPoint[]
  metric: MapFilters['heatMetric']
}

// Normalize value to 0–1 for heatmap intensity
function normalizeValue(value: number, metric: MapFilters['heatMetric']): number {
  if (metric === 'pingMs') {
    // Lower ping = better = more intense heat
    // clamp 0–300ms, invert
    const clamped = Math.min(300, Math.max(0, value))
    return 1 - clamped / 300
  }
  if (metric === 'downloadMbps') {
    // 0–100 Mbps scale
    return Math.min(1, value / 100)
  }
  if (metric === 'uploadMbps') {
    // 0–50 Mbps scale
    return Math.min(1, value / 50)
  }
  return 0
}

export default function HeatmapLayer({ points, metric }: HeatmapLayerProps) {
  const map = useMap()
  const layerRef = useRef<any>(null)

  useEffect(() => {
    // Remove existing layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }

    if (points.length === 0) return

    const heatData = points.map((p) => [
      p.latitude,
      p.longitude,
      normalizeValue(p[metric], metric),
    ])

    // @ts-ignore – leaflet.heat augments L
    const heat = L.heatLayer(heatData, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: '#001a3a',
        0.2: '#003366',
        0.4: '#0055aa',
        0.6: '#00aaff',
        0.8: '#00ff88',
        1.0: '#ffffff',
      },
    })

    heat.addTo(map)
    layerRef.current = heat

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [points, metric, map])

  return null
}
