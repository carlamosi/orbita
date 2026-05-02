import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Globe3D from '../components/Globe3D'
import { useScrollProgress } from '../hooks/useScrollProgress'
import ScrollSection2 from '../components/ScrollSection2'
import ScrollSection3 from '../components/ScrollSection3'
import ScrollSection4 from '../components/ScrollSection4'

const easeQuart = (t) => 1 - Math.pow(1 - t, 4);

function mapProgress(p, pMin, pMax, outMin, outMax, ease = t => t) {
  if (p <= pMin) return outMin;
  if (p >= pMax) return outMax;
  return outMin + (outMax - outMin) * ease((p - pMin) / (pMax - pMin));
}

export default function Home() {
  const globeWrapperRef = useRef(null);
  const heroTextRef = useRef(null);
  const starfieldRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const scrollTextRef = useRef(null);
  const globeGLRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // States with hysteresis references to prevent rapid flipping
  const [showBorders, setShowBorders] = useState(false);
  const [atmosphereAltitude, setAtmosphereAltitude] = useState(0.15);
  const [globeReady, setGlobeReady] = useState(false);
  const stateRefs = useRef({ showBorders: false, atmos: 0.15 });

  let cachedAutoRotate = useRef(null);
  let cachedEnabled = useRef(null);
  const cachedAlt = useRef(2.0);

  const handleScrollProgress = useCallback((progress) => {
    // 1. Globe Transforms
    // Timings
    const t1 = 0.20;
    const t2 = 0.45;
    const t3 = 0.70;
    const t4 = 0.85;

    // Scale
    let scale = 1.0;
    if (progress > t1 && progress <= t3) scale = mapProgress(progress, t1, t2, 1.0, 0.636, easeQuart); // 110 to 70vmin
    if (progress > t3 && progress <= t4) scale = mapProgress(progress, t3, t4, 0.636, 0.454, easeQuart); // 70 to 50vmin
    if (progress > t4) scale = mapProgress(progress, t4, 1.0, 0.454, 1.0, easeQuart); // back to 110vmin

    // X Translation
    let x = 0;
    if (progress > t1 && progress <= t3) x = mapProgress(progress, t1, t2, 0, -20, easeQuart);
    if (progress > t3 && progress <= t4) x = mapProgress(progress, t3, t4, -20, -35, easeQuart);
    if (progress > t4) x = mapProgress(progress, t4, 1.0, -35, 0, easeQuart);

    // Y Translation
    let y = 0;
    if (progress > t3 && progress <= t4) y = mapProgress(progress, t3, t4, 0, 25, easeQuart);
    if (progress > t4) y = mapProgress(progress, t4, 1.0, 25, 0, easeQuart);

    // Apply to DOM directly (bypassing React)
    if (globeWrapperRef.current) {
      globeWrapperRef.current.style.transform = `translateX(${x}vw) translateY(${y}vh) scale(${scale})`;
    }

    // Altitude Zoom via Globe Ref
    let alt = 2.0;
    if (progress > t2 && progress <= t4) alt = mapProgress(progress, t2, t3, 2.0, 1.2, easeQuart);
    if (progress > t4) alt = mapProgress(progress, t4, 1.0, 1.2, 2.0, easeQuart);
    
    if (!globeReady) return;

    if (globeGLRef.current) {
      if (globeGLRef.current.pointOfView) {
        if (Math.abs(cachedAlt.current - alt) > 0.001) {
          globeGLRef.current.pointOfView({ altitude: alt }, 0);
          cachedAlt.current = alt;
        }
      }
      
      const ctrl = globeGLRef.current.controls();
      if (ctrl) {
        const shouldRotate = progress < 0.45;
        const shouldEnable = progress < 0.20;

        if (cachedAutoRotate.current !== shouldRotate) {
          ctrl.autoRotate = shouldRotate;
          cachedAutoRotate.current = shouldRotate;
        }
        if (cachedEnabled.current !== shouldEnable) {
          ctrl.enabled = shouldEnable;
          cachedEnabled.current = shouldEnable;
        }
      }
    }

    // 2. Hero Text Fade
    const textOp = mapProgress(progress, 0, 0.25, 1, 0);
    const textY = mapProgress(progress, 0, 0.25, 0, -60);
    if (heroTextRef.current) {
      heroTextRef.current.style.opacity = textOp;
      heroTextRef.current.style.transform = `translateY(${textY}px)`;
      // disable pointer events if hidden
      heroTextRef.current.style.pointerEvents = textOp < 0.1 ? 'none' : 'auto';
    }

    // 3. Scroll Indicator Fade
    const indicatorOp = mapProgress(progress, 0, 0.15, 1, 0);
    const indicatorTextOp = mapProgress(progress, 0, 0.05, 1, 0);
    if (scrollIndicatorRef.current) scrollIndicatorRef.current.style.opacity = indicatorOp;
    if (scrollTextRef.current) scrollTextRef.current.style.opacity = indicatorTextOp;

    // 4. Starfield Parallax
    const maxScrollPx = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const starY = -(progress * maxScrollPx * 0.3);
    if (starfieldRef.current) {
      starfieldRef.current.style.transform = `translateY(${starY}px)`;
    }

    // 5. Hysteresis State Updates (Borders & Glow)
    if (progress > 0.45 && !stateRefs.current.showBorders) {
      stateRefs.current.showBorders = true;
      setShowBorders(true);
    } else if (progress < 0.42 && stateRefs.current.showBorders) {
      stateRefs.current.showBorders = false;
      setShowBorders(false);
    }

    if (progress > 0.85 && stateRefs.current.atmos !== 0.35) {
      stateRefs.current.atmos = 0.35;
      setAtmosphereAltitude(0.35);
    } else if (progress < 0.82 && stateRefs.current.atmos !== 0.15) {
      stateRefs.current.atmos = 0.15;
      setAtmosphereAltitude(0.15);
    }

  }, [globeReady]);

  useScrollProgress(handleScrollProgress);

  const [globeSize, setGlobeSize] = useState(600);
  useEffect(() => {
    const update = () => {
      const vmin = Math.min(window.innerWidth, window.innerHeight);
      setGlobeSize(vmin * 1.1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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
    <main className="relative w-full h-[380vh] bg-[#050508]">
      
      {/* ── Fixed/Sticky Overlay Base ── */}
      <div className="sticky top-0 w-full h-screen overflow-visible">
        
        {/* ── Starfield Background ── */}
        <div ref={starfieldRef} className="absolute top-0 left-0 w-full h-[150vh] z-0 pointer-events-none will-change-transform">
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

        {/* ── Giant Globe ── */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none -translate-y-[5vh]">
          {/* Performance wrapped container */}
          <div className="will-change-transform flex items-center justify-center w-full h-full" style={{ perspective: "1000px", overflow: "visible" }}>
            <div 
              ref={globeWrapperRef} 
              className="relative w-[140vmin] h-[140vmin] sm:w-[110vmin] sm:h-[110vmin] will-change-transform origin-center transition-none overflow-visible"
            >
              {/* Outer glow effect */}
              <div 
                className="absolute inset-0 rounded-full transition-opacity duration-1000"
                style={{
                  background: 'radial-gradient(circle at center, rgba(108,99,255,0.15) 0%, transparent 60%)',
                  filter: 'blur(80px)',
                  opacity: atmosphereAltitude > 0.15 ? 2.5 : 1 // intensify CSS glow along with GlobeGL param
                }}
              />

              {/* Globe Component wrapper */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full"
                style={{ overflow: 'visible' }}
              >
                <Globe3D
                  interactive={false}
                  width={globeSize}
                  height={globeSize}
                  globeRefExternal={globeGLRef}
                  showBorders={showBorders}
                  atmosphereAltitude={atmosphereAltitude}
                  onGlobeReady={() => setGlobeReady(true)}
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Hero Text Overlay (Section 1) ── */}
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-start pointer-events-none">
          <div className="h-[38%] mt-[2%]" />
          
          <div ref={heroTextRef} className="relative flex flex-col items-center text-center w-full max-w-4xl px-4 pointer-events-auto will-change-transform">
            <div className="absolute inset-0 bg-radial-[circle_at_center] from-[#050508]/80 to-transparent blur-[80px] -z-10" />

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
              className="font-grotesk text-[48px] sm:text-[88px] font-bold text-white leading-[1.1]"
              style={{ textShadow: '0 0 40px rgba(108,99,255,0.6), 0 0 120px rgba(108,99,255,0.2)' }}
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
                <button className="
                  bg-transparent border border-white/15 backdrop-blur-sm
                  text-white font-inter text-[15px]
                  px-8 py-3.5 rounded-full transition-all duration-300
                  hover:border-[#6C63FF] hover:bg-white/5
                ">
                  View Progress
                </button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* ── Scroll Indicator Upgrade ── */}
        <div ref={scrollIndicatorRef} className="absolute bottom-8 inset-x-0 z-30 flex flex-col items-center gap-3 pointer-events-none will-change-transform">
          <span ref={scrollTextRef} className="font-inter text-[12px] text-[#8B8FA8] opacity-50 will-change-transform transition-opacity">
            Scroll to explore
          </span>
          <div className="relative w-[1px] h-[40px] bg-white/30 overflow-hidden">
            <motion.div 
              className="absolute top-0 left-0 w-full h-[6px] bg-white rounded-full bg-gradient-to-b from-transparent via-[#6C63FF] to-white"
              animate={{ y: [-10, 45] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </div>
        </div>

      </div>

      {/* ── Scroll Sections (Overlays absolute mapped inside the 380vh scrollable parent wrapper) ── */}
      <div className="absolute top-0 left-0 w-full h-[380vh] z-20 pointer-events-none">
         <ScrollSection2 />
         <ScrollSection3 />
         <ScrollSection4 />
      </div>

    </main>
  )
}
