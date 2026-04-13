import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { HeatmapPoint, MapFilters } from '../lib/types'

interface PixelGridLayerProps {
  points: HeatmapPoint[]
  metric: MapFilters['heatMetric']
}

interface GridCell {
  lat: number
  lng: number
  latMin: number
  latMax: number
  lngMin: number
  lngMax: number
  points: HeatmapPoint[]
  avg: number
}

// Nigeria bounds
const NIGERIA_LAT_MIN = 4.0
const NIGERIA_LAT_MAX = 13.9
const NIGERIA_LNG_MIN = 2.7
const NIGERIA_LNG_MAX = 14.6

// Grid size in degrees (larger = fewer, bigger cells)
const CELL_SIZE = 0.4 // ~44km squares

function getColor(value: number, metric: MapFilters['heatMetric']): string {
  if (metric === 'pingMs') {
    // Lower is better, invert scale (0-300ms)
    const normalized = Math.min(1, Math.max(0, 1 - value / 300))
    if (normalized > 0.75) return '#00ff88'
    if (normalized > 0.5) return '#00aaff'
    if (normalized > 0.25) return '#0055aa'
    return '#ff2222'
  }
  if (metric === 'downloadMbps') {
    // 0-100 Mbps scale
    const normalized = Math.min(1, Math.max(0, value / 100))
    if (normalized > 0.75) return '#00ff88'
    if (normalized > 0.5) return '#00aaff'
    if (normalized > 0.25) return '#0055aa'
    return '#003366'
  }
  if (metric === 'uploadMbps') {
    // 0-50 Mbps scale
    const normalized = Math.min(1, Math.max(0, value / 50))
    if (normalized > 0.75) return '#00ff88'
    if (normalized > 0.5) return '#00aaff'
    if (normalized > 0.25) return '#0055aa'
    return '#003366'
  }
  return '#666666'
}

function buildGrid(points: HeatmapPoint[], metric: MapFilters['heatMetric']): Map<string, GridCell> {
  const grid = new Map<string, GridCell>()

  // Initialize grid
  for (let lat = NIGERIA_LAT_MIN; lat < NIGERIA_LAT_MAX; lat += CELL_SIZE) {
    for (let lng = NIGERIA_LNG_MIN; lng < NIGERIA_LNG_MAX; lng += CELL_SIZE) {
      const key = `${lat.toFixed(1)},${lng.toFixed(1)}`
      grid.set(key, {
        lat: lat + CELL_SIZE / 2,
        lng: lng + CELL_SIZE / 2,
        latMin: lat,
        latMax: lat + CELL_SIZE,
        lngMin: lng,
        lngMax: lng + CELL_SIZE,
        points: [],
        avg: 0,
      })
    }
  }

  // Assign points to cells
  points.forEach((p) => {
    const cellLat = Math.floor((p.latitude - NIGERIA_LAT_MIN) / CELL_SIZE) * CELL_SIZE + NIGERIA_LAT_MIN
    const cellLng = Math.floor((p.longitude - NIGERIA_LNG_MIN) / CELL_SIZE) * CELL_SIZE + NIGERIA_LNG_MIN
    const key = `${cellLat.toFixed(1)},${cellLng.toFixed(1)}`

    const cell = grid.get(key)
    if (cell) {
      cell.points.push(p)
    }
  })

  // Calculate averages
  grid.forEach((cell) => {
    if (cell.points.length === 0) {
      cell.avg = 0
    } else {
      const sum = cell.points.reduce((acc, p) => {
        if (metric === 'pingMs') return acc + p.pingMs
        if (metric === 'downloadMbps') return acc + p.downloadMbps
        if (metric === 'uploadMbps') return acc + p.uploadMbps
        return acc
      }, 0)
      cell.avg = sum / cell.points.length
    }
  })

  return grid
}

export default function PixelGridLayer({ points, metric }: PixelGridLayerProps) {
  const map = useMap()
  const layerRef = useRef<L.FeatureGroup | null>(null)

  useEffect(() => {
    // Remove existing layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }

    const grid = buildGrid(points, metric)
    const group = L.featureGroup()

    grid.forEach((cell) => {
      const bounds = L.latLngBounds(
        [[cell.latMin, cell.lngMin], [cell.latMax, cell.lngMax]]
      )

      const color = cell.points.length === 0 ? '#1a1a2e' : getColor(cell.avg, metric)
      const opacity = cell.points.length === 0 ? 0.2 : 0.7

      const rect = L.rectangle(bounds, {
        color: color,
        weight: 1,
        opacity: opacity,
        fillColor: color,
        fillOpacity: opacity,
        interactive: cell.points.length > 0,
      })

      if (cell.points.length > 0) {
        const metricVal =
          metric === 'pingMs'
            ? cell.avg.toFixed(0) + ' ms'
            : cell.avg.toFixed(1) + ' Mbps'

        const popup = L.popup().setContent(`
          <div class="font-mono text-xs space-y-1 min-w-[140px]">
            <div><span class="text-white/60">Data points:</span> <span class="text-signal-green font-semibold">${cell.points.length}</span></div>
            <div><span class="text-white/60">${metric === 'pingMs' ? '◎ Ping' : metric === 'downloadMbps' ? '↓ Download' : '↑ Upload'}:</span> <span class="text-signal-cyan font-semibold">${metricVal}</span></div>
          </div>
        `)

        rect.bindPopup(popup)
      }

      group.addLayer(rect)
    })

    group.addTo(map)
    layerRef.current = group

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
      }
    }
  }, [points, metric, map])

  return null
}
