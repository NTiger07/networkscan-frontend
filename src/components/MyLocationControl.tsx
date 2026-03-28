import { useMap } from 'react-leaflet'
import { useState } from 'react'

export default function MyLocationControl() {
  const map = useMap()
  const [loading, setLoading] = useState(false)

  const handleClick = () => {
    if (loading) return
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 13, { duration: 1.5 })
        setLoading(false)
      },
      () => {
        setLoading(false)
      },
      { timeout: 6000 }
    )
  }

  return (
    <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '32px', marginRight: '12px' }}>
      <div className="leaflet-control">
        <button
          onClick={handleClick}
          disabled={loading}
          title="Go to my location"
          style={{
            width: 36,
            height: 36,
            background: '#091425',
            border: '1px solid rgba(0,255,136,0.3)',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: loading ? 'rgba(0,255,136,0.4)' : '#00ff88',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              <circle cx="12" cy="12" r="8" strokeOpacity="0.3"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
