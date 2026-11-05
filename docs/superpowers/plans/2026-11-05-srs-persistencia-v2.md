# Plan de implementación: SRS (FSRS) + persistencia v2 + bugs de la auditoría

> **Para agentes:** SUB-SKILL OBLIGATORIA: usa superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para ejecutar este plan tarea a tarea. Los pasos usan checkboxes (`- [ ]`).

**Objetivo:** que Orbita programe los repasos con FSRS, que guarde el progreso de forma que sobreviva a dos pestañas abiertas y a los despliegues de Vercel, y que se corrijan los bugs confirmados en la auditoría.

**Arquitectura:** el motor SRS vive en `src/srs/` como funciones puras con `nowMs` inyectado. El store de Zustand pasa a usar la clave nueva `orbita-v2` (version 2), con un storage propio que hace leer-fusionar-escribir. La clave antigua `orbita-storage` solo se lee para migrar y nunca se borra. `countryProgress` se mantiene como caché derivada con la misma forma de hoy, así que Globe3D, WorldHeatmap, CountryPanel, Progress y Challenges no cambian.

**Stack:** React 19, Zustand 5 persist, `ts-fsrs@5.4.2` (versión exacta), Vitest 5 + jsdom.

**Spec:** `docs/auditoria-orbita-2026-11-05.md` (secciones "Auditor: srs" y "Auditor: db") y `SKILLD.md` (LEARNING INTELLIGENCE).

## Restricciones globales

- Toda instalación usa `npm install --legacy-peer-deps` y versión exacta (`-E`). El `package-lock.json` se commitea.
- Se instala `ts-fsrs@5.4.2`, no la 6.x: la 6.0 se publicó el 2026-10-28, tiene API asíncrona y exige node 24 o superior.
- Parámetros FSRS: `request_retention: 0.9`, `maximum_interval: 365`, `enable_short_term: true`, `learning_steps: ['1m','10m']`, `relearning_steps: ['10m']`, `enable_fuzz` a true en la app y false en los tests.
- Id de tarjeta: `` `${ISO3}:${cat}` `` con `cat` ∈ `loc | cap | flag`. Fechas guardadas en epoch ms.
- El día cambia a medianoche local del dispositivo (`Intl.DateTimeFormat().resolvedOptions().timeZone`). En los tests, `process.env.TZ = 'Europe/Madrid'`.
- Clave nueva `orbita-v2`. Backup `orbita-storage-backup-v1` (se escribe una sola vez). Nunca se borra `orbita-storage`.
- `reviewLog` está limitado a las 5000 entradas más recientes. `daily` a 400 días. `confusions` a 5 por tarjeta.
- Cupo de tarjetas nuevas: 10 al día por defecto. Sesión de 20 preguntas.
- Ningún texto visible usa "—" (regla de marca de SKILLD.md).
- No se trabaja en `main`: cada push a `main` despliega a producción.

## Puntos de revisión

1. **Dos pestañas abiertas a la vez.** No se pierde ninguna respuesta. Los pinea el Task 5: test `merge conserva repasos de ambas pestañas`.
2. **Pestaña con el bundle viejo tras el autoUpdate.** Sigue escribiendo en `orbita-storage`. La v2 no se ve afectada y lo nuevo que escriba se incorpora con max-merge. Lo pinea el Task 5: test `escritura legacy posterior se fusiona sin borrar cards`.
3. **localStorage bloqueado (modo privado o Safari).** La app renderiza y juega en memoria y muestra un aviso. Lo pinea el Task 5: test `storage bloqueado no lanza`.
4. **Sesión entre las 00:00 y las 02:00 en Madrid.** Cuenta para el día nuevo en la racha, en el mapa de actividad y en el cupo de nuevas. Lo pinean el Task 1 (`localDayKey`) y el Task 8 (ActivityGrid).
5. **Usuaria con progreso v0 que actualiza.** No pierde países dominados: un país con Conf ≥ 60 en las 3 categorías antes de la migración sigue contando como dominado justo después. Lo pinea el Task 4: test `dominado antes, dominado después`.

---

### Task 0: Commit de la línea base y del arreglo de FlagQuiz

