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
    <div className="absolute top-[200vh] left-0 w-full h-[120vh] flex flex-col items-center justify-center pointer-events-none px-8">

      <div className="flex flex-col items-center w-full max-w-4xl">
        
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="font-grotesk text-[56px] font-bold text-white text-center mb-4"
        >
          Six ways to learn
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-inter text-[16px] text-[#8B8FA8] text-center mb-16"
        >
          Every mode trains a different skill. Master them all.
        </motion.p>

        {/* 3x2 Grid — NOT a vertical stack */}
        <div className="grid grid-cols-3 gap-5 w-full pointer-events-auto">
          {modes.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ 
                y: -6,
                borderColor: 'rgba(108,99,255,0.6)',
                boxShadow: '0 0 30px rgba(108,99,255,0.2)'
              }}
              className="flex flex-col items-center text-center gap-4 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer transition-all duration-300 group"
            >
              <div className="text-[40px] group-hover:scale-110 transition-transform duration-300">
                {m.icon}
              </div>
              <div>
                <div className="font-grotesk text-[17px] font-bold text-white group-hover:text-[#6C63FF] transition-colors mb-1">
                  {m.name}
                </div>
                <div className="font-inter text-[13px] text-[#8B8FA8]">
                  {m.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
