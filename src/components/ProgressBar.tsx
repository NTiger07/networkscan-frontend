interface ProgressBarProps {
  progress: number
  phase: string
}

const PHASE_COLORS: Record<string, string> = {
  ping: 'bg-signal-amber',
  download: 'bg-signal-cyan',
  upload: 'bg-signal-green',
  done: 'bg-signal-green',
}

export default function ProgressBar({ progress, phase }: ProgressBarProps) {
  const color = PHASE_COLORS[phase] || 'bg-signal-green'

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-mono text-white/30 uppercase tracking-widest">{phase}</span>
        <span className="text-xs font-mono text-white/30">{Math.round(progress)}%</span>
      </div>
      <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${color}`}
          style={{
            width: `${progress}%`,
            boxShadow: `0 0 8px currentColor`,
          }}
        />
      </div>
    </div>
  )
}
