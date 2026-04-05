import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Globe3D, AnswerInput, Button } from '../components'
import { useCountryGame } from '../hooks/useCountryGame'
import { useWorldData } from '../context/WorldDataContext'

export default function NameCountry() {
  const { countries, geoData } = useWorldData()
  const {
    currentCountry, score, combo, questionCount, maxQuestions,
    isFinished, nextQuestion, handleAnswer, restartGame
  } = useCountryGame('name')

  const [isHardMode, setIsHardMode] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [colors, setColors] = useState({})
  
  // Tracking selected/correct for AnswerInput visual feedback
  const [selectedOption, setSelectedOption] = useState(null)
  
  // Convert currentCountry from dataset into GeoJSON feature so Globe3D can zoom to it
  const geoFeature = useMemo(() => {
    if (!currentCountry || !geoData) return null
    return geoData.features.find(f => {
      const cid = f.id || f.properties?.iso_a3 || f.properties?.ISO_A3
      return cid === currentCountry.id
    })
  }, [currentCountry, geoData])

  // Generate 4 options for Easy mode
  const easyOptions = useMemo(() => {
    if (!currentCountry || !countries) return []
    const wrong = []
    while(wrong.length < 3) {
      const rnd = countries[Math.floor(Math.random() * countries.length)]
      if (rnd.id !== currentCountry.id && !wrong.find(c => c.id === rnd.id)) {
        wrong.push(rnd)
      }
    }
    // Shuffle with correct
    return [currentCountry, ...wrong].sort(() => Math.random() - 0.5)
  }, [currentCountry, countries])

  const handleAnswerSubmit = (answerName) => {
    if (processing || isFinished || !currentCountry) return
    setProcessing(true)
    setSelectedOption(answerName)

    // case-insensitive exact check
    const isCorrect = answerName.toLowerCase().trim() === currentCountry.name.toLowerCase().trim()
    const cid = currentCountry.id

    if (isCorrect) {
      setColors({ [cid]: { cap: 'rgba(0, 255, 178, 0.4)', stroke: '#00FFB2', altitude: 0.02 } })
      handleAnswer(true)
      setTimeout(() => {
        setColors({})
        setSelectedOption(null)
        setProcessing(false)
        nextQuestion()
      }, 1500)
    } else {
      // Find the deeply matching id for the wrong answer if an option was clicked
      const wrongCountry = countries.find(c => c.name.toLowerCase() === answerName.toLowerCase())
      const wrongId = wrongCountry?.id

      const newColors = {
        [cid]: { cap: 'rgba(0, 255, 178, 0.4)', stroke: '#00FFB2', altitude: 0.02 } // Show the correct one in green
      }
      if (wrongId) { // flash wrong answer coral
         newColors[wrongId] = { cap: 'rgba(255, 107, 107, 0.5)', stroke: '#FF6B6B', altitude: 0.02 }
      }
      setColors(newColors)
      
      handleAnswer(false, wrongId)
      setTimeout(() => {
        setColors({})
        setSelectedOption(null)
        setProcessing(false)
        nextQuestion()
      }, 2000)
    }
  }

  return (
    <div className="relative min-h-screen bg-space overflow-hidden flex flex-col">
      {/* HUD: Score & Progress */}
      {!isFinished && currentCountry && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-20 left-6 z-20 flex gap-4">
          <div className="glass-card px-4 py-2 flex items-center justify-center font-mono text-white/50 text-sm">
            {questionCount} / {maxQuestions}
          </div>
          <div className="glass-card px-4 py-2 flex items-center justify-center font-mono text-white text-sm">
            {score} PTS {combo > 1 && <span className="text-violet ml-2">x{combo}</span>}
          </div>
        </motion.div>
      )}

      {/* Main Layout */}
      <div className="relative flex-1">
        <Globe3D
          interactive={false} // User doesn't click globe to answer
          selectedCountry={!processing ? geoFeature : null} // Keep zoomed, but unselected color during processing handled by customColors
          customColors={colors}
          width="100%"
          height="100%"
        />

        <AnimatePresence>
          {!isFinished && currentCountry && (
            <AnswerInput
              isHardMode={isHardMode}
              toggleMode={setIsHardMode}
              onSubmit={handleAnswerSubmit}
              options={easyOptions}
              selectedOption={selectedOption}
              correctOption={currentCountry.name}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Session End Overlay */}
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
