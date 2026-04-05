import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Globe3D from '../components/Globe3D'

export default function Home() {
  // Pure CSS Starfield (120 stars)
  const stars = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 1.5 + 0.5}px`,
      duration: `${Math.random() * 3 + 2}s`,
      delay: `${Math.random() * 4}s`
    }))
  }, [])

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#050508]">
      {/* ── Starfield Background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {stars.map(s => (
          <div
            key={s.id}
            className="absolute bg-white rounded-full"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animation: `twinkle ${s.duration} ease-in-out ${s.delay} infinite`
            }}
          />
        ))}
      </div>

      {/* ── Massive Globe (Centered, size 110vmin) ── */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none -translate-y-[5vh]">
        
        {/* Globe Glow Wrapper */}
        <div className="relative w-[140vmin] h-[140vmin] sm:w-[110vmin] sm:h-[110vmin]">
          
          {/* Outer glow effect */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at center, rgba(108,99,255,0.15) 0%, transparent 60%)',
              filter: 'blur(80px)'
            }}
          />

          {/* Globe Component wrapper */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full"
          >
            <Globe3D
              interactive={false}
              // Force 100% width and height string bypassing generic default height
              width="100%"
              height="100%"
            />
          </motion.div>
        
        </div>
      </div>

      {/* ── Bottom Gradient Overlay ── */}
      <div className="absolute bottom-0 inset-x-0 h-[200px] bg-gradient-to-t from-[#050508] to-transparent z-20 pointer-events-none" />

      {/* ── Text Overlay (Above Globe) ── */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-start pointer-events-none">
        
        {/* Helper div to push text vertically to top: 52% approx */}
        <div className="h-[48%] mt-[4%]" />
        
        {/* Subtle radial gradient behind text for contrast */}
        <div className="relative flex flex-col items-center text-center w-full max-w-4xl px-4 pointer-events-auto">
          <div className="absolute inset-0 bg-radial-[circle_at_center] from-[#050508]/60 to-transparent blur-3xl -z-10" />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="font-inter text-[13px] tracking-[0.15em] text-[#8B8FA8] uppercase mb-4"
          >
            Geography · Capitals · Flags · History
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
            className="font-grotesk text-[40px] sm:text-[72px] font-bold text-white leading-[1.1]"
            style={{ textShadow: '0 0 60px rgba(108,99,255,0.4)' }}
          >
            Master every corner<br />of the world.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="font-inter text-[16px] sm:text-[18px] text-[#8B8FA8] mt-4"
          >
            195 countries. Every capital. Every flag. All yours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center gap-4 mt-9"
          >
            <Link to="/explorer">
              <button className="
                bg-[#6C63FF] text-white font-grotesk text-[15px] font-semibold
                px-8 py-3.5 rounded-full transition-all duration-300
                shadow-[0_0_24px_rgba(108,99,255,0.6),0_0_48px_rgba(108,99,255,0.2)]
                hover:scale-105 hover:shadow-[0_0_36px_rgba(108,99,255,0.8),0_0_64px_rgba(108,99,255,0.4)]
              ">
                Start Exploring →
              </button>
            </Link>

            <Link to="/progress">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                className="
                  bg-transparent border border-white/15 backdrop-blur-sm
                  text-white font-inter text-[15px]
                  px-8 py-3.5 rounded-full transition-all duration-300
                  hover:border-[#6C63FF] hover:bg-white/5
                "
              >
                View Progress
              </motion.button>
            </Link>
          </motion.div>
        
        </div>
      </div>

      {/* ── Scroll To Explore Indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 inset-x-0 z-30 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="font-inter text-[12px] text-[#8B8FA8] opacity-50">
          Scroll to explore
        </span>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3], y: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-[#8B8FA8] opacity-50"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </motion.div>

    </main>
  )
}
