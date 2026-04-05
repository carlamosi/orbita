import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorldData } from '../context/WorldDataContext'

export default function AnswerInput({
  isHardMode,
  toggleMode,
  onSubmit, // (answerName) => void
  options,  // array of 4 objects for easy mode
  selectedOption, // name of selected
  correctOption,  // name of correct
  searchField = 'name' // 'name' | 'capital'
}) {
  const { countries } = useWorldData()
  const [inputVal, setInputVal] = useState('')
  const [suggestions, setSuggestions] = useState([])

  // Hard mode dropdown filtering
  useEffect(() => {
    if (!inputVal.trim()) {
      setSuggestions([])
      return
    }
    const filtered = countries
      .filter(c => {
        const val = c[searchField]
        return typeof val === 'string' && val.toLowerCase().includes(inputVal.toLowerCase())
      })
      .slice(0, 6)
    setSuggestions(filtered)
  }, [inputVal, countries, searchField])

  const handleSuggestionClick = (nameOrCapital) => {
    setInputVal('')
    setSuggestions([])
    onSubmit(nameOrCapital)
  }

  const getBtnClass = (optName) => {
    if (selectedOption) {
      if (optName === correctOption) return 'bg-[#00FFB2]/20 border-[#00FFB2]/50 text-white shadow-[0_0_20px_rgba(0,255,178,0.2)]'
      if (optName === selectedOption) return 'bg-[#FF6B6B]/20 border-[#FF6B6B]/50 text-white'
      return 'opacity-30 border-white/5 text-white/50'
    }
    return 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-violet/50'
  }

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 w-full max-w-[480px] px-4"
    >
      <div className="glass-card p-6 w-full flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-inter text-[#8B8FA8]">What country is this?</span>
          <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
            <button
              onClick={() => toggleMode(false)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                !isHardMode ? 'bg-violet text-white shadow-md' : 'text-white/40 hover:text-white'
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => toggleMode(true)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                isHardMode ? 'bg-violet text-white shadow-md' : 'text-white/40 hover:text-white'
              }`}
            >
              Hard
            </button>
          </div>
        </div>

        {/* Dynamic Input Area */}
        {isHardMode ? (
          <div className="relative">
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Type country name..."
              className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white font-inter outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-all"
            />
              <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-2 left-0 w-full bg-[#0d0d12] border border-white/15 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-30"
                >
                  {suggestions.map((s, i) => (
                    <li key={i}>
                      <button
                        onClick={() => handleSuggestionClick(searchField === 'capital' ? s.capital : s.name)}
                        className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-violet/20 hover:text-white transition-colors border-b border-white/5 last:border-0"
                      >
                         {searchField === 'capital' ? s.capital : s.name}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt, i) => (
              <button
                key={i}
                disabled={!!selectedOption}
                onClick={() => onSubmit(opt.name)}
                className={`py-3 px-4 rounded-xl border text-sm font-inter transition-all duration-300 text-center truncate ${getBtnClass(opt.name)}`}
              >
                {opt.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