**Archivos (ya hechos):** `src/pages/FlagQuiz.jsx` (imports de React), `vitest.config.js`, `src/test/setup.js`, `package.json` (script `test`, devDeps), `src/__audit__/*.test.*` y `docs/`.

- [ ] Añadir `process.env.TZ = 'Europe/Madrid'` como primera línea de `src/test/setup.js`.
- [ ] `npx vitest run src/__audit__/SRS-1.test.jsx src/__audit__/BUG-01.test.jsx`: PASS.
- [ ] Commit `fix(flag-quiz): import React hooks; add vitest + audit repro tests`. Si la usuaria lo pide, este commit se lleva primero a `main` como hotfix, porque `/flag` está roto en producción.

### Task 1: `localDayKey`, el día local

**Archivos:** crear `src/srs/dayKey.js` y `src/srs/dayKey.test.js`.

**Produce:** `localDayKey(nowMs: number, timeZone?: string): string` ('YYYY-MM-DD') y `daysBetween(keyA: string, keyB: string): number`.

- [ ] Tests:
  - `localDayKey(Date.parse('2026-11-06T00:30:00+01:00'), 'Europe/Madrid') === '2026-11-06'`
  - `localDayKey(Date.parse('2026-10-25T01:30:00+01:00'), 'Europe/Madrid') === '2026-10-25'` (cambio de hora de otoño)
  - `localDayKey(Date.parse('2026-03-29T03:30:00+02:00'), 'Europe/Madrid') === '2026-03-29'` (cambio de hora de primavera)
  - `daysBetween('2026-03-28','2026-03-29') === 1` y `daysBetween('2026-10-24','2026-10-26') === 2`
- [ ] Ejecutar `npx vitest run src/srs/dayKey.test.js`: FAIL (el módulo no existe).
- [ ] Implementar con `Intl.DateTimeFormat('en-CA', {timeZone, year:'numeric', month:'2-digit', day:'2-digit'})`. `daysBetween` hace la diferencia en UTC de las fechas parseadas como medianoche UTC.
- [ ] Tests: PASS. Commit `feat(srs): local day key`.

### Task 2: Scheduler FSRS y rating

**Archivos:** crear `src/srs/scheduler.js`, `src/srs/rating.js` y sus `.test.js`. `npm install -E --legacy-peer-deps ts-fsrs@5.4.2`.

**Produce:**
- `Rating` y `State` (reexportados de ts-fsrs)
- `newCard(nowMs): Card`, donde `Card` = `{due, stability, difficulty, scheduled_days, learning_steps, reps, lapses, state, last_review}` con las fechas en ms
- `reviewCard(card, rating, nowMs, {fuzz?: boolean}): {card: Card, log: [rating, tsSec, sBefore, dBefore]}`
- `retrievability(card, nowMs): number` (de 0 a 1; 0 si `state === New`)
- `toRating({correct, latencyMs, hintUsed, inputKind, timed, state}): Rating`, con `inputKind` ∈ `choice | typed | globe`

**Umbrales de `toRating`** (rápido / lento, en ms): choice 2500 / 8000, typed 5000 / 15000, globe 4000 / 12000.

- [ ] Tests del scheduler:
  - Good sobre una tarjeta en Review deja `due > now` y aumenta `stability`.
  - Again deja `lapses + 1` y `state === State.Relearning`.
  - Ida y vuelta: `JSON.parse(JSON.stringify(card))` da la misma `retrievability` en el mismo `now`.
- [ ] Tests de `toRating`:
  - Incorrecto da Again.
  - `hintUsed` da como máximo Hard.
  - `latencyMs: null` da Good.
  - Si `state` es New o Learning, nunca da Easy.
  - `timed` solo da Again o Good.
  - Correcto con latencia mayor que la lenta da Hard.
- [ ] Ejecutar: FAIL.
- [ ] Implementar. El scheduler es una instancia de `fsrs(generatorParameters({...restricciones globales, enable_fuzz}))` y convierte las fechas de ms a `Date` y de vuelta.
- [ ] Tests: PASS. Commit `feat(srs): fsrs scheduler and rating`.

