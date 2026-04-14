import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Define icon outside component to prevent recreation on every render
const pinpointIcon = L.icon({
  iconUrl: "/icons/location.svg",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function LocationPicker() {
  const map = useMap();
  const [center, setCenter] = useState<[number, number]>([9.082, 8.6753]); // Default to Nigeria center
  const markerRef = useRef<L.Marker | null>(null);
  const initializedRef = useRef(false);

  // Initialize center once map is ready
  useEffect(() => {
    if (!initializedRef.current) {
      const mapCenter = map.getCenter();
      if (mapCenter) {
        setCenter([mapCenter.lat, mapCenter.lng]);
        initializedRef.current = true;
      }
    }
  }, [map]);

  // Create/update pinpoint marker at center
  useEffect(() => {
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    const marker = L.marker([center[0], center[1]], {
      icon: pinpointIcon,
      interactive: false,
    });

    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      if (markerRef.current && map.hasLayer(markerRef.current)) {
        map.removeLayer(markerRef.current);
      }
    };
  }, [center, map]);

  // Update center on map move
  useEffect(() => {
    const handleMove = () => {
      const newCenter = map.getCenter();
      setCenter([newCenter.lat, newCenter.lng]);
    };

    map.on("move", handleMove);
    return () => {
      map.off("move", handleMove);
    };
  }, [map]);

  const handleCopyCoords = () => {
    if (center && center[0] !== undefined && center[1] !== undefined) {
      const coordString = `${center[0].toFixed(6)}, ${center[1].toFixed(6)}`;
      navigator.clipboard.writeText(coordString);
    }
  };

  return (
    <div className="absolute bottom-6 left-6 bg-navy-900/95 backdrop-blur-md border border-white/10 rounded-lg p-3 z-[300]">
      <div className="font-mono text-xs space-y-2">
        <div className="text-white/40">Center Location</div>
        <div
          onClick={handleCopyCoords}
          className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
          title="Click to copy coordinates"
        >
          <div className="flex-1">
            <div className="text-white/60 text-xs">Latitude</div>
            <div className="text-signal-cyan font-semibold">
              {center && center[0] ? center[0].toFixed(6) : "0.000000"}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex-1">
            <div className="text-white/60 text-xs">Longitude</div>
            <div className="text-signal-green font-semibold">
              {center && center[1] ? center[1].toFixed(6) : "0.000000"}
            </div>
          </div>
        </div>
        <div className="text-white/30 text-xs leading-relaxed">
          📍 Center pinpoint shows current map location
        </div>
      </div>
    </div>
  );
}
