import { Link, useLocation } from 'react-router-dom'

export default function NavBar() {
  const loc = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-navy-950/80 backdrop-blur-md border-b border-white/5">
      <Link to="/" className="flex items-center gap-3 group">
        {/* Signal icon */}
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border border-signal-green/40 group-hover:border-signal-green/70 transition-colors" />
          <div className="absolute inset-1.5 rounded-full border border-signal-green/60 group-hover:border-signal-green transition-colors" />
          <div className="absolute inset-3 rounded-full bg-signal-green group-hover:shadow-[0_0_6px_#00ff88] transition-shadow" />
        </div>
        <span className="font-display font-semibold text-white tracking-tight">
          Network<span className="text-signal-green">Scan</span>
          <span className="text-white/40">NG</span>
        </span>
      </Link>

      <div className="flex items-center gap-1">
        <Link
          to="/"
          className={`px-4 py-1.5 rounded-lg text-sm font-mono transition-all duration-200 ${
            loc.pathname === '/'
              ? 'bg-signal-green/10 text-signal-green border border-signal-green/30'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          scan
        </Link>
        <Link
          to="/map"
          className={`px-4 py-1.5 rounded-lg text-sm font-mono transition-all duration-200 ${
            loc.pathname === '/map'
              ? 'bg-signal-green/10 text-signal-green border border-signal-green/30'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          map
        </Link>
      </div>
    </nav>
  )
}
