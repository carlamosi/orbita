import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Volume2, VolumeX } from 'lucide-react'
import { useSounds } from '../hooks/useSounds'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { muted, toggleMute } = useSounds()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`
        fixed top-0 inset-x-0 z-50 h-[56px] transition-all duration-300
        ${scrolled || location.pathname !== '/'
          ? 'backdrop-blur-md bg-white/[0.05] border-b border-white/[0.08]' 
          : 'bg-transparent border-b border-transparent'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="4" fill="white" />
            <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#6C63FF" strokeWidth="1.5"
                     className="origin-center -rotate-12 group-hover:rotate-[348deg] transition-transform duration-700 ease-out" />
          </svg>
          <span className="font-grotesk text-[18px] font-bold text-white tracking-wide">
            Orbita
          </span>
        </Link>

        {/* Right: Links + Sound */}
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/explorer" active={location.pathname === '/explorer'}>Explorer</NavLink>
            <NavLink to="/progress" active={location.pathname === '/progress'}>Progress</NavLink>
            <NavLink to="/challenges" active={location.pathname === '/challenges'}>Challenges</NavLink>
          </div>

          <button
            onClick={toggleMute}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#8B8FA8] hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
            aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, children, active }) {
  return (
    <Link
      to={to}
      aria-label={`Navigate to ${children}`}
      className={`
        relative font-inter text-[14px] font-medium transition-colors duration-200
        ${active ? 'text-white' : 'text-[#8B8FA8] hover:text-white group'}
      `}
    >
      {children}
      {/* Hover underline */}
      <span className={`
        absolute -bottom-1 left-0 h-[2px] bg-violet transition-all duration-300
        ${active ? 'w-full' : 'w-0 group-hover:w-full'}
      `} />
    </Link>
  )
}
