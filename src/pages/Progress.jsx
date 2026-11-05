import { useMemo, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useWorldData } from '../context/WorldDataContext'
import { useGameStore } from '../store/useGameStore'
import WorldHeatmap from '../components/WorldHeatmap'
import ActivityGrid from '../components/ActivityGrid'
import Button from '../components/Button'
import { MASTERED } from '../srs/conf'
import { localDayKey, daysBetween } from '../srs/dayKey'
import { State } from '../srs/scheduler'
import { exportProgress, importProgress, BackupError } from '../srs/backup'

const CAT_ROUTE = { loc: '/find', cap: '/capital', flag: '/flag' }
const CAT_LABEL = { loc: 'location', cap: 'capital', flag: 'flag' }

const readFile = (file) =>
  typeof file.text === 'function'
    ? file.text()
    : new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = () => reject(r.error)
        r.readAsText(file)
      })

export default function Progress({ now = Date.now }) {
  const { countries } = useWorldData()
  const { totalSessions, countryProgress, reviewLog, stats, cards, confusions } = useGameStore()
  const [importError, setImportError] = useState(null)
  const fileRef = useRef(null)

  // Ask the browser not to evict our storage. Result and errors are irrelevant.
  useEffect(() => {
    try {
      Promise.resolve(navigator.storage?.persist?.()).catch(() => {})
    } catch {
      // ignore
    }
  }, [])

  // Review queue: seen cards whose due time has come.
  const { dueCount, dueRoute } = useMemo(() => {
    const t = now()
    const byCat = { loc: 0, cap: 0, flag: 0 }
    let total = 0
    for (const [id, c] of Object.entries(cards || {})) {
      if (c && c.state !== State.New && c.due <= t) {
        total++
        const cat = id.split(':')[1]
        if (cat in byCat) byCat[cat]++
      }
    }
    const best = Object.keys(byCat).reduce((a, b) => (byCat[b] > byCat[a] ? b : a), 'loc')
    return { dueCount: total, dueRoute: CAT_ROUTE[best] }
  }, [cards, now])

  // Top 3 confused pairs across all cards.
  const topConfusions = useMemo(() => {
    if (!countries) return []
    const byId = new Map(countries.map((c) => [c.id, c]))
    const pairs = []
    for (const [cardId, row] of Object.entries(confusions || {})) {
      const [iso, cat] = cardId.split(':')
      const a = byId.get(iso)
      if (!a || !row) continue
      for (const [chosen, n] of Object.entries(row)) {
        const b = byId.get(chosen)
        if (b) pairs.push({ key: `${cardId}>${chosen}`, a: a.name, b: b.name, cat, n })
      }
    }
    return pairs.sort((x, y) => y.n - x.n).slice(0, 3)
  }, [confusions, countries])

  const handleExport = () => {
    const state = useGameStore.getState()
    const blob = new Blob([exportProgress(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orbita-progress-${localDayKey(now())}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e) => {
    const input = e.target
    const file = input.files && input.files[0]
    if (!file) return
    try {
      const text = await readFile(file)
      const merged = importProgress(text, useGameStore.getState())
      useGameStore.getState().importState(merged)
      setImportError(null)
    } catch (err) {
      setImportError(err instanceof BackupError ? err.message : 'This file could not be imported.')
    }
    try { input.value = '' } catch { /* ignore */ }
  }

  // A streak is only alive if the last session was today or yesterday.
  const streak = stats.lastSessionDay && daysBetween(stats.lastSessionDay, localDayKey(now())) > 1 ? 0 : stats.streak

  // Avg Accuracy: share of reviews rated above Again.
  const accuracy = reviewLog.length > 0
    ? Math.round((reviewLog.filter(e => e[1] > 1).length / reviewLog.length) * 100)
    : 0

  // Calculate masteries
  const metrics = useMemo(() => {
    if (!countries) return { mastered: 0, categoryAvgs: {}, regions: [] }
    
    let masteredCount = 0
    let categories = { location: 0, capital: 0, flag: 0 }
    let counts = 0
    
    // Continents
    const regionScores = {}
    const regionCounts = {}

    Object.entries(countryProgress).forEach(([cid, prog]) => {
      // is mastered?
      if (prog.locationConf >= MASTERED && prog.capitalConf >= MASTERED && prog.flagConf >= MASTERED) {
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
      .filter(([, prog]) => prog.timesWrong > 0)
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

        {/* Review queue and confusions */}
        <div className="glass-card p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-inter text-white">
              {dueCount === 0
                ? 'Nothing to review today.'
                : `You have ${dueCount} ${dueCount === 1 ? 'country' : 'countries'} to review today`}
            </p>
            {dueCount > 0 && (
              <Link to={dueRoute}><Button variant="secondary">Review now</Button></Link>
            )}
          </div>
          {topConfusions.map((p) => (
            <p key={p.key} className="text-sm text-[#8B8FA8]">
              You often confuse {p.a} and {p.b} <span className="text-xs">({CAT_LABEL[p.cat] || p.cat})</span>
            </p>
          ))}
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
             <div className="text-4xl font-mono text-white drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">{accuracy}%</div>
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

        {/* Backup */}
        <div className="glass-card p-6 space-y-3">
          <h2 className="font-grotesk text-xl font-bold">Backup</h2>
          <p className="text-sm text-[#8B8FA8]">Your progress lives only in this browser. Export a copy to keep it safe.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleExport}>Export progress</Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>Import progress</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
          </div>
          {importError && <p role="alert" className="text-sm text-[#FF6B6B]">{importError}</p>}
        </div>

      </div>
    </div>
  )
}
