import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import GlobeGL from 'react-globe.gl'
import { useWorldData } from '../context/WorldDataContext'
import { useGameStore } from '../store/useGameStore'
import { GlobeSkeleton } from './Skeleton'

/**
 * Globe3D
 *
 * Props:
 *   interactive       {boolean}  – enable pointer events (hover/click/zoom).
 *                                  Pass false in Hero for pure auto-rotate.
 *   selectedCountry              – currently selected GeoJSON feature.
 *   onCountrySelect(feature)     – called on polygon click.
 *   customColors                 – optional object map of colors keyed by cca3 id.
 *                                  { 'BOL': { cap: 'rgba(...)', stroke: '#...', altitude: 0.03 } }
 *   globeRefExternal             – optional ref forwarding.
 *   width, height                - optional numbers.
 */
export default function Globe3D({
  interactive = false,
  selectedCountry = null,
  onCountrySelect,
  customColors = {},
  showCapitals = false,
  globeRefExternal,
  width,
  height,
  showBorders = false,
  atmosphereAltitude = 0.15,
  onGlobeReady,
}) {
  const { geoData, countries } = useWorldData()
  const countryProgress = useGameStore(s => s.countryProgress) || {}
  const fallbackRef = {} // only used if globeRefExternal isn't provided
  const globeRef = globeRefExternal || fallbackRef
  
  const [hoveredCountry, setHoveredCountry] = useState(null)
  const [ready, setReady]                   = useState(false)

  /* ── Globe ready callback ─────────────────────────────── */
  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current
    if (!globe) return

    // ── CRITICAL: make the WebGL canvas transparent ──
    // react-globe.gl defaults to alpha:false; even with our rendererConfig
    // prop we also set it imperatively here as a safety net.
    const renderer = globe.renderer()
    if (renderer) {
      renderer.setClearColor(0x000000, 0)   // transparent
      renderer.setClearAlpha(0)
      renderer.domElement.style.background        = 'transparent'
      renderer.domElement.style.backgroundColor   = 'transparent'
    }
    // Remove scene background so nothing is painted behind the sphere
    globe.scene().background = null

    // Auto-rotate
    globe.controls().autoRotate      = true
    globe.controls().autoRotateSpeed = 0.5
    globe.controls().enableZoom      = interactive
    globe.controls().enablePan       = false

    // Initial camera position
    globe.pointOfView({ altitude: 2 }, 0)
    setReady(true)
    if (typeof onGlobeReady === 'function') {
      onGlobeReady()
    }
  }, [interactive, globeRef, onGlobeReady])

  /* ── Cleanup on unmount ─────────────────────────────── */
  useEffect(() => {
    return () => {
      if (globeRef.current) {
        globeRef.current.renderer()?.dispose()
        globeRef.current.scene()?.clear()
        globeRef.current.controls()?.dispose()
      }
    }
  }, [globeRef])

  /* ── Pause auto-rotate on interaction ─────────────────── */
  const handlePolygonHover = useCallback((feature) => {
    if (!interactive) return
    setHoveredCountry(feature)
    const ctrl = globeRef.current?.controls()
    if (ctrl) ctrl.autoRotate = !feature
  }, [interactive, globeRef])

  /* ── Zoom to selected country (Wait, games might override this) ── */
  // We only zoom if selecting from explorer mode naturally, not breaking games.
  // Actually, we keep it since NameCountry also assigns `selectedCountry`.
  useEffect(() => {
    if (!selectedCountry || !globeRef.current) return
    const geo = selectedCountry.geometry
    if (!geo) return

    let lats = [], lngs = []
    const flatten = (coords) => {
      if (typeof coords[0] === 'number') { lngs.push(coords[0]); lats.push(coords[1]) }
      else coords.forEach(flatten)
    }
    flatten(geo.coordinates)
    const lat = lats.reduce((a, b) => a + b, 0) / lats.length
    const lng = lngs.reduce((a, b) => a + b, 0) / lngs.length

    globeRef.current.pointOfView({ lat, lng, altitude: 1.5 }, 800)
    
    // Resume auto-rotate after zoom
    setTimeout(() => {
      const ctrl = globeRef.current?.controls()
      if (ctrl && interactive) ctrl.autoRotate = true
    }, 1000)
  }, [selectedCountry, interactive, globeRef])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: ready ? 1 : 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!ready && <GlobeSkeleton />}
      <GlobeGL
        ref={globeRef}
        width={typeof width === 'number' ? width : undefined}
        height={typeof height === 'number' ? height : undefined}
        /* ── Renderer: alpha:true is the ONLY way to get a transparent canvas ── */
        rendererConfig={{ antialias: true, alpha: true }}
        /* ── Globe visuals ── */
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl={null}
        atmosphereColor="#00D4FF"
        atmosphereAltitude={atmosphereAltitude}
        /* ── Country polygons ── */
        polygonsData={geoData?.features || []}
        polygonsTransitionDuration={300}
        polygonAltitude={(d) => {
          const cid = d.id || d.properties?.iso_a3 || d.properties?.ISO_A3
          if (customColors[cid]?.altitude !== undefined) return customColors[cid].altitude
          if (d === selectedCountry) return 0.02
          if (d === hoveredCountry) return 0.015
          return 0.01
        }}
        polygonCapColor={(d) => {
          const cid = d.id || d.properties?.iso_a3 || d.properties?.ISO_A3
          if (customColors[cid]?.cap) return customColors[cid].cap
          
          if (d === selectedCountry) return 'rgba(108,99,255,0.35)'
          if (d === hoveredCountry) return 'rgba(0,212,255,0.2)'
          
          // Heatmap Default Logic
          const prog = countryProgress[cid]
          if (prog) {
            const avg = (prog.locationConf + prog.capitalConf + prog.flagConf) / 3
            if (avg >= 60) return 'rgba(0,255,178,0.2)' // Mastered: 20% neon
            if (avg >= 20) return 'rgba(108,99,255,0.15)' // Learning: 15% violet
          }
          
          return 'rgba(255,255,255,0.08)' // Unseen: 8% gray
        }}
        polygonSideColor={() => 'rgba(255,255,255,0.05)'}
        polygonStrokeColor={(d) => {
          const cid = d.id || d.properties?.iso_a3 || d.properties?.ISO_A3
          if (customColors[cid]?.stroke) return customColors[cid].stroke
          if (d === selectedCountry) return '#6C63FF'
          if (d === hoveredCountry) return '#00D4FF'
          
          if (showBorders) return 'rgba(108,99,255,0.6)'
          
          return 'rgba(255,255,255,0.1)'
        }}
        polygonLabel={null}

        /* ── Capital Points ── */
        pointsData={showCapitals && countries ? countries.filter(c => c.capitalCoords) : []}
        pointLat={(c) => c.capitalCoords[0]}
        pointLng={(c) => c.capitalCoords[1]}
        pointColor={() => '#00D4FF'}
        pointAltitude={0.03}
        pointRadius={0.4}
        pointsMerge={false}

        /* ── Interaction ── */
        enablePointerInteraction={interactive}
        onPolygonHover={interactive ? handlePolygonHover : undefined}
        onPolygonClick={interactive
          ? (feature) => { onCountrySelect?.(feature) }
          : undefined
        }
        onGlobeReady={handleGlobeReady}
      />
    </motion.div>
  )
}
