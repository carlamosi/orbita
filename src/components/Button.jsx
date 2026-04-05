import { motion } from 'framer-motion'

/**
 * Button component
 *
 * @param {'primary' | 'secondary'} variant
 * @param {'sm' | 'md' | 'lg'} size
 * @param {string} id        – required for accessibility
 * @param {boolean} disabled
 * @param {function} onClick
 * @param {React.ReactNode} children
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  id,
  disabled = false,
  onClick,
  children,
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  }

  const variants = {
    primary: `
      bg-violet text-white font-semibold
      border border-violet/80
      hover:bg-violet/90
      hover:glow-violet
      disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
    `,
    secondary: `
      glass-card text-white/80 font-medium
      border border-white/10
      hover:bg-white/8 hover:border-white/20 hover:text-white
      disabled:opacity-40 disabled:cursor-not-allowed
    `,
  }

  return (
    <motion.button
      id={id}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled  ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl font-grotesk tracking-wide
        transition-all duration-200 select-none outline-none
        focus-visible:ring-2 focus-visible:ring-violet/60
        ${sizes[size]}
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  )
}
