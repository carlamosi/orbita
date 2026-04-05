import { Link } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import Button from '../components/Button'

export default function Offline() {
  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
        <WifiOff size={40} className="text-[#8B8FA8]" />
      </div>
      
      <h1 className="font-grotesk text-4xl font-bold text-white mb-4">You're Offline</h1>
      <p className="font-inter text-[#8B8FA8] max-w-md mb-10 leading-relaxed">
        Orbita requires an internet connection to sync your latest progress and fetch high-resolution map data. 
        Please check your connection and try again.
      </p>

      <div className="flex gap-4">
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry Connection
        </Button>
        <Link to="/">
          <Button variant="secondary">Go Home</Button>
        </Link>
      </div>
      
      <div className="mt-12 p-4 glass-card border-white/5 max-w-xs">
        <p className="text-xs font-mono text-white/30 uppercase tracking-widest">
          Tip: Most mastered countries are cached and available for review once back online.
        </p>
      </div>
    </div>
  )
}
