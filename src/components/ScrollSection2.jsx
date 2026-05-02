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
    <div className="absolute top-[100vh] left-0 w-full h-[100vh] flex items-center justify-center pointer-events-none px-8">
      
      <div 
        ref={containerRef}
        className="flex flex-col items-center text-center max-w-3xl"
      >
        {/* Eyebrow */}
        <p className="font-mono text-[11px] tracking-[0.25em] text-[#6C63FF] uppercase mb-16">
          WHAT YOU'LL MASTER
        </p>

        {/* 2x2 Stats Grid — NOT a list */}
        <div className="grid grid-cols-2 gap-x-24 gap-y-16 w-full mb-16">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="font-grotesk text-[80px] font-bold text-white leading-none"
                style={{ textShadow: '0 0 40px rgba(108,99,255,0.5)' }}>
                <AnimatedCounter end={s.value} suffix={s.suffix || ""} />
              </div>
              <div className="font-inter text-[16px] text-[#8B8FA8] uppercase tracking-[0.1em] text-[11px]">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <motion.div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-[#6C63FF] to-transparent mb-8"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.8 }}
        />

        {/* Subtext */}
        <motion.p className="font-inter text-[18px] text-[#8B8FA8] leading-relaxed"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
        >
          Every border. Every capital. Every flag.
        </motion.p>
      </div>
    </div>
  );
}
