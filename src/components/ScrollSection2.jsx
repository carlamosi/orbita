import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

function AnimatedCounter({ end, duration = 800, prefix = "", suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView) return;
    let startTimestamp = null;
    let animationFrameId = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(end); // Ensure exact final value
      }
    };
    animationFrameId = window.requestAnimationFrame(step);
    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    }
  }, [inView, end, duration]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

export default function ScrollSection2() {
  const containerRef = useRef(null);
  const inView = useInView(containerRef, { once: true, margin: "-20%" });

  const stats = [
    { value: 195, label: "Countries" },
    { value: 7, label: "Continents" },
    { value: 195, label: "Capitals" },
    { value: 1000, label: "Flag combinations", suffix: "+" }
  ];

  return (
    <div className="absolute top-[100vh] left-0 w-full h-[100vh] pointer-events-none flex items-center justify-end pr-[10vw]">
      <div 
        ref={containerRef}
        className="w-[35%] min-w-[300px] flex flex-col items-start"
      >
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={inView ? { opacity: 1, y: 0 } : {}}
           transition={{ duration: 0.6 }}
        >
          <p className="font-mono text-[11px] tracking-[0.2em] text-[#6C63FF] uppercase mb-12">
            WHAT YOU'LL MASTER
          </p>

          <div className="flex flex-col gap-8 w-full">
            {stats.map((s, i) => (
              <motion.div 
                key={s.label}
                initial={{ opacity: 0, x: 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 + 0.2 }}
                className="flex items-baseline gap-6"
              >
                <div className="font-grotesk text-[64px] font-bold text-white w-[140px]" style={{ textShadow: '0 0 30px rgba(255,255,255,0.3)' }}>
                  <AnimatedCounter end={s.value} suffix={s.suffix || ""} />
                </div>
                <div className="font-inter text-[18px] text-[#8B8FA8]">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
             initial={{ scaleX: 0 }}
             animate={inView ? { scaleX: 1 } : {}}
             transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
             className="w-full h-[1px] bg-gradient-to-r from-[#6C63FF] to-transparent mt-12 origin-left"
          />

          <motion.p 
             initial={{ opacity: 0 }}
             animate={inView ? { opacity: 1 } : {}}
             transition={{ duration: 0.8, delay: 1 }}
             className="font-inter text-[16px] text-[#8B8FA8] max-w-[320px] mt-6 leading-relaxed"
          >
            Every border. Every capital. Every flag.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