### Task 3: Conf derivada (compatibilidad con la UI)

**Archivos:** crear `src/srs/conf.js` y `src/srs/conf.test.js`.

**Consume:** `retrievability` (Task 2).

**Produce:**
- `cardConf(card | undefined, nowMs): number` (entero de 0 a 100)
- `materializeProgress(cards, nowMs): Record<ISO3, {locationConf, capitalConf, flagConf, timesWrong}>`, donde `timesWrong` = suma de `lapses` de las 3 tarjetas

**Fórmula:** `round(100 · R · min(1, ln(1+S) / ln(1+21)))`. Vale 0 si la tarjeta no existe o está en New.

- [ ] Tests:
  - New da 0.
  - El resultado es un entero en [0,100].
  - Sin repasos, no crece al avanzar `now`.
  - Una tarjeta con S = 7 y R ≥ 0,9 da ≥ 60.
  - `materializeProgress` solo incluye países con al menos una tarjeta.
- [ ] FAIL, implementar, PASS. Commit `feat(srs): derived confidence`.

### Task 4: Migración v0 → v2 (pura)

**Archivos:** crear `src/srs/migrate.js`, `src/srs/migrate.test.js` y los fixtures `src/srs/__fixtures__/v0-typical.json`, `v0-empty.json` y `v0-corrupt.txt`.

**Consume:** `newCard`, `cardConf` y `localDayKey`.

**Produce:**
- `migrateV0toV2(rawV0: object | null, nowMs, validIds: Set<string>): StateV2`
- `freshV2(nowMs): StateV2`

**Forma de StateV2:** `{schema:2, meta:{migratedFrom, migratedAt}, cards, reviewLog:[], confusions:{}, daily:{[dayKey]:{reviews,new}}, stats:{streak,lastSessionDay,totalSessions,flagSessionsCompleted}, speedRoundBests, challenges:{perfectContinents}, settings:{dailyNew:10, desiredRetention:0.9}}`

En ese esquema, `cards: Record<cardId, Card>` y `confusions: Record<cardId, Record<ISO3, number>>` (máximo 5 entradas por tarjeta; al pasar de 5 se descarta la de menor cuenta).

**Siembra de cada Conf > 0:**
- `state: Review`
- `stability`: el menor S que haga `cardConf(card, nowMs) ≥ conf` (búsqueda en el rango [0,5 ; 365] con `last_review = nowMs`)
- `difficulty = clamp(5 + timesWrong·0.5, 1, 10)`
- `due = nowMs`
- `lapses = timesWrong`
- `last_review = nowMs`

- [ ] El fixture `v0-typical.json` contiene ESP en 75/75/75, FRA en 15/0/0, GRL (país huérfano), `challenges.perfect_Europe = true`, `capitalConf` ausente en un país y dailyActivity de 3 días.
- [ ] Tests:
  - **dominado antes, dominado después:** ESP tiene las 3 `cardConf` ≥ 60 en `nowMs`.
  - GRL se descarta.
  - Ningún valor es NaN.
  - `challenges.perfectContinents.Europe === true`.
  - Se conservan streak, totalSessions y dailyActivity (en `daily[k].reviews`).
  - Idempotencia: `migrateV0toV2` de un objeto que ya es v2 lo devuelve tal cual.
  - `null` da `freshV2`.
- [ ] FAIL, implementar, PASS. Commit `feat(store): pure v0 to v2 migration`.

### Task 5: Storage v2 (leer-fusionar-escribir) y el store

**Archivos:**
- Crear `src/store/storageV2.js` y `src/store/storageV2.test.js`
- Reescribir `src/store/useGameStore.js`
- Adaptar `src/__audit__/DB-1.test.js` y `DB-4.test.js` y moverlos a `src/store/` como tests permanentes

**Consume:** `migrateV0toV2`, `freshV2`, `reviewCard`, `materializeProgress` y `localDayKey`.

