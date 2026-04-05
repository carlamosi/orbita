import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWorldData } from '../context/WorldDataContext'
import { useGameStore } from '../store/useGameStore'
import { useSounds } from '../hooks/useSounds'
import { useKeyboard } from '../hooks/useKeyboard'
import CircleTimer from '../components/CircleTimer'
import Button from '../components/Button'

export default function SpeedRound() {
  const [searchParams] = useSearchParams()
  const activeContinent = searchParams.get('continent') || 'all'

  const { countries } = useWorldData()
  const addSpeedScore = useGameStore(s => s.actions.addSpeedScore)
  const speedRoundBests = useGameStore(s => s.speedRoundBests) || []
  const { playCorrect, playWrong, playComplete } = useSounds()

  const [hasUsedKeyboard, setHasUsedKeyboard] = useState(() => 
    localStorage.getItem('orbita-has-used-keyboard') === 'true'
  )

  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  
  const [flash, setFlash] = useState(null) // 'white' overlay trigger
  
  // -- Question Engine State --
  const [currentQ, setCurrentQ] = useState(null)
  
  const bestScore = speedRoundBests[0]?.score || 0

  // Generator
  const generateQuestion = () => {
    if (!countries || countries.length === 0) return null
    
    // Filter pool
    let activePool = countries
    if (activeContinent !== 'all') {
      activePool = countries.filter(c => c.continent === activeContinent || c.region === activeContinent)
    }
    
    // Pick 4 unique countries, first is correct
    const pool = [...activePool].sort(() => Math.random() - 0.5).slice(0, 4)
    const target = pool[0]
    
    // Shuffle options for rendering
    const options = [...pool].sort(() => Math.random() - 0.5)
    
    const types = ['flag_to_name', 'name_to_flag', 'capital_to_name', 'name_to_capital']
    const type = types[Math.floor(Math.random() * types.length)]
    
    return { target, options, type }
  }

  // Next Question Engine
  const nextQuestion = () => {
    // Trigger 1-frame flash
    setFlash(true)
    setTimeout(() => setFlash(false), 50)
    
    setCurrentQ(generateQuestion())
  }

  // Answer handler
  const handleAnswer = (optCountryId) => {
    if (!currentQ) return
    const isCorrect = optCountryId === currentQ.target.id
    
    if (isCorrect) {
      setScore(s => s + 10)
      setCorrectCount(c => c + 1)
      playCorrect()
    } else {
      setWrongCount(c => c + 1)
      playWrong()
    }
    
    nextQuestion()
  }

  // Keyboard support logic
  const keyboardHandlers = useMemo(() => {
    if (!isRunning || !currentQ) return {}
    return {
      '1': () => handleAnswer(currentQ.options[0].id),
      '2': () => handleAnswer(currentQ.options[1].id),
      '3': () => handleAnswer(currentQ.options[2].id),
      '4': () => handleAnswer(currentQ.options[3].id),
      'Enter': () => { if (!isRunning && !isFinished) startGame() }
    }
  }, [isRunning, currentQ])

  useKeyboard(keyboardHandlers)

  useEffect(() => {
    // Refresh hasUsedKeyboard status when it changes in localStorage
    const checkKbd = () => {
      if (localStorage.getItem('orbita-has-used-keyboard') === 'true') {
        setHasUsedKeyboard(true)
      }
    }
    window.addEventListener('keydown', checkKbd)
    return () => window.removeEventListener('keydown', checkKbd)
  }, [])

  const startGame = () => {
    setScore(0)
    setCorrectCount(0)
    setWrongCount(0)
    setIsFinished(false)
    setIsRunning(true)
    setCurrentQ(generateQuestion())
  }

  const handleTimeUp = () => {
    setIsRunning(false)
    setIsFinished(true)
    playComplete()
    const total = correctCount + wrongCount
    const qpm = total // 60s game = 1 min
    addSpeedScore(score, `${correctCount}/${total}`, qpm, activeContinent)
    
    // If perfect continent (correct > 0 and no wrong)
    if (activeContinent !== 'all' && wrongCount === 0 && correctCount > 0) {
      useGameStore.getState().actions.unlockChallenge(`perfect_${activeContinent}`, true)
    }
  }

  // Helper for Sound Triggers
  const triggerFeedback = (isCorrect) => {
    if (isCorrect) playCorrect()
    else playWrong()
    
    setFlash(true)
    setTimeout(() => setFlash(false), 50)
  }

  return (
    <div className="relative min-h-screen bg-[#050508] overflow-hidden flex flex-col pt-24 px-6 md:px-12 lg:px-24">
      {/* 1-Frame Flash Overlay */}
      {flash && <div className="absolute inset-0 bg-white z-[100] mix-blend-screen pointer-events-none" />}

      {/* -- START SCREEN -- */}
      {!isRunning && !isFinished && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="font-grotesk text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-[0_0_40px_rgba(108,99,255,0.4)]">
            SPEED ROUND
            {activeContinent !== 'all' && <span className="block text-2xl text-neon mt-2">{activeContinent} Edition</span>}
          </h1>
          <p className="font-inter text-[#8B8FA8] text-lg max-w-md mb-8">
            60 seconds. Rapid fire questions. Capital, Flags, and Names. How fast are your reflexes?
          </p>
          <Button variant="primary" onClick={startGame} className="px-12 py-4 text-lg">START TIMER</Button>
          {bestScore > 0 && <p className="mt-6 font-mono text-violet">Top Score: {bestScore} PTS</p>}
        </div>
      )}

      {/* -- PLAY SCREEN -- */}
      {isRunning && currentQ && (
        <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 relative">
          
          {/* Top/Right Timer */}
          <div className="absolute top-0 right-0 z-30">
            <CircleTimer durationSeconds={60} isRunning={isRunning} onComplete={handleTimeUp} />
          </div>

          <div className="flex-1 pt-12 md:pt-4 flex flex-col max-w-2xl">
              
            {/* Header / Prompt */}
            <div className="mb-8 h-[240px] flex flex-col justify-end">
              {currentQ.type === 'flag_to_name' && (
                <>
                  <p className="font-inter text-[#8B8FA8] mb-4">Which country is this flag?</p>
                  <img src={`https://flagcdn.com/w320/${currentQ.target.flagCode}.png`} alt="Flag" className="h-40 object-contain rounded-lg shadow-lg origin-left bg-white/5" />
                </>
              )}
              {currentQ.type === 'name_to_flag' && (
                <>
                  <p className="font-inter text-[#8B8FA8] mb-4">Pick the flag for:</p>
                  <h2 className="font-grotesk text-4xl md:text-5xl font-bold text-white">{currentQ.target.name}</h2>
                </>
              )}
              {currentQ.type === 'capital_to_name' && (
                <>
                  <p className="font-inter text-[#8B8FA8] mb-4">Which country has the capital:</p>
                  <h2 className="font-grotesk text-4xl md:text-5xl font-bold text-white tracking-wide">{currentQ.target.capital}</h2>
                </>
              )}
              {currentQ.type === 'name_to_capital' && (
                <>
                  <p className="font-inter text-[#8B8FA8] mb-4">What is the capital of:</p>
                  <h2 className="font-grotesk text-4xl md:text-5xl font-bold text-white tracking-wide">{currentQ.target.name}</h2>
                </>
              )}
            </div>

            {/* Answers Grid */}
            <div className="grid grid-cols-2 gap-4">
              {currentQ.options.map((opt, idx) => {
                const keyHint = idx + 1
                if (currentQ.type === 'name_to_flag') {
                  // Render flags as buttons
                  return (
                    <button key={opt.id} onClick={() => handleAnswer(opt.id)} className="group/btn relative w-full aspect-[3/2] glass-card overflow-hidden hover:scale-[1.02] active:scale-95 transition-transform border border-white/10 hover:border-violet p-0">
                       <img src={`https://flagcdn.com/w320/${opt.flagCode}.png`} alt="flag" className="w-full h-full object-cover" />
                       {!hasUsedKeyboard && <span className="absolute top-2 right-2 bg-black/60 text-[11px] font-mono text-[#8B8FA8] px-2 py-0.5 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity">[{keyHint}]</span>}
                    </button>
                  )
                }

                // Render text strings as buttons
                let label = ''
                if (currentQ.type === 'flag_to_name' || currentQ.type === 'capital_to_name') label = opt.name
                if (currentQ.type === 'name_to_capital') label = opt.capital

                return (
                  <button key={opt.id} onClick={() => handleAnswer(opt.id)} className="group/btn relative w-full py-6 px-4 glass-card text-center transition-transform hover:scale-[1.02] active:scale-95 hover:bg-white/10 hover:border-violet border border-white/5 text-lg font-inter text-white truncate">
                    {label}
                    {!hasUsedKeyboard && <span className="absolute top-2 right-2 text-[11px] font-mono text-[#8B8FA8] opacity-0 group-hover/btn:opacity-100 transition-opacity">[{keyHint}]</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* -- END SCREEN -- */}
      {isFinished && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
           {score > bestScore ? (
             <div className="font-inter text-neon bg-neon/10 px-4 py-1 rounded-full mb-6 relative animate-pulse">🏆 New Record!</div>
           ) : (
             <div className="font-inter text-[#8B8FA8] mb-6">+{score} from your previous attempts</div>
           )}

           {/* Significant vertical breathing room as requested */}
           <div className="text-[120px] md:text-[160px] font-mono font-bold leading-none text-white my-8 drop-shadow-[0_0_80px_rgba(108,99,255,0.6)]">
             {score}
           </div>

           <div className="flex items-center gap-12 mt-4 mb-24">
              <div className="flex flex-col">
                <span className="font-mono text-2xl text-white">{correctCount}/{correctCount+wrongCount}</span>
                <span className="font-inter text-[#8B8FA8] text-sm uppercase tracking-widest mt-1">Accuracy</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-2xl text-white">{correctCount+wrongCount}</span>
                <span className="font-inter text-[#8B8FA8] text-sm uppercase tracking-widest mt-1">QPM</span>
              </div>
           </div>

           <div className="flex w-full max-w-sm gap-4">
              <Button variant="primary" className="flex-1 justify-center" onClick={startGame}>Try Again</Button>
              <Link to="/" className="flex-1"><Button variant="secondary" className="w-full justify-center">Home</Button></Link>
           </div>
        </div>
      )}
    </div>
  )
}
