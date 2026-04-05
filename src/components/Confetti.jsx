import { useEffect, useState, useMemo } from 'react'

export default function Confetti({ active }) {
  const [show, setShow] = useState(false)

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (active && !prefersReducedMotion) {
      setShow(true)
      const t = setTimeout(() => setShow(false), 2000)
      return () => clearTimeout(t)
    }
  }, [active, prefersReducedMotion])

  // Pre-calculate 16 particles
  const particles = useMemo(() => {
    const colors = ['#6C63FF', '#00D4FF', '#00FFB2', '#FF6B6B', '#FFA500']
    return Array.from({ length: 16 }).map((_, i) => {
      // spread in a circle
      const angle = (i * (360 / 16)) + (Math.random() * 10 - 5)
      const velocity = 40 + Math.random() * 60
      const tx = Math.cos(angle * (Math.PI / 180)) * velocity
      const ty = Math.sin(angle * (Math.PI / 180)) * velocity
      
      return {
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        tx: `${tx}px`,
        ty: `${ty}px`,
        delay: `${(Math.random() * 0.1).toFixed(2)}s`,
        rotation: `${Math.random() * 360}deg`,
      }
    })
  }, [])

  if (!show) return null

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 overflow-visible">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute w-2 h-4 rounded-full will-change-transform opacity-0"
          style={{
            backgroundColor: p.color,
            animation: `confettiBurst 0.8s ease-out ${p.delay} forwards`,
            '--tx': p.tx,
            '--ty': p.ty,
            '--rot': p.rotation,
          }}
        />
      ))}
    </div>
  )
}
