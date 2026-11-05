import { describe, it, expect, beforeEach, vi } from 'vitest'

// DB-4: una pestaña con el bundle actual (persist sin version) sigue viva tras
// un despliegue v2. Otra pestaña (bundle v2) guarda {version:2, state:{cards,...}}
// en la misma clave. Comportamiento CORRECTO esperado: el bundle viejo no debe
// degradar/sobrescribir un esquema más nuevo (cards y reviewLog deben sobrevivir).
describe('DB-4: bundle viejo no debe sobrescribir el esquema nuevo en orbita-storage', () => {
  let useGameStore
  beforeEach(async () => {
    localStorage.clear()
    vi.resetModules()
    ;({ useGameStore } = await import('../store/useGameStore.js'))
    await useGameStore.persist.rehydrate()
  })

  it('una escritura del bundle v0 conserva cards/reviewLog y no baja la version', () => {
    // Pestaña A (bundle actual) ya hidratada. Pestaña B (v2) escribe su esquema:
    const v2Payload = {
      version: 2,
      state: {
        countryProgress: { BOL: { locationConf: 80, capitalConf: 60, flagConf: 40, timesWrong: 1 } },
        cards: { 'BOL:location': { due: '2026-11-06', interval: 3, ease: 2.5, reps: 4 } },
        reviewLog: [{ id: 'BOL:location', t: '2026-11-05T10:00:00+01:00', grade: 4 }],
      },
    }
    localStorage.setItem('orbita-storage', JSON.stringify(v2Payload))

    // Pestaña A, sin recargar, responde una pregunta:
    useGameStore.getState().actions.updateProgress('FRA', 'capitalConf', 10)

    const stored = JSON.parse(localStorage.getItem('orbita-storage'))
    console.log('stored after old-bundle write:', JSON.stringify(stored))
    expect(stored.version).toBeGreaterThanOrEqual(2)
    expect(stored.state.cards).toEqual(v2Payload.state.cards)
    expect(stored.state.reviewLog).toEqual(v2Payload.state.reviewLog)
  })
})
