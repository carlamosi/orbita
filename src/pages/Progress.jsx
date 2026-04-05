import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useWorldData } from '../context/WorldDataContext'
import { useGameStore } from '../store/useGameStore'
import WorldHeatmap from '../components/WorldHeatmap'
import ActivityGrid from '../components/ActivityGrid'
import Button from '../components/Button'

export default function Progress() {
  const { countries } = useWorldData()
  const { streak, totalSessions, countryProgress } = useGameStore()

  // Calculate masteries
  const metrics = useMemo(() => {
    if (!countries) return { mastered: 0, accuracy: 0, categoryAvgs: {}, regions: [] }
    
    let masteredCount = 0
    let totalScore = 0
    let categories = { location: 0, capital: 0, flag: 0 }
    let counts = 0
    
    // Continents
    const regionScores = {}
    const regionCounts = {}

    Object.entries(countryProgress).forEach(([cid, prog]) => {
      // is mastered?
      if (prog.locationConf >= 60 && prog.capitalConf >= 60 && prog.flagConf >= 60) {
         masteredCount++
      }

      categories.location += prog.locationConf
      categories.capital += prog.capitalConf
      categories.flag += prog.flagConf
      counts++

      const cData = countries.find(c => c.id === cid)
      if (cData) {
        const r = cData.continent || cData.region
        if (!regionScores[r]) { regionScores[r] = 0; regionCounts[r] = 0; }
        regionScores[r] += (prog.locationConf + prog.capitalConf + prog.flagConf) / 3
        regionCounts[r]++
      }
    })

    // Calculate regions out of 100 possible mastery (if count > 0)
    // Wait, total countries in a region?
    const regions = []
    if (countries) {
      const regionTotals = {}
      countries.forEach(c => {
         const r = c.continent || c.region
         regionTotals[r] = (regionTotals[r] || 0) + 1
      })
      Object.keys(regionTotals).forEach(r => {
        // Average confidence across entire region possible
        const sum = regionScores[r] || 0
        // max possible score is 100 * total countries
        const pct = regionTotals[r] > 0 ? sum / (regionTotals[r]) : 0
        regions.push({ name: r, pct })
      })
    }

    return {
      mastered: masteredCount,
      accuracy: counts > 0 ? ((categories.location + categories.capital + categories.flag) / (3 * counts)).toFixed(1) : 0,
      categoryAvgs: {
        location: counts > 0 ? (categories.location / counts) : 0,
        capital: counts > 0 ? (categories.capital / counts) : 0,
        flag: counts > 0 ? (categories.flag / counts) : 0,
      },
      regions: regions.sort((a,b) => b.pct - a.pct).slice(0,7) // Top 7 grouping
    }
  }, [countryProgress, countries])

  // Weak Spots
  const weakSpots = useMemo(() => {
    if (!countries) return []
    return Object.entries(countryProgress)
      .filter(([_, prog]) => prog.timesWrong > 0)
      .sort((a,b) => b[1].timesWrong - a[1].timesWrong)
      .slice(0, 8)
      .map(([cid, prog]) => {
        const c = countries.find(c => c.id === cid)
        return { ...c, timesWrong: prog.timesWrong }
      })
  }, [countryProgress, countries])

  return (
    <div className="min-h-screen bg-[#050508] pt-24 pb-16 px-6 md:px-12 lg:px-24 text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div>
          <h1 className="font-grotesk text-4xl md:text-5xl font-bold text-white mb-2">My Progress</h1>
          <p className="font-inter text-[#8B8FA8]">Track your journey towards global mastery.</p>
        </div>

        {/* HUD - Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {/* Mastered (Green) */}
           <div className="glass-card p-6 border-b-2 border-[#00FFB2]">
             <div className="text-sm font-inter text-[#8B8FA8] uppercase tracking-wider mb-2">Mastered</div>
             <div className="text-4xl font-mono text-white drop-shadow-[0_0_10px_rgba(0,255,178,0.5)]">{metrics.mastered}</div>
           </div>
           {/* Streak (Coral) */}
           <div className="glass-card p-6 border-b-2 border-[#FF6B6B]">
             <div className="text-sm font-inter text-[#8B8FA8] uppercase tracking-wider mb-2">Current Streak</div>
             <div className="text-4xl font-mono text-white flex items-center gap-2 drop-shadow-[0_0_10px_rgba(255,107,107,0.5)]">
               {streak} <span className="text-2xl">🔥</span>
             </div>
           </div>
           {/* Sessions (Violet) */}
           <div className="glass-card p-6 border-b-2 border-[#6C63FF]">
             <div className="text-sm font-inter text-[#8B8FA8] uppercase tracking-wider mb-2">Total Sessions</div>
             <div className="text-4xl font-mono text-white drop-shadow-[0_0_10px_rgba(108,99,255,0.5)]">{totalSessions}</div>
           </div>
           {/* Accuracy (Cyan) */}
           <div className="glass-card p-6 border-b-2 border-[#00D4FF]">
             <div className="text-sm font-inter text-[#8B8FA8] uppercase tracking-wider mb-2">Avg Accuracy</div>
             <div className="text-4xl font-mono text-white drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">{metrics.accuracy}%</div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Map (Left 2 cols) */}
          <div className="lg:col-span-2 glass-card p-6 flex flex-col">
             <h2 className="font-grotesk text-xl font-bold mb-6">Knowledge Heatmap</h2>
             <div className="flex-1 min-h-[300px]">
               <WorldHeatmap />
             </div>
          </div>

          {/* Categories & Regions (Right col) */}
          <div className="glass-card p-6 space-y-8">
             <div>
               <h2 className="font-grotesk text-xl font-bold mb-4">Categories</h2>
               <div className="space-y-4">
                 {[
                   { label: 'Geography (Locate)', val: metrics.categoryAvgs.location },
                   { label: 'Capitals', val: metrics.categoryAvgs.capital },
                   { label: 'Flags', val: metrics.categoryAvgs.flag }
                 ].map(cat => (
                   <div key={cat.label}>
                     <div className="flex justify-between text-sm mb-1 text-[#8B8FA8]">
                       <span>{cat.label}</span>
                       <span className="font-mono text-white">{Math.round(cat.val)}%</span>
                     </div>
                     <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                         className="h-full bg-gradient-to-r from-[#6C63FF] to-[#00D4FF]"
                         initial={{ width: 0 }}
                         whileInView={{ width: `${Math.round(cat.val)}%` }}
                         viewport={{ once: true }}
                         transition={{ duration: 1, delay: 0.2 }}
                       />
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             <div>
               <h2 className="font-grotesk text-xl font-bold mb-4">Continental Mastery</h2>
               <div className="space-y-3 relative">
                 {metrics.regions.map(r => (
                   <div key={r.name}>
                     <div className="flex justify-between text-xs mb-1 text-[#8B8FA8]">
                       <span>{r.name}</span>
                       <span className="font-mono text-white">{Math.round(r.pct)}%</span>
                     </div>
                     <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         className="h-full bg-[#00FFB2]"
                         initial={{ width: 0 }}
                         whileInView={{ width: `${Math.round(r.pct)}%` }}
                         viewport={{ once: true }}
                         transition={{ duration: 1, delay: 0.4 }}
                       />
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>

        </div>

        {/* Activity Grid & WeakSpots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="glass-card p-6">
            <h2 className="font-grotesk text-xl font-bold mb-6">Activity Log</h2>
            <div className="overflow-x-auto pb-4 custom-scrollbar">
              <div className="min-w-[700px]">
                <ActivityGrid />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="font-grotesk text-xl font-bold mb-6">Top Weak Spots</h2>
            {weakSpots.length === 0 ? (
              <div className="py-12 flex items-center justify-center text-[#8B8FA8] border border-dashed border-white/10 rounded-xl">
                 No mistakes logged yet! Keep exploring.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {weakSpots.map(ws => (
                  <div key={ws.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors group">
                    <img src={`https://flagcdn.com/h40/${ws.flagCode}.png`} alt="flag" className="h-[32px] object-cover rounded shadow-md border border-white/10" />
                    <div className="flex-1 overflow-hidden">
                      <div className="font-inter text-sm text-white truncate">{ws.name}</div>
                      <div className="text-xs text-[#FF6B6B] truncate">Wrong {ws.timesWrong} times</div>
                    </div>
                    <Link to="/find" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" className="px-2 py-1 text-xs">Drill</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
        
      </div>
    </div>
  )
}
