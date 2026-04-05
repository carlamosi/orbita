/**
 * Badge component — small pill for continent labels and difficulty levels
 *
 * @param {'continent' | 'difficulty'} variant
 * @param {string} label     — text to display
 * @param {string} className — additional classes
 *
 * Continent colors:
 *   Europe → violet, Africa → coral, Asia → cyan,
 *   Americas → neon, Oceania → amber, Antarctica → slate
 *
 * Difficulty colors:
 *   easy → neon, medium → cyan, hard → coral
 */

const continentStyles = {
  Europe:      'bg-violet/15 text-violet border-violet/30',
  Africa:      'bg-coral/15 text-coral border-coral/30',
  Asia:        'bg-cyan/15 text-cyan border-cyan/30',
  Americas:    'bg-neon/15 text-neon border-neon/30',
  Oceania:     'bg-amber-400/15 text-amber-400 border-amber-400/30',
  Antarctica:  'bg-slate-400/15 text-slate-400 border-slate-400/30',
}

const difficultyStyles = {
  easy:   'bg-neon/15 text-neon border-neon/30',
  medium: 'bg-cyan/15 text-cyan border-cyan/30',
  hard:   'bg-coral/15 text-coral border-coral/30',
}

export default function Badge({ variant = 'continent', label = '', className = '' }) {
  const style =
    variant === 'continent'
      ? (continentStyles[label] ?? 'bg-white/10 text-white/60 border-white/20')
      : (difficultyStyles[label?.toLowerCase()] ?? 'bg-white/10 text-white/60 border-white/20')

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5
        rounded-full text-xs font-medium font-mono tracking-wide
        border
        ${style}
        ${className}
      `}
    >
      {label}
    </span>
  )
}
