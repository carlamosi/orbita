import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Confetti, Button } from '../components'
import { useCountryGame } from '../hooks/useCountryGame'
import { useWorldData } from '../context/WorldDataContext'
import { useKeyboard } from '../hooks/useKeyboard'

export default function FlagQuiz() {
  const { countries } = useWorldData()
  const [subMode, setSubMode] = useState('flag-to-country') // 'flag-to-country' | 'country-to-flag'
  const [similarMode, setSimilarMode] = useState(false)

  // Filter pool if similar flags mode is active
  const pool = useMemo(() => {
    if (!countries) return []
    if (!similarMode) return countries
    return countries.filter(c => !!c.similarTo)
  }, [countries, similarMode])

  const {
    currentCountry, score, combo, questionCount, maxQuestions,
    isFinished, nextQuestion, handleAnswer, restartGame
  } = useCountryGame('flag', pool)

  const [processing, setProcessing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  
  const [hasUsedKeyboard, setHasUsedKeyboard] = useState(() => 
    localStorage.getItem('orbita-has-used-keyboard') === 'true'
  )

  useEffect(() => {
    const checkKbd = () => {
      if (localStorage.getItem('orbita-has-used-keyboard') === 'true') {
        setHasUsedKeyboard(true)
      }
    }
    window.addEventListener('keydown', checkKbd)
    return () => window.removeEventListener('keydown', checkKbd)
  }, [])

  const options = useMemo(() => {
    if (!currentCountry || !countries) return []
    const wrongs = []
    
    // If similar mode is ON, and current country has a simliar match, explicitly include it to trip the user!
    if (similarMode && currentCountry.similarTo) {
      const match = countries.find(c => c.id === currentCountry.similarTo)
      if (match) wrongs.push(match)
    }

    // Fill the rest with random (but also restricted to pool if similar is on)
    while(wrongs.length < 3) {
      const rndList = similarMode ? pool : countries
      const rnd = rndList[Math.floor(Math.random() * rndList.length)]
      if (rnd.id !== currentCountry.id && !wrongs.find(c => c.id === rnd.id)) {
        wrongs.push(rnd)
      }
    }
    return [currentCountry, ...wrongs].sort(() => Math.random() - 0.5)
  }, [currentCountry, countries, similarMode, pool])

  const handleSelect = (cid) => {
    if (processing || isFinished) return
    setProcessing(true)
    setSelectedOption(cid)

    if (cid === currentCountry.id) {
      handleAnswer(true)
      setShowConfetti(true)
      setTimeout(() => {
        setShowConfetti(false)
        setSelectedOption(null)
        setProcessing(false)
        nextQuestion()
      }, 1500)
    } else {
      handleAnswer(false, cid)
      setTimeout(() => {
        setSelectedOption(null)
        setProcessing(false)
        nextQuestion()
      }, 2000)
    }
  }

  // Keyboard Navigation
  const keyboardHandlers = useMemo(() => {
    if (processing || isFinished || !options.length) return {}
    return {
      '1': () => handleSelect(options[0].id),
      '2': () => handleSelect(options[1].id),
      '3': () => handleSelect(options[2].id),
      '4': () => handleSelect(options[3].id),
    }
  }, [processing, isFinished, options])

  useKeyboard(keyboardHandlers)

  const getBtnClassText = (cid) => {
    if (selectedOption) {
      if (cid === currentCountry.id) return 'bg-[#00FFB2]/20 border-[#00FFB2]/50 text-white shadow-[0_0_20px_rgba(0,255,178,0.2)] scale-[1.02]'
      if (cid === selectedOption) return 'bg-[#FF6B6B]/20 border-[#FF6B6B]/50 text-white'
      return 'opacity-30 border-white/5 text-white/50'
    }
    return 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-violet/50'
  }

  const getBtnClassImg = (cid) => {
    if (selectedOption) {
      if (cid === currentCountry.id) return 'ring-4 ring-[#00FFB2] scale-105 shadow-[0_0_30px_rgba(0,255,178,0.4)]'
      if (cid === selectedOption) return 'ring-4 ring-[#FF6B6B] opacity-50'
      return 'opacity-20 '
    }
    return 'hover:ring-2 hover:ring-violet/50 hover:scale-[1.02]'
  }

  return (
    <div className="relative min-h-screen bg-[#050508] overflow-hidden flex flex-col items-center pt-24 pb-8 px-4">
      {/* Confetti Explosion Layer */}
      <Confetti active={showConfetti} />

      {/* Toggles (Header) */}
      {!isFinished && (
        <div className="flex flex-col items-center gap-6 mb-8 w-full max-w-lg z-20">
          <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
            <button
              onClick={() => setSubMode('flag-to-country')}
              className={`px-4 py-1.5 text-sm rounded-full font-medium transition-all ${
                subMode === 'flag-to-country' ? 'bg-violet text-white shadow-md' : 'text-white/40 hover:text-white'
              }`}
            >
              Flag → Country
            </button>
            <button
              onClick={() => setSubMode('country-to-flag')}
              className={`px-4 py-1.5 text-sm rounded-full font-medium transition-all ${
                subMode === 'country-to-flag' ? 'bg-violet text-white shadow-md' : 'text-white/40 hover:text-white'
              }`}
            >
              Country → Flag
            </button>
          </div>
          
          {/* Similar Flags Challenge Match Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={`w-4 h-4 rounded tap-transparent border flex items-center justify-center transition-all ${
              similarMode ? 'bg-violet border-violet' : 'border-white/20 group-hover:border-white/50'
            }`}>
              {similarMode && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
            </div>
            <span className={`text-sm tracking-wide ${similarMode ? 'text-white font-medium' : 'text-[#8B8FA8]'}`}>
              Similar Flags Challenge
            </span>
          </label>
        </div>
      )}

      {/* Main HUD */}
      {!isFinished && currentCountry && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-20 left-6 z-20 flex gap-4">
          <div className="glass-card px-4 py-2 flex items-center justify-center font-mono text-white/50 text-sm">
            {questionCount} / {maxQuestions}
          </div>
          <div className="glass-card px-4 py-2 flex items-center justify-center font-mono text-white text-sm">
            {score} PTS {combo > 1 && <span className="text-violet ml-2">x{combo}</span>}
          </div>
        </motion.div>
      )}

      {/* Cards Space */}
      <AnimatePresence mode="wait">
        {!isFinished && currentCountry && (
          <motion.div
            key={currentCountry.id + subMode}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg flex flex-col items-center z-10"
          >
            {subMode === 'flag-to-country' ? (
              // Mode A
              <>
                <div className="w-[320px] h-[213px] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10 mb-8 relative bg-white/5">
                  <img src={`https://flagcdn.com/w320/${currentCountry.flagCode}.png`} alt={`Identify this flag`} className="w-full h-full object-cover" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  {options.map((opt, idx) => (
                    <button
                      key={opt.id}
                      disabled={processing}
                      onClick={() => handleSelect(opt.id)}
                      className={`group/btn relative py-4 px-4 rounded-xl border text-sm font-inter transition-all duration-300 text-center glass-card ${getBtnClassText(opt.id)}`}
                      aria-label={`Option ${idx + 1}: ${opt.name}`}
                    >
                      {opt.name}
                      {!hasUsedKeyboard && <span className="absolute top-1 right-2 text-[10px] font-mono text-[#8B8FA8] opacity-0 group-hover/btn:opacity-100 transition-opacity">[{idx+1}]</span>}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              // Mode B
              <>
                <h2 className="font-grotesk text-[36px] font-bold text-white text-center mb-8 drop-shadow-xl">
                  {currentCountry.name}
                </h2>
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  {options.map((opt, idx) => (
                    <button
                      key={opt.id}
                      disabled={processing}
                      onClick={() => handleSelect(opt.id)}
                      className={`group/btn relative w-full aspect-[3/2] rounded-xl overflow-hidden glass-card p-0 transition-all duration-300 border border-white/10 ${getBtnClassImg(opt.id)}`}
                      aria-label={`Option ${idx + 1}: Flag of ${opt.name}`}
                    >
                      <img src={`https://flagcdn.com/w320/${opt.flagCode}.png`} alt={`Flag of ${opt.name}`} className="w-full h-full object-cover" />
                      {!hasUsedKeyboard && <span className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-mono text-[#8B8FA8] opacity-0 group-hover/btn:opacity-100 transition-opacity">[{idx+1}]</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session End Overlay */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="glass-card max-w-sm w-full p-8 flex flex-col items-center text-center">
              <h2 className="font-grotesk font-bold text-3xl text-white mb-2">Quiz Complete!</h2>
              <div className="text-[64px] leading-none mb-1 text-glow-violet font-mono">{score}</div>
              <p className="font-inter text-[#8B8FA8] mb-8">Points Earned</p>
              
              <div className="flex w-full gap-4">
                <Button variant="primary" className="flex-1 justify-center" onClick={restartGame}>Play Again</Button>
                <Link to="/" className="flex-1"><Button variant="secondary" className="w-full justify-center">Home</Button></Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
