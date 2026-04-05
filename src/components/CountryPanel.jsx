import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from './Button'
import { useGameStore } from '../store/useGameStore'
import { PanelSkeleton } from './Skeleton'

/* ── Flag emoji from ISO2 ─────────────────────────────────
   Converts "US" → 🇺🇸 using regional indicator symbols.      */
function flagEmoji(iso2) {
  if (!iso2 || iso2 === '-99') return '🌍'
  return iso2
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('')
}

/* ── Format large numbers ─────────────────────────────── */
function formatPop(n) {
  if (!n) return 'N/A'
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

/* ── Continent badge color ───────────────────────────────── */
const continentColors = {
  'Europe':        'text-violet border-violet/30 bg-violet/10',
  'Asia':          'text-cyan border-cyan/30 bg-cyan/10',
  'Africa':        'text-coral border-coral/30 bg-coral/10',
  'North America': 'text-neon border-neon/30 bg-neon/10',
  'South America': 'text-neon border-neon/30 bg-neon/10',
  'Oceania':       'text-amber-400 border-amber-400/30 bg-amber-400/10',
  'Antarctica':    'text-slate-400 border-slate-400/30 bg-slate-400/10',
}

import countriesData from '../data/countries.json'

/**
 * CountryPanel
 */
export default function CountryPanel({ country, onClose, isBorderViewActive, onToggleBorders }) {
  const p = country?.properties ?? {}
  const geoIso3   = country?.id || p.iso_a3 || p.ISO_A3 || ''
  const geoName   = p.name || p.NAME || 'Unknown'
  
  const countryProgress = useGameStore(s => s.countryProgress) || {}
  const exactData = countriesData.find(c => c.id === geoIso3)

  const name      = exactData?.name      || geoName
  const continent = exactData?.continent || p.continent || p.CONTINENT || ''
  const pop       = exactData?.population|| p.pop_est   || p.POP_EST   || 0
  const flag      = exactData?.flagCode  || (exactData?.flag ? exactData.flag : '')
  const capital   = exactData?.capital   || 'N/A'
  const currency  = exactData?.currency  || 'N/A'
  const languages = exactData?.languages?.join(', ') || 'N/A'
  const funFact   = exactData?.funFact   || ''
  
  const prog = countryProgress[geoIso3] || { locationConf: 0, capitalConf: 0, flagConf: 0 }

  const badgeClass = continentColors[continent] ?? 'text-white/60 border-white/20 bg-white/5'

  const [showPractice, setShowPractice] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // Artificial delay for skeleton demonstration or real fetch prep
  useEffect(() => {
    if (country) {
      setIsDataLoaded(false)
      const timer = setTimeout(() => setIsDataLoaded(true), 300)
      return () => clearTimeout(timer)
    }
  }, [country])

  return (
    <AnimatePresence>
      {country && (
        !isDataLoaded ? <PanelSkeleton /> : (
        <motion.aside
          key="country-panel"
          initial={{ x: 340, opacity: 0 }}
          animate={{ x: 0,   opacity: 1 }}
          exit={{    x: 340, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="
            absolute inset-0 w-full h-full
            glass-card border-l border-white/8
            flex flex-col p-6 z-20
            overflow-y-auto custom-scrollbar
          "
          role="complementary"
          aria-label={`Details for ${name}`}
        >
          {/* ── Close button ── */}
          <button
            id="panel-close"
            onClick={onClose}
            className="
              absolute top-4 right-4
              w-8 h-8 flex items-center justify-center
              rounded-full text-white/40 hover:text-white hover:bg-white/10
              transition-all duration-150 text-lg leading-none
            "
            aria-label="Close panel"
          >
            ×
          </button>

          {/* ── Flag + Name ── */}
          <div className="flex flex-col items-center text-center gap-3 mb-6 pt-2">
            {exactData?.flagCode ? (
              <img src={`https://flagcdn.com/h80/${exactData.flagCode}.png`} alt="Flag" className="h-[80px] object-cover rounded-md shadow-lg border border-white/10" />
            ) : (
              <span className="text-[56px] leading-none select-none" role="img">{flagEmoji(p.iso_a2)}</span>
            )}
            <h2 className="font-grotesk text-[28px] font-bold text-white leading-tight mt-2">
              {name}
            </h2>
            {continent && (
              <span className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full
                text-xs font-mono font-medium border
                ${badgeClass}
              `}>
                {continent}
              </span>
            )}
          </div>

          {/* ── Stats ── */}
          <div className="flex flex-col gap-3 mb-6">
            <StatRow label="Capital"    value={capital}        icon="📍" />
            <StatRow label="Population" value={formatPop(pop)} icon="👥" />
            <StatRow label="Languages"  value={languages}      icon="🗣️" />
            <StatRow label="Currency"   value={currency}       icon="💰" />
            <StatRow label="Continent"  value={continent || 'N/A'} icon="🌐" />
          </div>

          {/* ── Confidence ── */}
          <div className="mb-6 space-y-3 bg-white/5 rounded-xl p-4 border border-white/5">
             <ConfBar label="Location" val={prog.locationConf} />
             <ConfBar label="Capital" val={prog.capitalConf} />
             <ConfBar label="Flag" val={prog.flagConf} />
          </div>

          {/* ── Fun Fact ── */}
          {funFact && (
            <div className="mb-6 bg-cyan/10 border border-cyan/20 rounded-xl p-4">
              <p className="text-xs text-cyan font-mono uppercase tracking-widest mb-2 font-semibold flex items-center gap-2">
                <span>💡</span> Fun Fact
              </p>
              <p className="text-sm text-cyan/90 italic font-inter font-medium leading-relaxed">
                {funFact}
              </p>
            </div>
          )}

          {/* ── CTA ── */}
          <div className="flex flex-col gap-3 mt-auto">
            {exactData?.borders?.length > 0 && (
              <Button
                variant="secondary"
                className="w-full justify-center"
                onClick={onToggleBorders}
              >
                {isBorderViewActive ? 'Hide Borders' : 'View Borders'}
              </Button>
            )}
            
            <div className="relative">
               <Button
                 variant="primary"
                 className="w-full justify-center"
                 onClick={() => setShowPractice(!showPractice)}
               >
                 Practice This Country
               </Button>
               <AnimatePresence>
                 {showPractice && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-[calc(100%+8px)] left-0 w-full bg-[#1a1a2e] border border-white/10 rounded-xl p-2 shadow-xl z-50 flex flex-col gap-1">
                     <Link to="/find" className="px-4 py-2 hover:bg-white/10 rounded-lg text-sm text-white">Find on Globe</Link>
                     <Link to="/name" className="px-4 py-2 hover:bg-white/10 rounded-lg text-sm text-white">Name Country</Link>
                     <Link to="/flag" className="px-4 py-2 hover:bg-white/10 rounded-lg text-sm text-white">Flag Quiz</Link>
                     <Link to="/capital" className="px-4 py-2 hover:bg-white/10 rounded-lg text-sm text-white">Capitals Quiz</Link>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </motion.aside>
        )
      )}
    </AnimatePresence>
  )
}

function ConfBar({ label, val }) {
  return (
    <div className="flex items-center justify-between text-xs font-inter">
       <span className="text-white/60 w-16">{label}</span>
       <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden mx-3">
          <div className="h-full bg-violet" style={{ width: `${Math.max(0, Math.min(100, val))}%` }} />
       </div>
       <span className="text-white w-8 text-right font-mono">{Math.round(val)}%</span>
    </div>
  )
}

/* ── Helper sub-component ─────────────────────────────── */
function StatRow({ label, value, icon, mono = false }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <span className="flex items-center gap-2 text-xs text-white/50 font-inter">
        <span>{icon}</span>
        {label}
      </span>
      <span className={`text-sm text-white font-medium ${mono ? 'font-mono' : 'font-inter'}`}>
        {value}
      </span>
    </div>
  )
}
