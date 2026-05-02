import { useState, useEffect, useCallback } from 'react'
import { useWorldData } from '../context/WorldDataContext'
import { useGameStore } from '../store/useGameStore'
import { useSounds } from './useSounds'

export function useCountryGame(mode = 'find', customPool = null) {
  const { countries, geoData } = useWorldData()
  const logSession       = useGameStore(s => s.actions.logSession)
  const updateProgress   = useGameStore(s => s.actions.updateProgress)
  const incrementStreak  = useGameStore(s => s.actions.incrementStreak)
  const incrementFlagSessions = useGameStore(s => s.actions.incrementFlagSessions)
  const { playCorrect, playWrong, playStreak, playComplete } = useSounds()

  const [questionCount, setQuestionCount]   = useState(0)
  const [currentCountry, setCurrentCountry] = useState(null)
  
  // Scoring
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  
  // Game limits
  const MAX_QUESTIONS = 20
  const [isFinished, setIsFinished] = useState(false)

  // Initialization & Next Question
  const nextQuestion = useCallback(() => {
    if (!countries || !geoData) return
    
    if (questionCount >= MAX_QUESTIONS) {
      setIsFinished(true)
      logSession(mode, score)
      incrementStreak()
      if (mode === 'flag') incrementFlagSessions()
      playComplete()
      return
    }

    // Pick a random country. (Improvement: weight by difficulty or spaced repetition later)
    const activePool = customPool && customPool.length > 0 ? customPool : countries
    
    let randomC = null
    let attempts = 0
    while (!randomC && attempts < 100) {
       const pick = activePool[Math.floor(Math.random() * activePool.length)]
       
       // Ensure there's a matching GeoJSON shape for this country to avoid broken questions,
       // unless it's a mode that doesn't use the globe (like flag)
       if (mode === 'flag' || mode === 'capital') {
         randomC = pick
       } else {
         const hasShape = geoData.features.some(f => {
           const cid = f.id || f.properties?.iso_a3 || f.properties?.ISO_A3
           return cid === pick.id
         })
         if (hasShape) randomC = pick
       }
       attempts++
    }
    
    setCurrentCountry(randomC)
    setQuestionCount(c => c + 1)
  }, [countries, geoData, questionCount, mode, score, logSession, incrementStreak, incrementFlagSessions, customPool])

  // Start game when data is loaded
  useEffect(() => {
    if ((customPool || countries) && geoData && questionCount === 0) {
      nextQuestion()
    }
  }, [countries, geoData, questionCount, nextQuestion, customPool])

  // Handlers
  const handleAnswer = (isCorrect, answerId = null) => {
    if (!currentCountry) return

    const confType = mode === 'flag' ? 'flagConf' : mode === 'capital' ? 'capitalConf' : 'locationConf'

    if (isCorrect) {
      setCombo(c => c + 1)
      setScore(s => s + 10 + (combo * 2)) // bonus points for combo
      if (combo >= 2) playStreak() // 3rd correct in a row
      else playCorrect()
      
      // Update store confidence
      updateProgress(currentCountry.id, confType, 15)
    } else {
      setCombo(0)
      playWrong()
      // Log wrong
      updateProgress(currentCountry.id, confType, -10, true)
      if (answerId) {
        // Punish the wrongly selected country too playfully
        updateProgress(answerId, confType, -5, true)
      }
    }
  }

  const restartGame = () => {
    setQuestionCount(0)
    setScore(0)
    setCombo(0)
    setIsFinished(false)
  }

  return {
    currentCountry,
    score,
    combo,
    questionCount,
    maxQuestions: MAX_QUESTIONS,
    isFinished,
    nextQuestion,
    handleAnswer,
    restartGame
  }
}
