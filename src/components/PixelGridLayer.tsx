import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { HeatmapPoint } from "../lib/types";

interface PixelGridLayerProps {
  points: HeatmapPoint[];
}

// Base pixel size at zoom 10 (in degrees)
const PIXEL_SIZE_ZOOM_10 = 0.009;

// Calculate pixel size based on zoom level
function getPixelSize(zoom: number): number {
  // Halve the pixel size for every zoom level above 10
  return PIXEL_SIZE_ZOOM_10 / Math.pow(2, zoom - 10);
}

function getColor(value: number): string {
  // Color by download speed (0-100 Mbps scale)
  const normalized = Math.min(1, Math.max(0, value / 100));
  if (normalized > 0.75) return "#00ff88";
  if (normalized > 0.5) return "#00aaff";
  if (normalized > 0.25) return "#0055aa";
  return "#003366";
}

export default function PixelGridLayer({ points }: PixelGridLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.FeatureGroup | null>(null);
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoom = () => {
      setZoom(map.getZoom());
    };

    map.on("zoom", handleZoom);
    return () => {
      map.off("zoom", handleZoom);
    };
  }, [map]);

  useEffect(() => {
    // Remove existing layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    const pixelSize = getPixelSize(zoom);
    const group = L.featureGroup();

    // Create one pixel per data point
    points.forEach((point) => {
      const bounds = L.latLngBounds([
        [point.latitude, point.longitude],
        [point.latitude + pixelSize, point.longitude + pixelSize],
      ]);

      const color = getColor(point.downloadMbps);

      const rect = L.rectangle(bounds, {
        color: color,
        weight: 1,
        opacity: 0.8,
        fillColor: color,
        fillOpacity: 0.8,
        interactive: true,
      });

      const popup = L.popup().setContent(`
        <div class="font-mono text-xs space-y-2 min-w-[160px]">
          <div class="text-white/80">
            <strong>${point.provider}</strong>
          </div>
          <div class="border-t border-white/10 pt-2">
            <div><span class="text-white/60">↓ Download:</span> <span class="text-signal-cyan font-semibold">${point.downloadMbps.toFixed(1)} Mbps</span></div>
            <div><span class="text-white/60">↑ Upload:</span> <span class="text-signal-green font-semibold">${point.uploadMbps.toFixed(1)} Mbps</span></div>
            <div><span class="text-white/60">◎ Latency:</span> <span class="text-signal-amber font-semibold">${point.pingMs.toFixed(0)} ms</span></div>
          </div>
          ${point.createdAt ? `<div class="text-white/40 text-xs pt-2 border-t border-white/10">${new Date(point.createdAt).toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })}</div>` : ""}
        </div>
      `);

      rect.bindPopup(popup);
      group.addLayer(rect);
    });

    group.addTo(map);
    layerRef.current = group;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [points, map, zoom]);

  return null;
}
