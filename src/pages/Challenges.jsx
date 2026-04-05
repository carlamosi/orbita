import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import { useWorldData } from '../context/WorldDataContext'
import Button from '../components/Button'

function ChallengeCard({ title, description, icon, progress, isLocked, isCompleted, onStart, lockedReason }) {
  return (
    <div className={`relative glass-card p-6 overflow-hidden flex flex-col items-start ${isCompleted ? 'border-[#00FFB2]' : ''}`}>
      {/* Locked Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-space/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
          <span className="text-4xl mb-3 opacity-50">🔒</span>
          <p className="text-white/60 font-inter text-sm">{lockedReason}</p>
        </div>
      )}
      
      <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl mb-4 border border-white/10 ${isCompleted ? 'bg-[#00FFB2]/20 border-[#00FFB2]/50 text-[#00FFB2]' : ''}`}>
        {icon}
      </div>
      
      <h3 className="font-grotesk text-xl font-bold text-white mb-2">{title}</h3>
      <p className="font-inter text-[#8B8FA8] text-sm mb-6 flex-1 pr-4">{description}</p>
      
      {/* Progress / Status */}
      <div className="w-full flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
        <div className="font-mono text-sm text-white/70">
           {isCompleted ? <span className="text-[#00FFB2] flex items-center gap-1">✓ Completed</span> : progress}
        </div>
        {!isCompleted && !isLocked && (
          <Button variant="primary" size="sm" onClick={onStart}>Start</Button>
        )}
      </div>
    </div>
  )
}

export default function Challenges() {
  const { countries } = useWorldData()
  const { countryProgress, speedRoundBests, flagSessionsCompleted, challenges } = useGameStore()

  // 1. Mastered countries
  const masteredCount = useMemo(() => {
    return Object.values(countryProgress).filter(p => p.locationConf >= 60 && p.capitalConf >= 60 && p.flagConf >= 60).length
  }, [countryProgress])

  // Continents list
  const continents = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'] // Adjust to standard 5/6 as needed, we use 6:
  // Using 6 for filtering: 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania'

  return (
    <div className="min-h-screen bg-[#050508] pt-24 pb-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-12">
          <h1 className="font-grotesk text-4xl md:text-5xl font-bold text-white mb-2">Challenges</h1>
          <p className="font-inter text-[#8B8FA8]">Push your limits and unlock ultimate mastery.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1. The 195 */}
          <ChallengeCard 
            title="The 195"
            description="Achieve mastery in all 195 countries across Geography, Flags, and Capitals."
            icon="🌍"
            progress={`${masteredCount} / 195`}
            isLocked={false}
            isCompleted={masteredCount >= 195}
            onStart={() => window.location.href = '/explorer'}
          />

          {/* 2. Speed Demon */}
          <ChallengeCard 
            title="Speed Demon"
            description="Score 150+ points in a single 60s Speed Round."
            icon="⚡"
            progress={`PB: ${speedRoundBests[0]?.score || 0}`}
            isLocked={false}
            isCompleted={speedRoundBests[0]?.score >= 150}
            onStart={() => window.location.href = '/speed'}
          />

          {/* 3. Blind Mode */}
          <ChallengeCard 
            title="Blind Master"
            description="Navigate the globe with no labels and transparent borders."
            icon="👁️"
            progress={`${masteredCount}/50 Mastered`}
            isLocked={masteredCount < 50}
            lockedReason="Master 50 countries to unlock Blind Mode."
            isCompleted={false}
            onStart={() => {}}
          />

          {/* 4. Flag Master */}
          <ChallengeCard 
            title="Flag Master"
            description="Complete all 195 flags without making a single mistake."
            icon="🎌"
            progress={`${flagSessionsCompleted}/30 Sessions`}
            isLocked={flagSessionsCompleted < 30}
            lockedReason="Play 30 Flag Quiz sessions to unlock."
            isCompleted={false}
            onStart={() => window.location.href = '/flag'}
          />

        </div>

        <h2 className="font-grotesk text-2xl font-bold text-white mt-16 mb-6">Continent Speedruns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'].map(cont => {
            const pb = speedRoundBests.find(s => s.continent === cont)
            return (
              <ChallengeCard
                key={cont}
                title={`${cont} Run`}
                description={`Clear a 60s speed round locked to ${cont}.`}
                icon="⏱️"
                progress={`PB: ${pb ? pb.score : '--'}`}
                isLocked={false}
                isCompleted={false}
                onStart={() => window.location.href = `/speed?continent=${cont}`}
              />
            )
          })}
          
          <ChallengeCard 
            title="Perfect Continent"
            description="Complete any continent speedrun with 0 mistakes."
            icon="🎯"
            progress="0/1"
            isLocked={speedRoundBests.filter(s => s.continent !== 'all').length === 0}
            lockedReason="Attempt a Continent Speedrun first."
            isCompleted={Object.keys(challenges || {}).some(k => k.startsWith('perfect_'))}
            onStart={() => {}}
          />
        </div>

      </div>
    </div>
  )
}
