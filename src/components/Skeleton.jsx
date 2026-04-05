import { motion } from 'framer-motion'

export function PanelSkeleton() {
  return (
    <div className="absolute inset-0 w-full h-full glass-card border-l border-white/8 flex flex-col p-6 animate-pulse">
      <div className="flex flex-col items-center gap-3 mb-8 pt-2">
        <div className="w-32 h-20 bg-white/10 rounded-md" />
        <div className="w-48 h-8 bg-white/10 rounded-md mt-2" />
        <div className="w-24 h-5 bg-white/10 rounded-full" />
      </div>
      <div className="space-y-4 mb-8">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-10 bg-white/5 rounded-xl border border-white/5" />
        ))}
      </div>
      <div className="h-24 bg-white/5 rounded-xl mb-8" />
      <div className="h-12 bg-white/10 rounded-md mt-auto" />
    </div>
  )
}

export function GlobeSkeleton() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-[600px] h-[600px] rounded-full bg-violet/20 blur-[60px]"
      />
      <div className="absolute w-[400px] h-[400px] rounded-full border border-white/5" />
    </div>
  )
}
