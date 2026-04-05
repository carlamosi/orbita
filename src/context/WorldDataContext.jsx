import { createContext, useContext, useState, useEffect } from 'react'
import countriesStaticData from '../data/countries.json'

const WorldDataContext = createContext()

const GEOJSON_URL = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'

export function WorldDataProvider({ children }) {
  const [geoData, setGeoData] = useState(null)
  const [countries, setCountries] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(GEOJSON_URL)
        const geojson = await res.json()
        setGeoData(geojson)
        // Set the static imported data immediately
        setCountries(countriesStaticData)
      } catch (err) {
        console.error('Failed to load world data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <WorldDataContext.Provider value={{ geoData, countries, isLoading }}>
      {children}
    </WorldDataContext.Provider>
  )
}

export function useWorldData() {
  return useContext(WorldDataContext)
}