**Produce:**
- `mergeV2(disk: StateV2, mem: StateV2): StateV2`
  - Por tarjeta, gana la de `last_review` mayor.
  - `reviewLog` es la unión deduplicada por `[cardId, tsSec]`, ordenada y limitada a 5000.
  - `daily` y `confusions` se fusionan por máximo.
  - `stats` gana la de `lastSessionDay` mayor.
  - `speedRoundBests` es la unión con el top 10.
  - `perfectContinents` se fusiona con OR.
- `createV2Storage({legacyKey:'orbita-storage', key:'orbita-v2', backupKey:'orbita-storage-backup-v1'})` → `PersistStorage`
  - En `getItem`: si no existe `orbita-v2`, migra desde la clave legacy. El backup se escribe solo si no existe ya; si escribirlo falla por cuota, la migración se aborta y se usa el modo legacy en memoria. Si el JSON está corrupto, se copia a `orbita-storage-corrupt-<ts>` y no se escribe nada.
  - En `setItem`: lee el disco, fusiona con `mergeV2` y escribe, dentro de un try/catch. Si hay `QuotaExceededError`, recorta `reviewLog` a la mitad y reintenta una vez.
  - Si `stored.version > 2`, no escribe y expone el flag `needsReload`.
- Store (`persist`, `name:'orbita-v2'`, `version:2`, `storage: createV2Storage()`) con estas acciones:
  - `answer(cardId, rating, nowMs, {latencyMs})`: un único `set` que actualiza la tarjeta, añade al log, incrementa `daily[dayKey].reviews` y, si la tarjeta era New, también `daily[dayKey].new`.
  - `recordConfusion(cardId, chosenIso3)`
  - `finishSession(mode, score, nowMs)`: lo que antes hacían `logSession` e `incrementStreak`, usando `localDayKey`.
  - `addSpeedScore`, `unlockPerfectContinent(continent)` e `incrementFlagSessions`
  - El estado expone `countryProgress`, recalculado con `materializeProgress` tras cada acción y en `onRehydrateStorage`.
- Listener de `storage` sobre las claves `orbita-v2` y `orbita-storage`: llama a `useGameStore.persist.rehydrate()`. Para la clave legacy, antes migra el contenido y lo fusiona.

- [ ] Tests:
  - **merge conserva repasos de ambas pestañas:** dos `StateV2` con tarjetas distintas producen ambas tarjetas, y el log contiene los dos repasos.
  - **escritura legacy posterior se fusiona sin borrar cards:** el antiguo DB-4, adaptado.
  - **storage bloqueado no lanza:** con un getter de `localStorage` que lanza `SecurityError`, `answer()` funciona en memoria.
  - Cuota: con un `setItem` que lanza una vez, la acción no lanza y el log queda a la mitad.
  - JSON corrupto: no hay escrituras y existe la clave `-corrupt-`.
  - El backup se escribe una sola vez: con un spy en `setItem` y dos importaciones del módulo.
  - Tamaño: 585 tarjetas y 5000 entradas de log dan `JSON.stringify(state).length < 350_000`.
- [ ] FAIL, implementar, PASS. `npm run build`: OK.
- [ ] Commit `feat(store): v2 schema with merge-on-write storage and migration`.

### Task 6: Selector de sesión

**Archivos:** crear `src/srs/selector.js` y `src/srs/selector.test.js`.

**Consume:** `retrievability`, `localDayKey` y la forma de StateV2. Usa `countries[].difficulty` y `population` de `src/data/countries.json`.

**Produce:** `buildSession(state, {nowMs, cat, pool: Country[], size=20, rng}): Array<{cardId, iso3, isNew, practice}>`

**Orden de prioridad:**
1. Tarjetas en Learning o Relearning con `due ≤ now + 20 min`, ordenadas por `due`.
2. Tarjetas en Review vencidas, ordenadas por R ascendente. Desempate: `lapses` descendente, luego total de `confusions` descendente, luego id.
3. Tarjetas nuevas, hasta `settings.dailyNew - daily[hoy].new`, ordenadas por `difficulty` (easy < medium < hard) y después por `population` descendente.
4. Relleno con las tarjetas en Review de menor R aún no vencidas (`practice: true`).

**Restricciones de orden:** como máximo 1 nueva cada 3 posiciones y nunca el mismo iso3 en posiciones consecutivas.

