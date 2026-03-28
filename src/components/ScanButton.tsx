import type { TestPhase } from '../lib/types'

interface ScanButtonProps {
  phase: TestPhase
  onClick: () => void
}

const PHASE_LABELS: Record<TestPhase, string> = {
  idle: 'Start Scanning',
  detecting: 'Detecting...',
  ping: 'Testing Ping',
  download: 'Download Test',
  upload: 'Upload Test',
  done: 'Scan Again',
  error: 'Retry Scan',
}

export default function ScanButton({ phase, onClick }: ScanButtonProps) {
  const isRunning = ['detecting', 'ping', 'download', 'upload'].includes(phase)
  const label = PHASE_LABELS[phase]

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse rings */}
      {isRunning && (
        <>
          <div className="absolute w-48 h-48 rounded-full border border-signal-green/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute w-40 h-40 rounded-full border border-signal-green/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
          <div className="absolute w-32 h-32 rounded-full border border-signal-green/40 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.8s' }} />
        </>
      )}

      {/* Idle state rings */}
      {phase === 'idle' && (
        <>
          <div className="absolute w-44 h-44 rounded-full border border-signal-green/10 hover:border-signal-green/20 transition-colors" />
          <div className="absolute w-36 h-36 rounded-full border border-signal-green/15 hover:border-signal-green/25 transition-colors" />
        </>
      )}

      {/* Done state */}
      {phase === 'done' && (
        <div className="absolute w-44 h-44 rounded-full border border-signal-green/30" />
      )}

      {/* Main button */}
      <button
        onClick={onClick}
        disabled={isRunning}
        className={`relative w-28 h-28 rounded-full font-mono font-semibold text-sm transition-all duration-300 select-none
          ${isRunning
            ? 'bg-signal-green/20 border-2 border-signal-green/60 text-signal-green cursor-not-allowed'
            : phase === 'done'
            ? 'bg-signal-green text-navy-950 hover:brightness-110 border-2 border-signal-green hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_30px_rgba(0,255,136,0.4)]'
            : phase === 'error'
            ? 'bg-signal-red/20 border-2 border-signal-red text-signal-red hover:bg-signal-red/30 cursor-pointer hover:scale-105 active:scale-95'
            : 'bg-signal-green text-navy-950 hover:brightness-110 border-2 border-signal-green hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_30px_rgba(0,255,136,0.3)] hover:shadow-[0_0_40px_rgba(0,255,136,0.5)]'
          }`}
      >
        {isRunning ? (
          <div className="flex flex-col items-center gap-1">
            {/* Rotating scan indicator */}
            <div className="w-5 h-5 border-2 border-signal-green border-t-transparent rounded-full animate-spin" />
            <span className="text-xs leading-tight text-center px-2">{label}</span>
          </div>
        ) : (
          <span className="leading-tight text-center px-2">{label}</span>
        )}
      </button>
    </div>
  )
}
