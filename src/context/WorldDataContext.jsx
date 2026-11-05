import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import countriesStaticData from '../data/countries.json'

const WorldDataContext = createContext()

const GEOJSON_URL = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'

// The GeoJSON uses a few ids that differ from the dataset (ISO3). Only unambiguous
// ones are mapped; features without a usable id (-99) stay as they are.
const GEO_ID_ALIASES = { SDS: 'SSD' }

export function normalizeGeoId(id) {
  return GEO_ID_ALIASES[id] || id
}

const rawFeatureId = (f) => f.id || f.properties?.iso_a3 || f.properties?.ISO_A3

function normalizeGeoJson(geojson) {
  return {
    ...geojson,
    features: geojson.features.map((f) => {
      const id = normalizeGeoId(rawFeatureId(f))
      return id === f.id ? f : { ...f, id }
    }),
  }
}

// Countries the globe can draw. With unknown shapes (shapeIds missing) nothing is filtered.
export function locatablePool(countries, shapeIds) {
  if (!countries || !shapeIds) return countries
  return countries.filter((c) => shapeIds.has(c.id))
}

const NO_SHAPES = new Set()

export function WorldDataProvider({ children }) {
  const [geoData, setGeoData] = useState(null)
  const [geoError, setGeoError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(GEOJSON_URL)
        if (res.ok === false) throw new Error(`GeoJSON request failed (${res.status})`)
        setGeoData(normalizeGeoJson(await res.json()))
      } catch (err) {
        console.error('Failed to load world data:', err)
        setGeoError(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const shapeIds = useMemo(
    () => (geoData ? new Set(geoData.features.map(rawFeatureId).filter(Boolean)) : NO_SHAPES),
    [geoData]
  )

  // Country data is bundled: it never depends on the network.
  const value = useMemo(
    () => ({ geoData, countries: countriesStaticData, isLoading, geoError, shapeIds }),
    [geoData, isLoading, geoError, shapeIds]
  )

  return <WorldDataContext.Provider value={value}>{children}</WorldDataContext.Provider>
}

export function useWorldData() {
  return useContext(WorldDataContext)
}
