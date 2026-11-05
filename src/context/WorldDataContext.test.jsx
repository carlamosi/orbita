import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

import { WorldDataProvider, useWorldData, normalizeGeoId, locatablePool } from './WorldDataContext'

let latest
function Probe() {
  latest = useWorldData()
  return null
}

async function mount() {
  const root = createRoot(document.body.appendChild(document.createElement('div')))
  await act(async () => {
    root.render(<WorldDataProvider><Probe /></WorldDataProvider>)
  })
  await act(async () => { await Promise.resolve() })
  return root
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('normalizeGeoId', () => {
  it('maps SDS to SSD and leaves other ids alone', () => {
    expect(normalizeGeoId('SDS')).toBe('SSD')
    expect(normalizeGeoId('ESP')).toBe('ESP')
  })
})

describe('locatablePool', () => {
  it('keeps only countries with a shape', () => {
    const pool = locatablePool([{ id: 'ESP' }, { id: 'MLT' }], new Set(['ESP']))
    expect(pool.map((c) => c.id)).toEqual(['ESP'])
  })
  it('returns the full list when shapeIds is unknown', () => {
    expect(locatablePool([{ id: 'ESP' }], undefined)).toHaveLength(1)
  })
})

describe('WorldDataProvider', () => {
  it('loads countries and exposes geoError when the GeoJSON fetch is rejected', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await mount()
    expect(latest.countries.length).toBeGreaterThan(0)
    expect(latest.geoData).toBeNull()
    expect(latest.geoError).toBeTruthy()
    expect(latest.isLoading).toBe(false)
    expect(latest.shapeIds.size).toBe(0)
  })

  it('normalizes SDS to SSD in geoData and shapeIds', async () => {
    const geo = { features: [{ id: 'SDS', properties: {} }, { id: 'ESP', properties: {} }] }
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(geo) })))
    await mount()
    expect(latest.geoError).toBeNull()
    expect(latest.shapeIds.has('SSD')).toBe(true)
    expect(latest.shapeIds.has('SDS')).toBe(false)
    expect(latest.geoData.features.map((f) => f.id)).toContain('SSD')
  })
})
