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

  const [showBorders, setShowBorders] = useState(false);
  const [atmosphereAltitude, setAtmosphereAltitude] = useState(0.15);
  const [globeReady, setGlobeReady] = useState(false);
  const stateRefs = useRef({ showBorders: false, atmos: 0.15 });

  const cachedAutoRotate = useRef(null);
  const cachedEnabled = useRef(null);
  const cachedAlt = useRef(2.0);

  // Compute globe size in JS so canvas and wrapper always match
  const [globeSize, setGlobeSize] = useState(0);
  useEffect(() => {
    const update = () => {
      const vmin = Math.min(window.innerWidth, window.innerHeight);
      setGlobeSize(Math.round(vmin * 1.15));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleScrollProgress = useCallback((progress) => {
    const t1 = 0.20, t2 = 0.45, t3 = 0.70, t4 = 0.85;

    // Scale
    let scale = 1.0;
    if (progress > t1 && progress <= t3) scale = mapProgress(progress, t1, t2, 1.0, 0.60, easeQuart);
    if (progress > t3 && progress <= t4) scale = mapProgress(progress, t3, t4, 0.60, 0.43, easeQuart);
    if (progress > t4) scale = mapProgress(progress, t4, 1.0, 0.43, 1.0, easeQuart);

    // X Translation
    let x = 0;
    if (progress > t1 && progress <= t3) x = mapProgress(progress, t1, t2, 0, -18, easeQuart);
    if (progress > t3 && progress <= t4) x = mapProgress(progress, t3, t4, -18, -32, easeQuart);
    if (progress > t4) x = mapProgress(progress, t4, 1.0, -32, 0, easeQuart);

    // Y Translation
    let y = 0;
    if (progress > t3 && progress <= t4) y = mapProgress(progress, t3, t4, 0, 20, easeQuart);
    if (progress > t4) y = mapProgress(progress, t4, 1.0, 20, 0, easeQuart);

    if (globeWrapperRef.current) {
      globeWrapperRef.current.style.transform =
        `translateX(${x}vw) translateY(${y}vh) scale(${scale})`;
    }

    // Altitude zoom
    let alt = 2.0;
    if (progress > t2 && progress <= t4) alt = mapProgress(progress, t2, t3, 2.0, 1.2, easeQuart);
    if (progress > t4) alt = mapProgress(progress, t4, 1.0, 1.2, 2.0, easeQuart);

    if (globeReady && globeGLRef.current) {
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

    // Hero text fade
    const textOp = mapProgress(progress, 0, 0.25, 1, 0);
    const textY  = mapProgress(progress, 0, 0.25, 0, -60);
    if (heroTextRef.current) {
      heroTextRef.current.style.opacity = textOp;
      heroTextRef.current.style.transform = `translateY(${textY}px)`;
      heroTextRef.current.style.pointerEvents = textOp < 0.1 ? 'none' : 'auto';
    }

    // Scroll indicator fade
    const indicatorOp     = mapProgress(progress, 0, 0.15, 1, 0);
    const indicatorTextOp = mapProgress(progress, 0, 0.05, 1, 0);
    if (scrollIndicatorRef.current) scrollIndicatorRef.current.style.opacity = indicatorOp;
    if (scrollTextRef.current)      scrollTextRef.current.style.opacity = indicatorTextOp;

    // Starfield parallax
    const maxScrollPx = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const starY = -(progress * maxScrollPx * 0.3);
    if (starfieldRef.current) {
      starfieldRef.current.style.transform = `translateY(${starY}px)`;
    }

    // Hysteresis state (borders & glow)
    if (progress > 0.45 && !stateRefs.current.showBorders) {
      stateRefs.current.showBorders = true; setShowBorders(true);
    } else if (progress < 0.42 && stateRefs.current.showBorders) {
      stateRefs.current.showBorders = false; setShowBorders(false);
    }
    if (progress > 0.85 && stateRefs.current.atmos !== 0.35) {
      stateRefs.current.atmos = 0.35; setAtmosphereAltitude(0.35);
    } else if (progress < 0.82 && stateRefs.current.atmos !== 0.15) {
      stateRefs.current.atmos = 0.15; setAtmosphereAltitude(0.15);
    }
  }, [globeReady]);

  useScrollProgress(handleScrollProgress);

  // Stars
  const stars = useMemo(() =>
    Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      top:  `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 1.5 + 0.5}px`,
      duration: `${Math.random() * 3 + 2}s`,
      delay: `${Math.random() * 4}s`,
    }))
  , []);

  return (
    <main className="relative w-full h-[380vh] bg-[#050508]">

      {/* ── Starfield ── */}
      <div
        ref={starfieldRef}
        className="fixed inset-0 z-0 pointer-events-none will-change-transform"
      >
        {stars.map(s => (
          <div
            key={s.id}
            className="absolute bg-white rounded-full"
            style={{
              top: s.top, left: s.left,
              width: s.size, height: s.size,
              animation: `twinkle ${s.duration} ease-in-out ${s.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Globe — position:fixed so it's NEVER clipped by sticky/overflow ── */}
      <div
        className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        {/* Transform anchor — this is what the scroll callback moves */}
        <div
          ref={globeWrapperRef}
          className="will-change-transform origin-center transition-none relative"
          style={{
            width:    globeSize || '110vmin',
            height:   globeSize || '110vmin',
            overflow: 'visible',
          }}
        >
          {/* Purple glow halo */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-1000"
            style={{
              background: 'radial-gradient(circle at center, rgba(108,99,255,0.18) 0%, transparent 65%)',
              filter: 'blur(60px)',
              opacity: atmosphereAltitude > 0.15 ? 2 : 1,
            }}
          />

          {/* Globe canvas — centered via absolute inset-0 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'visible',
            }}
          >
            {globeSize > 0 && (
              <Globe3D
                interactive={false}
                width={globeSize}
                height={globeSize}
                globeRefExternal={globeGLRef}
                showBorders={showBorders}
                atmosphereAltitude={atmosphereAltitude}
                onGlobeReady={() => setGlobeReady(true)}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Sticky viewport layer — hero text + scroll indicator ── */}
      <div className="sticky top-0 w-full h-screen z-30 pointer-events-none">

        {/* Hero Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-start">
          <div className="h-[33%]" />
          <div
            ref={heroTextRef}
            className="relative flex flex-col items-center text-center w-full max-w-4xl px-6 pointer-events-auto will-change-transform"
          >
            {/* Text backdrop */}
            <div
              className="absolute -inset-16 -z-10 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 90% 70% at center, rgba(5,5,8,0.75) 0%, transparent 100%)',
              }}
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="font-inter text-[11px] sm:text-[13px] tracking-[0.2em] text-[#6C63FF] uppercase mb-5"
            >
              Geography · Capitals · Flags · Culture
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.9, ease: 'easeOut' }}
              className="font-grotesk text-[52px] sm:text-[84px] font-bold text-white leading-[1.05]"
              style={{ textShadow: '0 0 40px rgba(108,99,255,0.65), 0 0 120px rgba(108,99,255,0.2)' }}
            >
              Master every corner<br />of the world.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              className="font-inter text-[15px] sm:text-[18px] text-[#8B8FA8] mt-5 max-w-lg"
            >
              195 countries. Every capital. Every flag. All yours.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center gap-4 mt-10"
            >
              <Link to="/explorer">
                <button className="bg-[#6C63FF] text-white font-grotesk text-[15px] font-semibold px-8 py-3.5 rounded-full transition-all duration-300 shadow-[0_0_24px_rgba(108,99,255,0.6),0_0_48px_rgba(108,99,255,0.2)] hover:scale-105 hover:shadow-[0_0_36px_rgba(108,99,255,0.85),0_0_70px_rgba(108,99,255,0.35)]">
                  Start Exploring →
                </button>
              </Link>
              <Link to="/progress">
                <button className="bg-transparent border border-white/15 backdrop-blur-sm text-white font-inter text-[15px] px-8 py-3.5 rounded-full transition-all duration-300 hover:border-[#6C63FF]/60 hover:bg-white/5">
                  View Progress
                </button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-3 pointer-events-none"
        >
          <span ref={scrollTextRef} className="font-inter text-[11px] text-[#8B8FA8]/60 tracking-widest uppercase">
            Scroll to explore
          </span>
          <div className="relative w-[1px] h-[40px] bg-white/20 overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-b from-transparent via-[#6C63FF] to-white rounded-full"
              animate={{ y: [-10, 45] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
            />
          </div>
        </div>

      </div>

      {/* ── Scroll Sections (positioned in the 380vh flow) ── */}
      <div className="absolute top-0 left-0 w-full h-[380vh] z-20 pointer-events-none">
        <ScrollSection2 />
        <ScrollSection3 />
        <ScrollSection4 />
      </div>

    </main>
  );
}
