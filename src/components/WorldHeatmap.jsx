import { useMemo, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { useWorldData } from '../context/WorldDataContext'
import { useGameStore } from '../store/useGameStore'

export default function WorldHeatmap() {
  const { geoData } = useWorldData()
  const countryProgress = useGameStore(s => s.countryProgress)
  const [hovered, setHovered] = useState(null)

  const projection = useMemo(() => {
    // Mercator, sized perfectly for a generic 800x400 container
    return geoMercator().scale(130).translate([400, 240])
  }, [])

  const pathGenerator = useMemo(() => {
    return geoPath().projection(projection)
  }, [projection])

  if (!geoData) {
    return <div className="w-full h-full min-h-[300px] flex items-center justify-center text-white/50 animate-pulse">Loading map...</div>
  }

  // Calculate score color based on progress matrix
  const getColor = (cid) => {
    const prog = countryProgress[cid]
    if (!prog) return '#1a1a2e' // unseen
    
    // Average confidence across domains
    const avg = (prog.locationConf + prog.capitalConf + prog.flagConf) / 3
    // scale is roughly 0-100, but the prompt said "confidence: 0, 1-2, 3-4, 5+" wait... "confidence >= 3 all categories"
    // Wait, the prompt said: 0, 1-2, 3-4, 5+ 
    // In our updateProgress, we added Math.max(0, ... prev[type] + delta), so score is 0-100.
    // If the prompt assumed 0-5 scale, 100/20 = 5. Let's map 0-100 to 0-5.
    const confScale = avg / 20 

    if (confScale === 0) return '#1a1a2e'
    if (confScale < 3) return '#1a1a6e'
    if (confScale < 5) return '#003366'
    return '#00FFB2' // Mastered
  }

  const getConfText = (cid) => {
    const prog = countryProgress[cid]
    if (!prog) return 'Unseen'
    const avg = (prog.locationConf + prog.capitalConf + prog.flagConf) / 3
    const confScale = avg / 20
    if (confScale >= 5) return 'Mastered'
    if (confScale >= 3) return 'Known'
    return 'Learning'
  }

  return (
    <div className="relative w-full aspect-[2/1] bg-[#0d0d1a] rounded-xl border border-white/5 overflow-hidden">
      <svg 
        viewBox="0 0 800 480" 
        className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(0,255,178,0.1)]"
        style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,178,0.05))' }}
      >
        {geoData.features.map(feature => {
          const cid = feature.id || feature.properties?.iso_a3 || feature.properties?.ISO_A3
          const isMastered = getColor(cid) === '#00FFB2'
          const isHovered = hovered?.id === cid
          
          return (
            <path
              key={cid || feature.properties.name}
              d={pathGenerator(feature)}
              fill={getColor(cid)}
              stroke={isHovered ? 'white' : 'rgba(255,255,255,0.05)'}
              strokeWidth={isHovered ? 1.5 : 0.5}
              className="transition-colors duration-300"
              style={isMastered ? { filter: 'drop-shadow(0 0 4px #00FFB2)' } : {}}
              onMouseEnter={() => setHovered({ id: cid, name: feature.properties.name })}
              onMouseLeave={() => setHovered(null)}
            />
          )
        })}
      </svg>
      {/* Tooltip Overlay */}
      {hovered && (
        <div className="absolute right-4 top-4 bg-[#050508]/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg pointer-events-none shadow-xl">
           <p className="text-white font-grotesk font-bold">{hovered.name}</p>
           <p className="text-[#8B8FA8] text-sm font-inter flex items-center gap-2">
             <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor(hovered.id) }}></span>
             {getConfText(hovered.id)}
           </p>
        </div>
      )}
    </div>
  )
}
