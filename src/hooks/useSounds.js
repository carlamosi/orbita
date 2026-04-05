import { Howl } from 'howler'
import { useState, useCallback, useEffect } from 'react'

const SOUND_URLS = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3',
  streak: 'https://assets.mixkit.co/active_storage/sfx/2565/2565-preview.mp3',
  complete: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'
}

export function useSounds() {
  const [muted, setMuted] = useState(() => {
    return localStorage.getItem('orbita-muted') === 'true'
  })

  const [sounds] = useState(() => {
    const s = {}
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      s[key] = new Howl({ 
        src: [url],
        volume: 0.5,
        html5: true // Use HTML5 Audio to allow large files and better caching
      })
    })
    return s
  })

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const newMuted = !m
      localStorage.setItem('orbita-muted', String(newMuted))
      return newMuted
    })
  }, [])

  const playSound = useCallback((type) => {
    if (muted || !sounds[type]) return
    sounds[type].play()
  }, [muted, sounds])

  return {
    muted,
    toggleMute,
    playCorrect: () => playSound('correct'),
    playWrong: () => playSound('wrong'),
    playStreak: () => playSound('streak'),
    playComplete: () => playSound('complete')
  }
}
