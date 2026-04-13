import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { HeatmapPoint } from '../lib/types'

interface PixelGridLayerProps {
  points: HeatmapPoint[]
}

interface GridCell {
  lat: number
  lng: number
  latMin: number
  latMax: number
  lngMin: number
  lngMax: number
  points: HeatmapPoint[]
  avgDownload: number
  avgUpload: number
  avgPing: number
}

// Nigeria bounds
const NIGERIA_LAT_MIN = 4.0
const NIGERIA_LAT_MAX = 13.9
const NIGERIA_LNG_MIN = 2.7
const NIGERIA_LNG_MAX = 14.6

// Cell size by zoom level (in degrees)
const CELL_SIZE_BY_ZOOM: Record<number, number> = {
  5: 1.0,   // Zoomed out: ~110km squares
  6: 0.8,   // ~88km
  7: 0.5,   // ~55km
  8: 0.35,  // ~38km
  9: 0.25,  // ~27km
  10: 0.15, // ~16km
  11: 0.1,  // ~11km
  12: 0.08, // ~8km
  13: 0.05, // ~5km
  14: 0.03, // ~3km
  15: 0.02, // ~2km
  16: 0.01, // ~1km
}

function getColor(value: number): string {
  // Color by download speed (0-100 Mbps scale)
  const normalized = Math.min(1, Math.max(0, value / 100))
  if (normalized > 0.75) return '#00ff88'
  if (normalized > 0.5) return '#00aaff'
  if (normalized > 0.25) return '#0055aa'
  return '#003366'
}

function buildGrid(points: HeatmapPoint[], cellSize: number): Map<string, GridCell> {
  const grid = new Map<string, GridCell>()

  // Initialize grid with dynamic cell size
  for (let lat = NIGERIA_LAT_MIN; lat < NIGERIA_LAT_MAX; lat += cellSize) {
    for (let lng = NIGERIA_LNG_MIN; lng < NIGERIA_LNG_MAX; lng += cellSize) {
      const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
      grid.set(key, {
        lat: lat + cellSize / 2,
        lng: lng + cellSize / 2,
        latMin: lat,
        latMax: lat + cellSize,
        lngMin: lng,
        lngMax: lng + cellSize,
        points: [],
        avgDownload: 0,
        avgUpload: 0,
        avgPing: 0,
      })
    }
  }

  // Assign points to cells
  points.forEach((p) => {
    const cellLat = Math.floor((p.latitude - NIGERIA_LAT_MIN) / cellSize) * cellSize + NIGERIA_LAT_MIN
    const cellLng = Math.floor((p.longitude - NIGERIA_LNG_MIN) / cellSize) * cellSize + NIGERIA_LNG_MIN
    const key = `${cellLat.toFixed(3)},${cellLng.toFixed(3)}`

    const cell = grid.get(key)
    if (cell) {
      cell.points.push(p)
    }
  })

  // Calculate averages for all three metrics
  grid.forEach((cell) => {
    if (cell.points.length === 0) {
      cell.avgDownload = 0
      cell.avgUpload = 0
      cell.avgPing = 0
    } else {
      const downloads = cell.points.map((p) => p.downloadMbps)
      const uploads = cell.points.map((p) => p.uploadMbps)
      const pings = cell.points.map((p) => p.pingMs)

      cell.avgDownload = downloads.reduce((a, b) => a + b, 0) / downloads.length
      cell.avgUpload = uploads.reduce((a, b) => a + b, 0) / uploads.length
      cell.avgPing = pings.reduce((a, b) => a + b, 0) / pings.length
    }
  })

  return grid
}

export default function PixelGridLayer({ points }: PixelGridLayerProps) {
  const map = useMap()
  const layerRef = useRef<L.FeatureGroup | null>(null)
  const [zoom, setZoom] = useState(map.getZoom())

  useEffect(() => {
    const handleZoom = () => {
      setZoom(map.getZoom())
    }

    map.on('zoom', handleZoom)
    return () => {
      map.off('zoom', handleZoom)
    }
  }, [map])

  useEffect(() => {
    // Remove existing layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }

    // Get cell size for current zoom level
    const cellSize = CELL_SIZE_BY_ZOOM[zoom] || CELL_SIZE_BY_ZOOM[5]
    const grid = buildGrid(points, cellSize)
    const group = L.featureGroup()

    grid.forEach((cell) => {
      const bounds = L.latLngBounds(
        [[cell.latMin, cell.lngMin], [cell.latMax, cell.lngMax]]
      )

      const color = cell.points.length === 0 ? '#1a1a2e' : getColor(cell.avgDownload)
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
        const popup = L.popup().setContent(`
          <div class="font-mono text-xs space-y-2 min-w-[160px]">
            <div><span class="text-white/60">Data points:</span> <span class="text-signal-green font-semibold">${cell.points.length}</span></div>
            <div class="border-t border-white/10 pt-2">
              <div><span class="text-white/60">↓ Download:</span> <span class="text-signal-cyan font-semibold">${cell.avgDownload.toFixed(1)} Mbps</span></div>
              <div><span class="text-white/60">↑ Upload:</span> <span class="text-signal-green font-semibold">${cell.avgUpload.toFixed(1)} Mbps</span></div>
              <div><span class="text-white/60">◎ Latency:</span> <span class="text-signal-amber font-semibold">${cell.avgPing.toFixed(0)} ms</span></div>
            </div>
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
  }, [points, map, zoom])

  return null
}
