import { useState, useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import Globe3D from '../components/Globe3D'
import CountryPanel from '../components/CountryPanel'
import CountryList from '../components/CountryList'
import { useWorldData } from '../context/WorldDataContext'
import { useKeyboard } from '../hooks/useKeyboard'

// Math helpers for view borders logic
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length
const maxDistance = (coords) => {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
  coords.forEach(c => {
    if (c[0] < minLat) minLat = c[0]
    if (c[0] > maxLat) maxLat = c[0]
    if (c[1] < minLng) minLng = c[1]
    if (c[1] > maxLng) maxLng = c[1]
  })
  return Math.max(maxLat - minLat, maxLng - minLng) // rough spread
}
const clamp = (val, min, max) => Math.min(Math.max(val, min), max)

export default function Explorer() {
  const { geoData, countries } = useWorldData()
  const [selectedIso, setSelectedIso] = useState(null)
  
  const [search, setSearch] = useState('')
  const [continentFilter, setContinentFilter] = useState('All')
  const [sortParam, setSortParam] = useState('A-Z')

  const [isBorderViewActive, setIsBorderViewActive] = useState(false)
  const globeRef = useRef(null)

  // Keyboard: Escape to deselect
  useKeyboard(useMemo(() => ({
    'Escape': () => setSelectedIso(null)
  }), []))

  // -- Filters --
  const filteredCountries = useMemo(() => {
    if (!countries) return []
    let list = [...countries]

    if (continentFilter !== 'All') {
      list = list.filter(c => c.continent === continentFilter || c.region === continentFilter) // some datasets mix it up
    }

    if (search) {
      list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    }

    list.sort((a, b) => {
      if (sortParam === 'A-Z') return a.name.localeCompare(b.name)
      if (sortParam === 'Population') return b.population - a.population
      return 0
    })

    return list
  }, [countries, continentFilter, search, sortParam])

  // Get current exact data & geojson feature
  const exactData = useMemo(() => countries?.find(c => c.id === selectedIso), [countries, selectedIso])
  const selectedFeature = useMemo(() => geoData?.features?.find(f => {
     const cid = f.id || f.properties?.iso_a3 || f.properties?.ISO_A3
     return cid === selectedIso
  }), [geoData, selectedIso])

  const handleSelectCountry = (id) => {
    setSelectedIso(id)
    setIsBorderViewActive(false) // reset border view on new tap
  }

  // Effect: when searching or picking from list, rotate globe to it
  useEffect(() => {
    if (selectedIso && globeRef.current) {
      const targetCountry = countries?.find(c => c.id === selectedIso)
      if (targetCountry && targetCountry.coordinates && !isBorderViewActive) {
        globeRef.current.pointOfView({ lat: targetCountry.coordinates[0], lng: targetCountry.coordinates[1], altitude: 1.5 }, 900)
      }
    }
  }, [selectedIso, isBorderViewActive, countries])

  // View Borders Logic
  useEffect(() => {
    if (!globeRef.current || !countries) return
    
    if (isBorderViewActive && exactData?.borders?.length > 0) {
       const borderCountries = countries.filter(c => exactData.borders.includes(c.id) || exactData.borders.includes(c.id.substring(0,2)))
       
       if (borderCountries.length > 0) {
         // Gather coordinates
         const coordsToMap = borderCountries.map(b => b.coordinates).filter(Boolean)
         coordsToMap.push(exactData.coordinates) // Include self
         
         const avgLat = mean(coordsToMap.map(c => c[0]))
         const avgLng = mean(coordsToMap.map(c => c[1]))
         const spread = maxDistance(coordsToMap)
         const altitude = clamp(spread / 35, 1.2, 2.8)

         globeRef.current.pointOfView({ lat: avgLat, lng: avgLng, altitude }, 900)
       }
    }
  }, [isBorderViewActive, exactData, countries])

  // Custom colors injection for border highlighting
  const customColors = useMemo(() => {
    if (!isBorderViewActive || !exactData?.borders) return {}
    
    const colors = {}
    // Highlight origin
    colors[exactData.id] = { cap: 'rgba(108,99,255,0.4)', stroke: '#6C63FF', altitude: 0.02 }
    
    // Highlight borders
    exactData.borders.forEach(bid => {
      // Find matching 3-letter code if exactData.borders stores 3-letter (yes it does in most restcountries arrays)
      colors[bid] = { cap: 'rgba(255,255,255,0.2)', stroke: '#ffffff', altitude: 0.015 }
    })
    return colors
  }, [isBorderViewActive, exactData])

  return (
    <div className="relative h-screen bg-[#050508] flex flex-col overflow-hidden pt-14">
      
      {/* ── Top Filter Bar ── */}
      <div className="relative z-30 h-16 bg-[#050508]/80 backdrop-blur-md border-b border-white/10 px-6 flex items-center justify-between gap-4">
        
        <input 
          type="text" 
          placeholder="Search countries..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search countries"
          className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm font-inter text-white outline-none focus:border-violet w-64"
        />

        <div className="flex gap-2">
           {['All', 'Americas', 'Europe', 'Africa', 'Asia', 'Oceania'].map(cont => (
             <button
               key={cont}
               onClick={() => setContinentFilter(cont)}
               aria-label={`Filter by ${cont}`}
               className={`px-3 py-1 text-xs font-inter rounded-full border transition-colors ${
                 continentFilter === cont ? 'bg-violet text-white border-violet' : 'bg-transparent text-white/50 border-white/10 hover:text-white hover:border-white/30'
               }`}
             >
               {cont}
             </button>
           ))}
        </div>

        <div className="flex items-center gap-3">
           <span className="text-white/40 text-xs font-mono">{filteredCountries.length} countries</span>
           <select 
             value={sortParam} 
             onChange={(e) => setSortParam(e.target.value)}
             className="bg-white/5 border border-white/10 rounded-md px-3 py-1 text-xs font-inter text-white/80 outline-none"
           >
             <option value="A-Z">A-Z</option>
             <option value="Population">Population</option>
           </select>
        </div>
      </div>

      {/* ── Main Canvas (65/35 Split) ── */}
      <div className="flex-1 flex w-full relative">
        
        {/* Globe 65% width */}
        <div className="w-[65%] h-full relative flex items-center justify-center">
            <Globe3D
              globeRefExternal={globeRef}
              interactive={true}
              selectedCountry={selectedFeature}
              onCountrySelect={(geoFeat) => {
                 const cid = geoFeat.id || geoFeat.properties?.iso_a3 || geoFeat.properties?.ISO_A3
                 handleSelectCountry(cid)
              }}
              customColors={customColors}
              width="100%"
              height="100%"
            />
        </div>

        {/* Sidebar 35% width */}
        <div className="w-[35%] h-full border-l border-white/10 bg-[#0d0d1a]/50 flex flex-col relative z-20 overflow-hidden">
          
          <div className="absolute inset-0 w-full h-full p-6 flex flex-col pointer-events-auto">
             
             {!selectedIso ? (
               <div className="border border-white/5 rounded-xl bg-white/5 p-6 mb-6 flex-shrink-0">
                 <h2 className="text-xl font-grotesk text-white">Click any country to explore</h2>
                 <p className="text-sm font-inter text-[#8B8FA8] mt-1">Or select one from the list below.</p>
               </div>
             ) : (
               <div className="flex-shrink-0 relative h-[420px] mb-4">
                 <CountryPanel
                   country={selectedFeature}
                   isBorderViewActive={isBorderViewActive}
                   onToggleBorders={() => setIsBorderViewActive(!isBorderViewActive)}
                   onClose={() => handleSelectCountry(null)}
                 />
               </div>
             )}

             <CountryList 
               countries={filteredCountries} 
               selectedCountryId={selectedIso}
               onSelectCountry={(c) => handleSelectCountry(c.id)}
             />

          </div>
        </div>

      </div>
    </div>
  )
}