- [ ] Tests:
  - Nunca hay iso3 consecutivos repetidos (200 estados con rng sembrado).
  - Ninguna New aparece antes de una Review vencida.
  - Las Review vencidas salen ordenadas por R ascendente.
  - Hay como máximo `dailyNew - introducidasHoy` nuevas.
  - El cupo se reinicia a medianoche de Madrid: `2026-11-05T23:30:00Z` cuenta como 6-nov.
  - Determinismo: el mismo estado, `now` y semilla dan la misma salida.
  - Un pool vacío equivale al pool por defecto.
- [ ] FAIL, implementar, PASS. Commit `feat(srs): session selector`.

### Task 7: Integrar el SRS en los modos de juego

**Archivos:**
- Modificar `src/hooks/useCountryGame.js` y las páginas `FindCountry`, `FlagQuiz`, `CapitalQuiz`, `NameCountry` y `SpeedRound`
- Modificar `src/components/CircleTimer.jsx`
- Mover `src/__audit__/SRS-2`, `SRS-4`, `SRS-5` y `BUG-03` a `src/hooks/`

**Consume:** `buildSession`, `toRating` y las acciones `answer`, `recordConfusion` y `finishSession`.

**Cambios en `useCountryGame(mode, {pool, now = Date.now, rng = Math.random})`:**
- Construye la sesión una vez al empezar.
- Mide la latencia desde que se muestra la pregunta. Si la pestaña se oculta (`visibilitychange`), la latencia pasa a ser `null`.
- `handleAnswer(isCorrect, answerId, {hintUsed})` llama a `answer` con `toRating` y, si hubo error con distractor, a `recordConfusion` sin calificar el distractor.
- `finishSession` recibe la puntuación final calculada en el mismo handler, lo que corrige el closure obsoleto (BUG-03).

**SpeedRound:** llama a `answer` con `timed: true` y a `finishSession` cuando termina el temporizador.

**CircleTimer:** el intervalo no depende de props que cambian en cada respuesta (SRS-6). Usa un ref para `onComplete`.

**New Record (BUG-13):** la comparación se hace contra el mejor resultado anterior a añadir la puntuación nueva.

- [ ] Los tests movidos (SRS-2, SRS-4 y SRS-5) se adaptan a la API nueva y siguen fallando antes de cambiar el código de producción.
- [ ] Tests nuevos:
  - BUG-03: tras la última respuesta, el score que llega a `finishSession` incluye sus puntos.
  - CircleTimer: con fake timers y una respuesta cada 300 ms durante 5 s, `onComplete` se llama en t = 60 s.
  - SpeedRound muestra "New Record" cuando score > el mejor anterior.
- [ ] FAIL, implementar, PASS. `npm run build`: OK.
- [ ] E2E local en el navegador integrado: responder 5 preguntas en `/flag` y recargar. `orbita-v2.cards` contiene 5 tarjetas y `/progress` muestra la actividad de hoy.
- [ ] Commit `feat(srs): drive all game modes with fsrs sessions`.

### Task 8: Fechas en la UI y bugs de pantallas

**Archivos:** modificar `src/components/ActivityGrid.jsx`, `src/pages/Progress.jsx`, `src/components/WorldHeatmap.jsx` y `src/pages/FlagQuiz.jsx`.

**Cambios:**
- ActivityGrid usa `localDayKey` para generar las celdas (BUG-05).
- Progress muestra la racha a 0 si `daysBetween(lastSessionDay, hoy) > 1` (BUG-08) y muestra "Avg Accuracy" como aciertos / repasos del `reviewLog` (SRS-16).
- WorldHeatmap usa el umbral único `MASTERED = 60` por categoría, exportado desde `src/srs/conf.js` (BUG-12).
- El toggle de banderas parecidas funciona (SRS-10): restringe el pool a `similarTo ∪ confusions`.

- [ ] Tests:
  - Con hora del sistema `2026-11-06T00:30:00+01:00` y una respuesta, la celda de '2026-11-06' vale 1.
  - Una racha con `lastSessionDay` de hace 3 días se muestra como 0.
  - Heatmap y Progress clasifican igual a un país con 60/60/60.
  - El toggle activa `similarMode` y el pool resultante solo contiene países similares.
