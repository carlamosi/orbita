import { motion } from 'framer-motion'

/**
 * Card component — glassmorphism with hover glow
 *
 * @param {'violet' | 'cyan' | 'neon' | 'coral'} glowColor  — glow accent on hover
 * @param {string} className  — additional Tailwind classes
 * @param {function} onClick
 * @param {React.ReactNode} children
 */
export default function Card({
  glowColor = 'violet',
  className = '',
  onClick,
  children,
  ...props
}) {
  const glowMap = {
    violet: 'hover:border-violet/40 hover:shadow-[0_0_30px_rgba(108,99,255,0.25)]',
    cyan:   'hover:border-cyan/40   hover:shadow-[0_0_30px_rgba(0,212,255,0.25)]',
    neon:   'hover:border-neon/40   hover:shadow-[0_0_30px_rgba(0,255,178,0.25)]',
    coral:  'hover:border-coral/40  hover:shadow-[0_0_30px_rgba(255,107,107,0.25)]',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onClick={onClick}
      className={`
        glass-card p-6
        border border-white/8
        transition-all duration-300
        ${glowMap[glowColor] ?? glowMap.violet}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
}
