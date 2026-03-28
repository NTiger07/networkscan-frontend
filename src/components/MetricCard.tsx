import { useEffect, useRef, useState } from 'react'

interface MetricCardProps {
  label: string
  value: number
  unit: string
  color?: 'green' | 'cyan' | 'amber' | 'red'
  active?: boolean
  decimals?: number
}

const COLOR_MAP = {
  green: 'text-signal-green',
  cyan: 'text-signal-cyan',
  amber: 'text-signal-amber',
  red: 'text-signal-red',
}

const BORDER_MAP = {
  green: 'border-signal-green/20 bg-signal-green/5',
  cyan: 'border-signal-cyan/20 bg-signal-cyan/5',
  amber: 'border-signal-amber/20 bg-signal-amber/5',
  red: 'border-signal-red/20 bg-signal-red/5',
}

export default function MetricCard({
  label,
  value,
  unit,
  color = 'green',
  active = false,
  decimals = 1,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const rafRef = useRef<number>()
  const startRef = useRef(displayValue)
  const targetRef = useRef(value)
  const startTimeRef = useRef<number>()

  useEffect(() => {
    targetRef.current = value
    startRef.current = displayValue
    startTimeRef.current = undefined

    const animate = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now
      const elapsed = now - startTimeRef.current
      const duration = 300
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // ease out cubic

      const current = startRef.current + (targetRef.current - startRef.current) * eased
      setDisplayValue(current)

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value])

  const formatted = displayValue.toFixed(decimals)

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
        BORDER_MAP[color]
      } ${active ? 'scale-105' : ''}`}
    >
      {active && (
        <div
          className={`absolute inset-0 rounded-xl opacity-10 ${
            color === 'green' ? 'bg-signal-green' :
            color === 'cyan' ? 'bg-signal-cyan' :
            color === 'amber' ? 'bg-signal-amber' : 'bg-signal-red'
          } animate-pulse`}
        />
      )}
      <div className="text-white/40 text-xs font-mono uppercase tracking-widest mb-2">
        {label}
      </div>
      <div className={`text-3xl font-mono font-bold tabular-nums ${COLOR_MAP[color]}`}>
        {formatted}
      </div>
      <div className="text-white/30 text-xs font-mono mt-1">{unit}</div>
    </div>
  )
}
