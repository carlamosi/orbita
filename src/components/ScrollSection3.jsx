import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function ScrollSection3() {
  const containerRef = useRef(null);
  const inView = useInView(containerRef, { once: true, margin: "-20%" });

  const modes = [
    { icon: "🌍", name: "Find It", desc: "Locate countries on the 3D globe" },
    { icon: "✏️", name: "Name It", desc: "Type the name of highlighted borders" },
    { icon: "🚩", name: "Flags", desc: "Match the flag to the nation" },
    { icon: "🏛️", name: "Capitals", desc: "Pinpoint capital cities accurately" },
    { icon: "⏱️", name: "Speed Round", desc: "Race against the clock" },
    { icon: "🌟", name: "Daily Quest", desc: "New challenges every 24 hours" },
  ];

  return (
    <div className="absolute top-[200vh] left-0 w-full h-[120vh] pointer-events-none flex items-center justify-end pr-[10vw]">
      <div 
        ref={containerRef}
        className="w-[35%] min-w-[380px] flex flex-col pointer-events-auto"
      >
        <motion.h2 
          initial={{ opacity: 0, x: 30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="font-grotesk text-[48px] font-bold text-white mb-10"
        >
          Six ways to learn
        </motion.h2>

        <div className="flex flex-col gap-4">
          {modes.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, x: 40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ x: 8, borderColor: "rgba(108,99,255,0.6)", boxShadow: "0 0 20px rgba(108,99,255,0.2)" }}
              className="w-full flex items-center gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer transition-all duration-300 group"
            >
              <div className="text-[28px] drop-shadow-md group-hover:scale-110 transition-transform">
                {m.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-grotesk text-[18px] font-bold text-white group-hover:text-[#6C63FF] transition-colors">{m.name}</span>
                <span className="font-inter text-[14px] text-[#8B8FA8]/80">{m.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
