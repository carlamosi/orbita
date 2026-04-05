import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = path.join(__dirname, '../src/data/countries.json')

async function fetchCountries() {
  const url = 'https://restcountries.com/v3.1/independent?fields=cca3,name,capital,flag,cca2,population,subregion,region,languages,currencies,latlng,borders'
  
  console.log('Fetching data from REST Countries API...')
  const res = await fetch(url)
  if (!res.ok) throw new Error('API fetch failed')
  const data = await res.json()

  console.log(`Fetched ${data.length} countries. Formatting...`)

  const formatted = data.map(c => {
    // Determine difficulty based on population as a generic heuristic
    let difficulty = 'hard'
    if (c.population > 30_000_000) difficulty = 'easy'
    else if (c.population > 5_000_000) difficulty = 'medium'

    // Extract languages
    const languages = c.languages ? Object.values(c.languages) : []
    
    // Extract primary currency
    let currency = 'Unknown'
    if (c.currencies) {
      const firstCurrKey = Object.keys(c.currencies)[0]
      if (firstCurrKey) {
          currency = c.currencies[firstCurrKey].name
      }
    }

    // Capital
    const capital = (c.capital && c.capital.length > 0) ? c.capital[0] : 'None'

    // Generic fun fact
    const funFact = `A fascinating country in ${c.subregion || c.region}, home to around ${(c.population / 1_000_000).toFixed(1)} million people.`

    return {
      id: c.cca3,
      name: c.name.common,
      capital: capital,
      flag: c.flag || '',
      flagCode: c.cca2.toLowerCase(),
      population: c.population,
      region: c.subregion || c.region,
      continent: c.region, // Region in restcountries is basically continent (e.g., Americas, Europe)
      languages: languages,
      currency: currency,
      coordinates: c.latlng || [0, 0],
      funFact: funFact,
      difficulty: difficulty,
      borders: c.borders || []
    }
  })

  // Add specific fun facts for a few well-known countries (like requested)
  const manualFacts = {
    'BOL': 'One of two landlocked countries in South America.',
    'USA': 'The world\'s largest economy by nominal GDP.',
    'FRA': 'The most visited country in the world.',
    'JPN': 'Made up of exactly 6,852 islands.',
    'CAN': 'Has more lakes than the rest of the world combined.',
    'AUS': 'An island continent and the world\'s sixth-largest country by total area.',
    'BRA': 'Home to the majority of the Amazon Rainforest.'
  }

  formatted.forEach(c => {
    if (manualFacts[c.id]) {
      c.funFact = manualFacts[c.id]
    }
  })

  // Sort alphabetically
  formatted.sort((a, b) => a.name.localeCompare(b.name))

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(formatted, null, 2))
  console.log(`Saved ${formatted.length} countries to src/data/countries.json`)
}

fetchCountries().catch(console.error)
