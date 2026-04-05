import { motion } from 'framer-motion'
import Button from './Button'

export default function QuestionCard({ countryName, current, total, score, onHint }) {
  const progress = (current / total) * 100

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute top-24 left-1/2 -translate-x-1/2 z-20 w-[360px] glass-card p-6 flex flex-col gap-4 border-b-2 border-b-white/10"
    >
      {/* Top row: Label + Score */}
      <div className="flex items-center justify-between">
        <span className="font-inter text-[14px] text-[#8B8FA8]">Find this country:</span>
        <span className="font-mono text-white text-sm bg-white/10 px-2 py-0.5 rounded-md">
          {score} PTS
        </span>
      </div>

      {/* Target Name */}
      <h2 className="font-grotesk text-[32px] text-white leading-tight font-bold text-center">
        {countryName || '...'}
      </h2>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2 relative">
        <motion.div
          className="absolute inset-y-0 left-0 bg-violet"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'easeOut', duration: 0.4 }}
        />
      </div>

      {/* Footer line: Hint */}
      <div className="flex justify-end mt-1">
        <button
          onClick={onHint}
          className="font-inter text-xs text-[#8B8FA8] hover:text-white transition-colors underline decoration-white/20 underline-offset-4"
        >
          Show continent (-5pts)
        </button>
      </div>
    </motion.div>
  )
}