- [ ] FAIL, implementar, PASS. Commit `fix(ui): local dates, streak expiry, unified mastery threshold, similar flags`.

### Task 9: Robustez y limpieza

**Archivos:**
- Modificar `src/context/WorldDataContext.jsx`, `src/hooks/useSounds.js`, `src/hooks/useKeyboard.js` y `src/pages/SpeedRound.jsx`
- Borrar `src/store/progressStore.js`, `src/hooks/useLocalStorage.js` y `src/data/countries.js`
- Modificar `scripts/generateCountries.mjs` o el mapa de ids si se necesita para SSD/SDS

**Cambios:**
- WorldDataContext carga `countries` aunque falle el GeoJSON y expone `geoError` (DB-10). Los modos que no usan globo siguen funcionando sin red.
- useSounds y useKeyboard acceden a localStorage dentro de un try/catch (DB-5, BUG-20).
- SpeedRound valida `?continent=` y exige un pool de 4 países o más; si no, usa `all` (BUG-16).
- Normalizar el id de la GeoJSON `SDS` a `SSD`. Los países que siguen sin forma (BUG-10) se excluyen de los modos de globo y se cuentan aparte en el reto de los 195 países.

- [ ] Tests:
  - Con el fetch de GeoJSON rechazado, `countries.length > 0`.
  - Con localStorage bloqueado, `useSounds` renderiza.
  - `/speed?continent=Atlantis` renderiza usando `all`.
  - La normalización devuelve `SSD` para `SDS`.
- [ ] FAIL, implementar, PASS. `grep -r "progressStore\|useLocalStorage" src` no devuelve nada.
- [ ] Commit `fix: offline data, guarded storage access, speed round params, dead code`.

### Task 10: Cola de repaso, confusiones y backup en Progress

**Archivos:** modificar `src/pages/Progress.jsx`. Crear `src/srs/backup.js` y su test.

**Produce:**
- `exportProgress(state): string` (JSON con `schema:2`)
- `importProgress(json, current): StateV2`: valida `schema`, fusiona con `mergeV2` y lanza un `Error` con mensaje legible si el formato no es válido

**UI:**
- "Tienes N países para repasar hoy" (tarjetas vencidas), con un botón que lanza la sesión.
- "Confundes A y B" con los 3 pares de `confusions` más frecuentes.
- Botones para exportar e importar.
- Llamar a `navigator.storage?.persist?.()` al montar.

- [ ] Tests:
  - Ida y vuelta: `importProgress(exportProgress(s), freshV2)` deepEqual `s`.
  - Un JSON inválido lanza un error y no modifica el estado.
  - Con 3 tarjetas vencidas, el texto incluye "3".
- [ ] FAIL, implementar, PASS. Commit `feat(progress): review queue, confusions, export/import`.

### Task 11: Lint a cero y cierre

- [ ] Añadir `eslint-plugin-react` con la regla `react/jsx-uses-vars`, que elimina los 14 falsos positivos de `motion`. Corregir el resto hasta que `npm run lint` dé 0 errores. Mover `src/__audit__/` restante a sus carpetas o borrarlo.
- [ ] Cambiar `"build"` a `"npm run lint && npm test && vite build"` para que Vercel no despliegue con errores. Comprobar que Vercel ejecuta `npm run build` (sin buildCommand en `vercel.json`, sí).
- [ ] `superpowers:verification-before-completion`: `npm test`, `npm run lint` y `npm run build`, con la salida real.
- [ ] `/pr-review-toolkit:review-pr`.
- [ ] `/commit` y push de la rama (lo decide la usuaria). E2E en la URL de preview de Vercel:
  - Inyectar un `orbita-storage` v0 típico y recargar. Se crean `orbita-v2` y el backup, y ESP sigue dominado.
  - Responder y recargar. El progreso persiste.
  - Con dos pestañas, responder en ambas. Ambas respuestas se conservan.
- [ ] `superpowers:finishing-a-development-branch` para el PR o el merge a `main`, y después `/claude-md-management:revise-claude-md`.
