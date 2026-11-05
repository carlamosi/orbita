import { Link } from 'react-router-dom'

// Shown instead of a globe game when the world map could not be loaded (offline).
export default function MapUnavailable({ className = '' }) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center text-center gap-4 p-8 ${className}`}>
      <p className="font-inter text-white text-lg max-w-md">
        Map unavailable offline. Try Flags or Capitals, or reconnect.
      </p>
      <Link to="/flag" className="px-6 py-2 rounded-full bg-violet text-white font-inter text-sm">
        Play Flags
      </Link>
    </div>
  )
}

export function isMapDown({ geoError, geoData, isLoading }) {
  return Boolean(geoError) || (isLoading === false && !geoData)
}
