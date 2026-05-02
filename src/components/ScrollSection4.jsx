import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function ScrollSection4() {
  const containerRef = useRef(null);
  const inView = useInView(containerRef, { once: false, margin: "-10%" });

  return (
    <div className="absolute top-[320vh] left-0 w-full h-[60vh] pointer-events-none flex flex-col items-center justify-center z-40">
      <div 
        ref={containerRef}
        className="flex flex-col items-center text-center pointer-events-auto"
      >
        <motion.h2
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="font-grotesk text-[80px] font-bold text-white leading-tight mb-12"
          style={{ textShadow: '0 0 80px #6C63FF, 0 0 160px rgba(108,99,255,0.4)' }}
        >
          Your world.<br />Fully explored.
        </motion.h2>

        <Link to="/explorer">
          <motion.button
            initial={{ opacity: 0, y: 20, boxShadow: '0 0 20px rgba(108,99,255,0.2)' }}
            animate={inView ? { 
              opacity: 1, 
              y: 0, 
              boxShadow: ['0 0 20px rgba(108,99,255,0.4)', '0 0 50px rgba(108,99,255,0.8)', '0 0 20px rgba(108,99,255,0.4)'] 
            } : { opacity: 0, y: 20, boxShadow: '0 0 20px rgba(108,99,255,0.2)' }}
            transition={{ 
              opacity: { duration: 0.8, delay: 0.2 },
              y: { duration: 0.8, delay: 0.2 },
              boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" } 
            }}
            className="font-grotesk text-[18px] font-bold text-white px-12 py-[18px] rounded-full bg-[#6C63FF] hover:bg-[#5b54ff] transition-colors"
          >
            Begin Your Journey →
          </motion.button>
        </Link>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-inter text-[13px] text-[#8B8FA8] mt-6 opacity-60"
        >
          No account needed. Just you and the world.
        </motion.p>
      </div>
    </div>
  );
}
