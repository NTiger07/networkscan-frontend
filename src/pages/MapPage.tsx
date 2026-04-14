import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer } from "react-leaflet";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";

import MapSidebar from "../components/MapSidebar";
import HeatmapLayer from "../components/HeatmapLayer";
import PixelGridLayer from "../components/PixelGridLayer";
import MyLocationControl from "../components/MyLocationControl";
import LocationPicker from "../components/LocationPicker";
import StatsBar from "../components/StatsBar";
import { useSocket } from "../hooks/useSocket";
import { fetchHeatmapData, fetchStats } from "../lib/api";
import type { HeatmapPoint, MapFilters, SpeedTestRecord } from "../lib/types";

const DEFAULT_FILTERS: MapFilters = {
  providers: ["MTN"],
  includeBaseline: true,
  viewMode: "pixels",
};

// Nigeria center
const NIGERIA_CENTER: [number, number] = [9.082, 8.6753];
const NIGERIA_ZOOM = 6;

export default function MapPage() {
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [points, setPoints] = useState<HeatmapPoint[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadData = useCallback(async (f: MapFilters) => {
    setLoading(true);
    try {
      const [pts, st] = await Promise.all([fetchHeatmapData(f), fetchStats(f)]);
      setPoints(pts);
      setStats(st);
    } catch (err) {
      toast.error("Failed to load map data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(filters);
  }, [filters, loadData]);

  const handleNewTest = useCallback((test: SpeedTestRecord) => {
    setLiveCount((c) => c + 1);

    const newPoint: HeatmapPoint = {
      latitude: test.latitude,
      longitude: test.longitude,
      downloadMbps: test.downloadMbps,
      uploadMbps: test.uploadMbps,
      pingMs: test.pingMs,
      provider: test.provider,
      networkType: test.networkType,
      createdAt: test.createdAt,
      source: "crowdsourced",
    };

    // Only add if it matches current filters
    const f = filtersRef.current;
    const providerOk =
      f.providers.length === 0 || f.providers.includes(test.provider);

    if (providerOk) {
      setPoints((prev) => [newPoint, ...prev]);
      toast.success(`New test: ${test.provider} · ${test.networkType}`, {
        description: `↓ ${test.downloadMbps} Mbps · ↑ ${test.uploadMbps} Mbps · ${test.pingMs}ms`,
      });
    }
  }, []);

  useSocket({ onNewTest: handleNewTest });

  return (
    <div className="h-screen w-screen flex flex-col bg-navy-950 overflow-hidden">
      {/* Top bar */}
      <header className="shrink-0 flex items-center justify-between bg-navy-900/95 backdrop-blur-md border-b border-white/5 z-[500] relative">
        <div className="flex items-center gap-0">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-3 text-white/40 hover:text-white hover:bg-white/5 transition-all border-r border-white/5"
            title="Toggle sidebar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 px-4">
            <span className="font-display font-semibold text-sm text-white tracking-tight">
              Network<span className="text-signal-green">Scan</span>
              <span className="text-white/30">NG</span>
            </span>
          </Link>
        </div>

        {/* Stats bar */}
        <div className="flex-1 border-l border-white/5">
          <StatsBar stats={stats} loading={loading} />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 px-3 border-l border-white/5">
          <button
            onClick={() => loadData(filters)}
            className="p-2 text-white/40 hover:text-signal-green hover:bg-signal-green/5 rounded-lg transition-all"
            title="Refresh data"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={loading ? "animate-spin" : ""}
            >
              <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </button>
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-signal-green text-navy-950 font-mono text-xs font-semibold hover:brightness-110 transition-all"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            New Scan
          </Link>
        </div>
      </header>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Sidebar */}
        <div
          className={`absolute top-0 left-0 h-full transition-transform duration-300 z-[450] ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <MapSidebar
            filters={filters}
            onChange={setFilters}
            totalPoints={points.length}
            liveCount={liveCount}
          />
        </div>

        {/* Map container */}
        <div
          className={`absolute inset-0 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}
        >
          <MapContainer
            center={NIGERIA_CENTER}
            zoom={NIGERIA_ZOOM}
            maxBounds={[
              [4.0, 2.7],
              [13.9, 14.6],
            ]}
            minZoom={5}
            style={{ width: "100%", height: "100%" }}
            zoomControl={true}
            attributionControl={true}
          >
            {/* Dark tile layer */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
              maxZoom={19}
            />

            {/* Data layers */}
            {filters.viewMode === "heatmap" && (
              <HeatmapLayer points={points} metric="downloadMbps" />
            )}
            {filters.viewMode === "pixels" && (
              <PixelGridLayer points={points} />
            )}

            {/* My location control */}
            <MyLocationControl />

            {/* Location picker */}
            <LocationPicker />
          </MapContainer>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-navy-950/50 pointer-events-none z-[300]">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-navy-900/90 border border-white/10">
                <div className="w-4 h-4 border-2 border-signal-green border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-xs text-white/60">
                  Loading map data...
                </span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && points.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[300]">
              <div className="text-center px-6 py-5 rounded-xl bg-navy-900/90 border border-white/10 max-w-xs">
                <div className="text-3xl mb-3">📡</div>
                <div className="font-display font-semibold text-white mb-1">
                  No data yet
                </div>
                <div className="font-mono text-xs text-white/40 mb-4">
                  Be the first to run a scan and submit your results!
                </div>
                <Link
                  to="/"
                  className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-signal-green text-navy-950 font-mono text-xs font-semibold hover:brightness-110 transition-all"
                >
                  Start Scanning
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
