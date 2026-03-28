import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import NavBar from '../components/NavBar'
import ScanButton from '../components/ScanButton'
import MetricCard from '../components/MetricCard'
import ProgressBar from '../components/ProgressBar'
import { useSpeedTest } from '../hooks/useSpeedTest'
import { detectProvider, submitTest } from '../lib/api'
import type { Provider, NetworkType } from '../lib/types'

interface DetectedInfo {
  provider: string
  networkType: string
}

export default function SpeedTestPage() {
  const navigate = useNavigate()
  const { phase, result, liveDownload, liveUpload, livePing, progress, startTest, reset } = useSpeedTest()
  const [detectedInfo, setDetectedInfo] = useState<DetectedInfo>({ provider: '...', networkType: '...' })
  const [isDetecting, setIsDetecting] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setIsDetecting(true)
    detectProvider().then((info) => {
      setDetectedInfo(info)
      setIsDetecting(false)
    })
  }, [])

  const handleStart = async () => {
    setSubmitted(false)
    await startTest()
  }

  const handleSubmit = async () => {
    if (isSubmitting || submitted) return

    setIsSubmitting(true)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          enableHighAccuracy: true,
        })
      )

      await submitTest({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        provider: detectedInfo.provider,
        networkType: detectedInfo.networkType,
        downloadMbps: result.downloadMbps,
        uploadMbps: result.uploadMbps,
        pingMs: result.pingMs,
        jitterMs: result.jitterMs,
      })

      setSubmitted(true)
      toast.success('Result submitted to map!', {
        description: `${detectedInfo.provider} · ${detectedInfo.networkType} · ${result.downloadMbps} Mbps ↓`,
        action: {
          label: 'View Map',
          onClick: () => navigate('/map'),
        },
      })
    } catch (err: any) {
      if (err?.code === 1) {
        toast.error('Location access denied', {
          description: 'Please allow location access to contribute to the map.',
        })
      } else {
        toast.error('Submission failed', {
          description: 'Could not reach the server. Try again later.',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isRunning = ['detecting', 'ping', 'download', 'upload'].includes(phase)
  const isDone = phase === 'done'

  return (
    <div className="min-h-screen bg-navy-950 grid-bg flex flex-col">
      <NavBar />

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-signal-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-signal-cyan/3 rounded-full blur-3xl" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-8 relative">

        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-white mb-2 tracking-tight">
            Network Intelligence
          </h1>
          <p className="text-white/40 font-body text-sm md:text-base max-w-sm mx-auto">
            Measure your mobile network speed and contribute to Nigeria's crowdsourced signal map.
          </p>
        </div>

        {/* Detected info badge */}
        <div className={`flex items-center gap-3 mb-10 px-4 py-2 rounded-full border transition-all duration-500 ${
          isDetecting
            ? 'border-white/10 bg-white/3'
            : 'border-signal-green/20 bg-signal-green/5'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isDetecting ? 'bg-white/20 animate-pulse' : 'bg-signal-green'}`} />
          <span className="font-mono text-xs text-white/60">
            {isDetecting ? 'Detecting carrier...' : (
              <>
                <span className="text-signal-green font-semibold">{detectedInfo.provider}</span>
                <span className="text-white/30 mx-2">·</span>
                <span className="text-signal-cyan">{detectedInfo.networkType}</span>
              </>
            )}
          </span>
          {!isDetecting && detectedInfo.provider === 'Unknown' && (
            <span className="text-white/30 text-xs font-mono">(not on mobile data?)</span>
          )}
        </div>

        {/* Main scan button */}
        <div className="mb-12">
          <ScanButton phase={phase} onClick={phase === 'idle' || phase === 'done' || phase === 'error' ? handleStart : () => {}} />
        </div>

        {/* Progress bar - shown during test */}
        {isRunning && (
          <div className="w-full max-w-sm mb-8 animate-fade-in">
            <ProgressBar progress={progress} phase={phase} />
          </div>
        )}

        {/* Live metrics grid */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl transition-opacity duration-500 ${
          phase === 'idle' ? 'opacity-0' : 'opacity-100'
        }`}>
          <MetricCard
            label="Download"
            value={liveDownload}
            unit="Mbps"
            color="cyan"
            active={phase === 'download'}
            decimals={1}
          />
          <MetricCard
            label="Upload"
            value={liveUpload}
            unit="Mbps"
            color="green"
            active={phase === 'upload'}
            decimals={1}
          />
          <MetricCard
            label="Ping"
            value={livePing}
            unit="ms"
            color="amber"
            active={phase === 'ping'}
            decimals={0}
          />
          <MetricCard
            label="Jitter"
            value={result.jitterMs}
            unit="ms"
            color={result.jitterMs > 20 ? 'red' : 'green'}
            active={false}
            decimals={0}
          />
        </div>

        {/* Post-test actions */}
        {isDone && (
          <div className="mt-8 flex flex-col items-center gap-4 animate-slide-up">
            {/* Result summary */}
            <div className="flex items-center gap-4 px-5 py-3 rounded-xl bg-navy-800 border border-white/5">
              <div className="text-center">
                <div className="text-signal-cyan font-mono font-bold text-xl">{result.downloadMbps}</div>
                <div className="text-white/30 text-xs font-mono">↓ Mbps</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-signal-green font-mono font-bold text-xl">{result.uploadMbps}</div>
                <div className="text-white/30 text-xs font-mono">↑ Mbps</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-signal-amber font-mono font-bold text-xl">{result.pingMs}</div>
                <div className="text-white/30 text-xs font-mono">ping ms</div>
              </div>
            </div>

            {/* Submit button */}
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-signal-green text-navy-950 font-mono font-semibold text-sm hover:brightness-110 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,255,136,0.3)]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                    Locating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    Submit to Map
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-signal-green/10 border border-signal-green/30 text-signal-green font-mono text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Submitted! View on map →
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {phase === 'error' && (
          <div className="mt-6 px-5 py-3 rounded-xl bg-signal-red/10 border border-signal-red/30 text-signal-red font-mono text-sm animate-fade-in">
            Test failed. Check your connection and retry.
          </div>
        )}

        {/* Footer hint */}
        {phase === 'idle' && (
          <p className="mt-12 text-white/20 font-mono text-xs animate-fade-in">
            Your IP carrier is auto-detected · no account needed
          </p>
        )}
      </main>
    </div>
  )
}
