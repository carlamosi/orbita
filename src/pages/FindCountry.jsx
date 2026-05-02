import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Globe3D, QuestionCard, Button } from '../components'
import { useCountryGame } from '../hooks/useCountryGame'
import { useWorldData } from '../context/WorldDataContext'
import { useKeyboard } from '../hooks/useKeyboard'
import { useMemo } from 'react'

export default function FindCountry() {
  const {
    currentCountry, score, combo, questionCount, maxQuestions,
    isFinished, nextQuestion, handleAnswer, restartGame
  } = useCountryGame('find')

  const [colors, setColors] = useState({})
  const [processing, setProcessing] = useState(false)
  const [showHint, setShowHint] = useState(false)

  // Keyboard: H for Hint
  useKeyboard(useMemo(() => ({
    'h': () => setShowHint(true),
    'H': () => setShowHint(true)
  }), []))

  const handleGlobeClick = (feature) => {
    if (processing || isFinished || !currentCountry) return
    const cid = feature.id || feature.properties?.iso_a3 || feature.properties?.ISO_A3
    setProcessing(true)

    if (cid === currentCountry.id) {
      // Correct
      setColors({ [cid]: { cap: 'rgba(0, 255, 178, 0.4)', stroke: '#00FFB2', altitude: 0.02 } })
      handleAnswer(true)
      setTimeout(() => {
        setColors({})
        setShowHint(false)
        setProcessing(false)
        nextQuestion()
      }, 1500)
    } else {
      // Wrong
      setColors({
        [cid]: { cap: 'rgba(255, 107, 107, 0.5)', stroke: '#FF6B6B', altitude: 0.02 },
        [currentCountry.id]: { cap: 'rgba(255, 165, 0, 0.5)', stroke: '#FFA500', altitude: 0.02 }
      })
      handleAnswer(false, cid)
      setTimeout(() => {
        setColors({})
        setShowHint(false)
        setProcessing(false)
        nextQuestion()
      }, 2000)
    }
  }

  return (
    <div className="relative h-[100dvh] bg-space flex flex-col overflow-visible">
      {/* ── Ambient Glows ── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan/5 blur-[100px] pointer-events-none" />

      {/* ── Main Game Layout ── */}
      <div className="relative flex-1 w-full h-full overflow-visible">
        <AnimatePresence>
          {!isFinished && currentCountry && (
            <QuestionCard
              countryName={currentCountry.name}
              current={questionCount}
              total={maxQuestions}
              score={score}
              onHint={() => {
                if (!showHint) {
                  setShowHint(true)
                  // Deduct simple hint penalty if wanted (hook handles it purely by user triggering it if we exposed a function)
                }
              }}
            />
          )}

          {/* Hint Overlay floating near card */}
          {showHint && !isFinished && currentCountry && (
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="absolute top-64 left-1/2 -translate-x-1/2 z-20 px-4 py-2 glass-card border-violet/30 text-white font-inter text-sm"
            >
              Hint: It is in <strong>{currentCountry.continent}</strong>.
            </motion.div>
          )}
        </AnimatePresence>

        <Globe3D
          interactive={!isFinished && !processing}
          customColors={colors}
          onCountrySelect={handleGlobeClick}
          width="100%"
          height="100%"
        />
      </div>

      {/* ── Session End Overlay ── */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="glass-card max-w-sm w-full p-8 flex flex-col items-center text-center">
              <h2 className="font-grotesk font-bold text-3xl text-white mb-2">Session Complete!</h2>
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
