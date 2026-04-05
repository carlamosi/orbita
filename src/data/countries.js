/**
 * countries.js
 * Placeholder for country data (GeoJSON references, capitals, flags, populations, etc.)
 * Will be populated with all 195 UN-recognized countries.
 *
 * Shape of each entry:
 * {
 *   id:         string   — ISO 3166-1 alpha-3 code (e.g. "FRA")
 *   iso2:       string   — ISO 3166-1 alpha-2 code (e.g. "FR")
 *   name:       string   — common name
 *   capital:    string
 *   continent:  "Europe" | "Asia" | "Africa" | "Americas" | "Oceania" | "Antarctica"
 *   population: number
 *   languages:  string[]
 *   flag:       string   — path to SVG flag in assets/flags/
 *   fact:       string   — one interesting fact
 * }
 */

export const countries = []
