import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Globe3D, Confetti, Button, AnswerInput } from '../components'
import { useCountryGame } from '../hooks/useCountryGame'
import { useWorldData } from '../context/WorldDataContext'

export default function CapitalQuiz() {
  const { countries, geoData } = useWorldData()
  const [subMode, setSubMode] = useState('country-to-capital') // 'country-to-capital' | 'capital-to-country' | 'locate'

  const {
    currentCountry, score, combo, questionCount, maxQuestions,
    isFinished, nextQuestion, handleAnswer, restartGame
  } = useCountryGame('capital')

  const [processing, setProcessing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [colors, setColors] = useState({}) // For globe colors
  
  // -- HANDLERS FOR TEXT MODES (A & B) --
  const handleTextSubmit = (answerStr) => {
    if (processing || isFinished || !currentCountry) return
    setProcessing(true)

    // Check depends on mode
    let isCorrect = false
    if (subMode === 'country-to-capital') {
      isCorrect = answerStr.toLowerCase().trim() === currentCountry.capital.toLowerCase().trim()
    } else {
      isCorrect = answerStr.toLowerCase().trim() === currentCountry.name.toLowerCase().trim()
    }

    if (isCorrect) {
      handleAnswer(true)
      setShowConfetti(true)
      setTimeout(() => {
        setShowConfetti(false)
        setProcessing(false)
        nextQuestion()
      }, 1500)
    } else {
      handleAnswer(false)
      setTimeout(() => {
        setProcessing(false)
        nextQuestion()
      }, 2000)
    }
  }

  // -- HANDLERS FOR GLOBE LOCATE MODE (C) --
  const handleGlobeClick = (feature) => {
    if (subMode !== 'locate' || processing || isFinished || !currentCountry) return
    setProcessing(true)

    const cid = feature.id || feature.properties?.iso_a3 || feature.properties?.ISO_A3

    if (cid === currentCountry.id) {
      setColors({ [cid]: { cap: 'rgba(0, 255, 178, 0.4)', stroke: '#00FFB2', altitude: 0.02 } })
      handleAnswer(true)
      setTimeout(() => {
        setColors({})
        setProcessing(false)
        nextQuestion()
      }, 1500)
    } else {
      setColors({
        [cid]: { cap: 'rgba(255, 107, 107, 0.5)', stroke: '#FF6B6B', altitude: 0.02 },
        [currentCountry.id]: { cap: 'rgba(255, 165, 0, 0.5)', stroke: '#FFA500', altitude: 0.02 }
      })
      handleAnswer(false, cid)
      setTimeout(() => {
        setColors({})
        setProcessing(false)
        nextQuestion()
      }, 2000)
    }
  }

  return (
    <div className={`relative h-[100dvh] flex flex-col items-center px-4 overflow-visible ${subMode === 'locate' ? 'bg-[#050508]' : 'bg-[#050508] pt-20 pb-4'}`}>
      <Confetti active={showConfetti} />

      {/* Tabs / Mode Selector (Header) */}
      {!isFinished && (
        <div className={`flex flex-col items-center gap-3 sm:gap-6 mb-4 sm:mb-8 w-full max-w-lg z-20 shrink-0 ${subMode === 'locate' ? 'absolute top-20 left-1/2 -translate-x-1/2' : ''}`}>
          <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10 scale-90 sm:scale-100">
            <button
              onClick={() => setSubMode('country-to-capital')}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-full font-medium transition-all ${
                subMode === 'country-to-capital' ? 'bg-violet text-white shadow-md' : 'text-white/40 hover:text-white'
              }`}
            >
              → Capital
            </button>
            <button
              onClick={() => setSubMode('capital-to-country')}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-full font-medium transition-all ${
                subMode === 'capital-to-country' ? 'bg-violet text-white shadow-md' : 'text-white/40 hover:text-white'
              }`}
            >
              → Country
            </button>
            <button
              onClick={() => setSubMode('locate')}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-full font-medium transition-all ${
                subMode === 'locate' ? 'bg-violet text-white shadow-md' : 'text-white/40 hover:text-white'
              }`}
            >
              On Globe
            </button>
          </div>
        </div>
      )}

      {/* Main HUD */}
      {!isFinished && currentCountry && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-16 left-4 z-20 flex gap-2 sm:gap-4 scale-90 sm:scale-100 origin-top-left pointer-events-none">
          <div className="glass-card px-4 py-2 flex items-center justify-center font-mono text-white/50 text-sm">
            {questionCount} / {maxQuestions}
          </div>
          <div className="glass-card px-4 py-2 flex items-center justify-center font-mono text-white text-sm">
            {score} PTS {combo > 1 && <span className="text-violet ml-2">x{combo}</span>}
          </div>
        </motion.div>
      )}

      {/* Body Area */}
      {!isFinished && currentCountry && (
        <>
          {subMode === 'locate' ? (
            <div className="absolute inset-0 z-10 w-full h-full overflow-visible">
              <div className="absolute top-36 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
                <span className="font-inter text-sm text-[#8B8FA8] bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md">
                  Click where <strong className="text-white ml-1">{currentCountry.capital}</strong> is located
                </span>
              </div>
              <Globe3D
                interactive={!processing}
                customColors={colors}
                showCapitals={true}
                onCountrySelect={handleGlobeClick}
                width="100%"
                height="100%"
              />
            </div>
          ) : (
            <motion.div
              key={currentCountry.id + subMode}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg flex flex-col items-center justify-center mt-4 sm:mt-12 z-10 relative flex-1 min-h-0"
            >
              <div className="glass-card w-full text-center p-6 sm:p-8 mb-4 sm:mb-8 border-t-2 border-t-white/10 shrink-0">
                <h2 className="font-grotesk text-[20px] sm:text-[28px] font-bold text-white mb-2 sm:mb-4 leading-tight">
                  {subMode === 'country-to-capital' 
                    ? `What is the capital of ${currentCountry.name}?` 
                    : `${currentCountry.capital} is the capital of which country?`}
                </h2>
              </div>
              
              <div className="w-full relative h-[250px] sm:h-[300px] shrink-0">
                <AnswerInput
                  isHardMode={true} // Strictly dropdown text input per instruction
                  toggleMode={() => {}} // Disabled toggle
                  onSubmit={handleTextSubmit}
                  correctOption={subMode === 'country-to-capital' ? currentCountry.capital : currentCountry.name}
                  searchField={subMode === 'country-to-capital' ? 'capital' : 'name'}
                />
                
                {/* Visual Feedback on Processing */}
                <AnimatePresence>
                  {processing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex place-content-center pt-8">
                       <span className="text-white/50 text-sm font-mono tracking-widest uppercase animate-pulse">Checking Data...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </>
      )}

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
