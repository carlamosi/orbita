# Auditoría Orbita · 2026-11-05

Workflow: 3 auditores + 7 verificadores adversariales. 50 hallazgos brutos, deduplicados a 32.
Línea base: build OK · lint 69 errores / 5 avisos · 0 tests previos.

## Verificados con test (src/__audit__/)

| ID | Sev. | Veredicto | Hallazgo | Ubicación | Duplicados |
|---|---|---|---|---|---|
| SRS-1 | critica | **CONFIRMED** | FlagQuiz se rompe al montarse: faltan los imports de useState, useMemo y useEffect | `src/pages/FlagQuiz.jsx:10` |  |
| DB-1 | critica | **CONFIRMED** | Dos pestañas: el último que escribe gana y borra el progreso de la otra | `src/store/useGameStore.js:89` | DB-2, BUG-02, DB-3 |
| DB-4 | critica | **CONFIRMED** | Tras un autoUpdate del SW, una pestaña abierta con el bundle viejo sobrescribe el esquema nuevo | `vite.config.js:9` |  |
| BUG-01 | critica | **CONFIRMED** | FlagQuiz no importa useState/useMemo/useEffect: la ruta /flag lanza un ReferenceError y deja la pantalla en blanco | `src/pages/FlagQuiz.jsx:1` |  |
| SRS-2 | alta | **CONFIRMED** | No hay repetición espaciada: la siguiente pregunta se elige con Math.random() uniforme | `src/hooks/useCountryGame.js:44` | SRS-3, BUG-17 |
| SRS-4 | alta | **CONFIRMED** | Se penaliza al país elegido por error (-5 y timesWrong+1), aunque nunca se preguntó por él | `src/hooks/useCountryGame.js:92` | BUG-11, DB-11 |
| SRS-5 | alta | **CONFIRMED** | Speed Round no registra ninguna respuesta en el progreso, la sesión ni la racha | `src/pages/SpeedRound.jsx:70` | BUG-09 |

## Sin test (graves sin verificador por límite, o media/baja)

| ID | Sev. | Hallazgo | Ubicación | Duplicados |
|---|---|---|---|---|
| SRS-6 | alta | El temporizador de Speed Round se congela si se responde más rápido que una vez por segundo | `src/components/CircleTimer.jsx:17` | BUG-04 |
| SRS-8 | alta | La confianza no decae con el tiempo: 'Mastered' es permanente y no modela el olvido | `src/store/useGameStore.js:31` | DB-7 |
| SRS-10 | alta | El toggle 'Similar Flags Challenge' no se puede activar: setSimilarMode nunca se usa | `src/pages/FlagQuiz.jsx:147` | BUG-18 |
| DB-5 | alta | Acceso directo a localStorage sin try/catch: la app se rompe si el storage está bloqueado; el store no persiste y no avisa | `src/hooks/useSounds.js:13` |  |
| DB-9 | alta | Fechas guardadas en UTC: dailyActivity y streak se asignan al día equivocado en Europe/Madrid | `src/store/useGameStore.js:39` | BUG-06, BUG-07, SRS-14 |
| DB-10 | alta | WorldDataContext solo carga countries si el fetch del GeoJSON va bien: sin red, el juego no arranca | `src/context/WorldDataContext.jsx:20` | BUG-15, SRS-15 |
| BUG-03 | alta | logSession guarda la puntuación sin los puntos de la última respuesta (closure obsoleto de score) | `src/hooks/useCountryGame.js:31` | SRS-13 |
| BUG-05 | alta | ActivityGrid desplaza un día toda la actividad en Europe/Madrid: lo jugado hoy no aparece y cada celda muestra el recuento del día anterior | `src/components/ActivityGrid.jsx:17` |  |
| BUG-10 | alta | 31 de los 195 países no tienen forma en la GeoJSON (SSD aparece como 'SDS'): 'The 195' es imposible y el modo Capital 'On Globe' pregunta países que no se pueden pulsar | `src/hooks/useCountryGame.js:48` | SRS-12 |
| BUG-13 | alta | SpeedRound nunca muestra 'New Record!' y en su lugar enseña '+score from your previous attempts' | `src/pages/SpeedRound.jsx:236` |  |
| SRS-7 | media | La calificación es binaria: no se mide el tiempo de respuesta y la pista no reduce la nota | `src/hooks/useCountryGame.js:72` |  |
| SRS-9 | media | Los puntos débiles solo se muestran: no se priorizan, se mezclan las categorías y el botón 'Drill' no practica ese país | `src/pages/Progress.jsx:80` |  |
| SRS-11 | media | No hay dificultad adaptativa: el campo 'difficulty' del dataset no se usa y los 195 países se mezclan desde el día 1 | `src/hooks/useCountryGame.js:39` |  |
| DB-6 | media | QuotaExceededError al guardar se propaga desde la acción y deja la memoria distinta del disco | `src/store/useGameStore.js:22` |  |
| DB-8 | media | El esquema declarado challenges.perfectContinents no coincide con lo que se escribe (claves perfect_X) | `src/store/useGameStore.js:17` |  |
| BUG-08 | media | La racha mostrada no caduca: Progress enseña una racha antigua aunque haga días que no se juega | `src/pages/Progress.jsx:111` |  |
| BUG-12 | media | El umbral de 'dominado' cambia según la pantalla | `src/components/WorldHeatmap.jsx:35` |  |
| BUG-14 | media | speedRoundBests guarda solo un top 10 global: las marcas por continente desaparecen. Además unlockChallenge ignora el esquema perfectContinents | `src/store/useGameStore.js:84` |  |
| BUG-16 | media | SpeedRound con un ?continent= inválido (o con menos de 4 países) rompe el render | `src/pages/SpeedRound.jsx:49` |  |
| SRS-16 | baja | 'Avg Accuracy' muestra la confianza media de los países tocados, no la tasa de aciertos | `src/pages/Progress.jsx:67` |  |
| DB-12 | baja | Código muerto con otro esquema: progressStore.js (escala 0-5, claves orbita_*) y useLocalStorage sin uso | `src/store/progressStore.js:8` |  |
| DB-13 | baja | Cada set serializa el estado entero; dailyActivity crece sin límite | `src/store/useGameStore.js:65` |  |
| BUG-19 | baja | En StrictMode (dev) el efecto de inicio llama dos veces a nextQuestion: la partida empieza en 2/20 y se salta una pregunta | `src/hooks/useCountryGame.js:67` |  |
| BUG-20 | baja | useKeyboard escribe en localStorage sin try/catch antes de ejecutar el handler | `src/hooks/useKeyboard.js:26` |  |
| BUG-21 | baja | Código muerto que contradice el modelo real: progressStore.js (escala 0-5 y otras claves), useLocalStorage.js y data/countries.js vacío | `src/store/progressStore.js:14` |  |

## Detalle de cada hallazgo

### SRS-1 · FlagQuiz se rompe al montarse: faltan los imports de useState, useMemo y useEffect

- **Severidad:** critica
- **Ubicación:** `src/pages/FlagQuiz.jsx:10`
- **Evidencia:** La línea 1 solo importa { motion, AnimatePresence } de 'framer-motion'. No hay ningún import de 'react', y aun así las líneas 10, 11, 14, 25-29, 33 y 43 usan useState, useMemo y useEffect. Ejecuté `npx eslint src/pages/FlagQuiz.jsx` y devuelve no-undef "'useState' is not defined" (10:33, 11:41, 25:39...), "'useMemo' is not defined" (14:16, 43:19) y "'useEffect' is not defined" (33:3). Así está en el commit HEAD (git show HEAD:src/pages/FlagQuiz.jsx). La ruta /flag se monta en App.jsx:45 y no hay ErrorBoundary (grep sin resultados).
- **Reproducción:** 1) npm run dev. 2) Ir a /flag. 3) La consola muestra ReferenceError: useState is not defined y la página queda en blanco. Ninguna respuesta de bandera actualiza flagConf, así que esa categoría (195 de las 585 tarjetas) no se puede estudiar.
- **Propuesta:** Añadir `import { useState, useMemo, useEffect } from 'react'`. Añadir un test de humo que renderice cada página de juego con un WorldDataProvider simulado, y poner `npm run lint` como paso obligatorio de CI antes del push a main (el lint ya detecta el fallo).
- **Verificación (CONFIRMED):** Confirmado. Lo leí yo misma en src/pages/FlagQuiz.jsx: las líneas 1-6 no importan nada de 'react'. La línea 10 llama a useState, y más abajo se usan useMemo (14, 43) y useEffect (33).

El test monta FlagQuiz dentro de un MemoryRouter y simula solo lo imprescindible: useWorldData devuelve una lista de países vacía; useCountryGame y useKeyboard son stubs; Confetti y Button son componentes vacíos. Ninguno de esos mocks interviene en el fallo. Afirma el comportamiento correcto: montar la página no debe lanzar ninguna excepción. El test falla con "ReferenceError: useState is not defined" al llegar a la línea 10, que es justo el motivo del hallazgo y no un problema de import o de configuración del test. Este test no ejerce el plugin de React de Vite, así que no comprueba si en la app real algo inyecta useState (por ejemplo, auto-import). Aun así, vite.config.js no tiene ningún plugin de ese tipo, solo react() y VitePWA, así que en dev y en el build pasaría lo mismo.

@testing-library/react no se pudo usar porque falta @testing-library/dom en node_modules. Por eso el render se hace directamente con react-dom/client y act de React 19.

Dos partes del hallazgo no las he comprobado: que App.jsx:45 monte la ruta /flag y que no haya ErrorBoundary. Tampoco el impacto que se le atribuye (que las 195 tarjetas de bandera no se puedan estudiar). Sí es cierto que, si el componente no se monta, nunca llega a llamar a handleAnswer y por tanto no se actualiza flagConf.

### DB-1 · Dos pestañas: el último que escribe gana y borra el progreso de la otra

- **Severidad:** critica
- **Ubicación:** `src/store/useGameStore.js:89`
- **Evidencia:** persist se configura solo con name y partialize (líneas 89-102). No hay listener de 'storage', ni BroadcastChannel, ni rehydrate(). En zustand 5.0.12 (node_modules/zustand/esm/middleware.mjs:356-371) cada set() hace storage.setItem(name, {state: partialize(get()), version}), es decir, reescribe el estado entero desde la memoria de esa pestaña.
- **Reproducción:** 1) Abre Orbita en la pestaña A y en la pestaña B. 2) En A juega una partida de FindCountry y acierta ESP (countryProgress.ESP.locationConf=15). 3) Sin recargar B, responde allí cualquier pregunta. 4) Recarga A: ESP ya no tiene progreso, porque B ha escrito su snapshot viejo encima. totalSessions, streak y dailyActivity de A también se pierden.
- **Propuesta:** Escuchar window 'storage' para la clave y llamar a useGameStore.persist.rehydrate(). Mejor aún: guardar un rev/updatedAt y fusionar por campo (max de conf/stability, unión de reviewLog por id) en vez de last-write-wins. Con v2, usar BroadcastChannel('orbita') para avisar al resto de pestañas.
- **Verificación (CONFIRMED):** Confirmado. El test simula dos pestañas: dos instancias independientes del store (vi.resetModules + import dinámico) que comparten el mismo localStorage, igual que dos pestañas del mismo origen. La pestaña A acierta ESP (locationConf=15), llama a incrementStreak y logSession, y el valor queda escrito en localStorage (lo comprueba un assert intermedio que pasa). Después se envía a la pestaña B el evento 'storage' que un navegador real mandaría a las demás pestañas, y B responde una pregunta sobre FRA. Al "recargar" A (una instancia nueva que lee localStorage), FRA está guardado pero ESP es undefined. Es decir, B ha escrito encima su copia vieja del estado completo y ha borrado el progreso de A. El fallo está en el assert de ESP (línea 52), no viene de un import ni de la preparación del test. Coincide con el código: el persist de src/store/useGameStore.js:89-102 solo configura name y partialize. No hay listener de 'storage', ni BroadcastChannel, ni llamada a rehydrate(), así que cada set() reescribe el estado entero con lo que esa pestaña tiene en memoria. totalSessions y dailyActivity se perderían por la misma vía, aunque el test se detiene en el primer assert. Solo he creado src/__audit__/DB-1.test.js y no he tocado nada más.

### DB-4 · Tras un autoUpdate del SW, una pestaña abierta con el bundle viejo sobrescribe el esquema nuevo

- **Severidad:** critica
- **Ubicación:** `vite.config.js:9`
- **Evidencia:** registerType: 'autoUpdate' (vite.config.js:9). main.jsx no importa virtual:pwa-register, así que vite-plugin-pwa 1.2.0 usa injectRegister 'script' (node_modules/vite-plugin-pwa/dist/index.js:253-254). El SW nuevo toma el control, pero las pestañas ya abiertas siguen ejecutando el JS viejo hasta que se recargan. Ese código viejo escribe partialize v0 (useGameStore.js:91-101) con version 0 sobre la misma clave 'orbita-storage' (middleware.mjs:356-361), y descarta cualquier campo v2 (cards, reviewLog).
- **Reproducción:** 1) Pestaña A abierta con la versión actual. 2) Se despliega la v2 (version 2 + migrate) y se abre la pestaña B, que migra y guarda {version:2, state:{cards...}}. 3) En A, sin recargar, responde una pregunta: se escribe {version:0, state:{countryProgress...}} y desaparecen cards y reviewLog. 4) Al recargar B, se vuelve a migrar desde v0 y se pierde todo lo aprendido en B.
- **Propuesta:** Guardar v2 en una clave nueva ('orbita-v2'). El código viejo solo conoce 'orbita-storage' y no puede pisarla. En v2, escuchar el evento 'storage' de la clave legacy y volver a aplicar con max-merge lo que escriba una pestaña vieja. Para futuras versiones, añadir un guard en setItem que no escriba si el stored.version es mayor que el del código, y mostrar 'Recarga para actualizar'.
- **Verificación (CONFIRMED):** Confirmado en jsdom. La pestaña A se simula con el store actual (src/store/useGameStore.js) ya hidratado. Después se escribe en 'orbita-storage' lo que guardaría la pestaña B con la v2: {version:2, state:{countryProgress:{BOL...}, cards, reviewLog}}. Sin recargar, A llama a updateProgress('FRA','capitalConf',10) y persist reescribe la clave entera con partialize v0 (useGameStore.js:91-101) y version 0. Como se ve en la salida, desaparecen cards y reviewLog, y también el progreso de BOL que había hecho B, porque A escribe su estado en memoria sin volver a leer el storage. El store no tiene version, no compara versiones antes de escribir y no escucha el evento 'storage'. El fallo es de aserción (version 0 en vez de 2 o más), no de import ni de setup.

Matices: 1) La v2 todavía no existe. El riesgo es que el código actual será el "bundle viejo" de las pestañas abiertas cuando se despliegue la v2, así que la defensa tiene que estar en la v2: clave nueva o separada, escritura que no baje la versión, o recarga forzada con onNeedRefresh/controllerchange. 2) No comprobé en jsdom la parte del Service Worker (autoUpdate/injectRegister). Solo verifiqué que vite.config.js:9 usa registerType 'autoUpdate' y que src no importa virtual:pwa-register. 3) Con el bundle actual también se pierden datos entre dos pestañas de la misma versión: gana la última que escribe. Eso hace el problema más grave, aunque es independiente del despliegue.

### BUG-01 · FlagQuiz no importa useState/useMemo/useEffect: la ruta /flag lanza un ReferenceError y deja la pantalla en blanco

- **Severidad:** critica
- **Ubicación:** `src/pages/FlagQuiz.jsx:1`
- **Evidencia:** Las líneas 1-5 solo importan framer-motion, react-router-dom, ../components, useCountryGame y useWorldData. No hay `import ... from 'react'`. Sin embargo usa useState (l.10, 11, 25-29), useMemo (l.14, 43, 89) y useEffect (l.33). ESLint lo confirma: 'FlagQuiz.jsx:10:33 no-undef useState is not defined' (9 errores no-undef). App.jsx no tiene ErrorBoundary (grep 'ErrorBoundary' en src: 0 resultados), así que el error tumba todo el árbol.
- **Reproducción:** npm run dev, entrar en /flag (o pulsar Flag Quiz en Home). En consola: 'ReferenceError: useState is not defined' y pantalla en blanco. Con Vitest basta render(<MemoryRouter><WorldDataProvider><FlagQuiz/></WorldDataProvider></MemoryRouter>) y expect(...).toThrow(/useState is not defined/).
- **Propuesta:** Añadir `import { useState, useMemo, useEffect } from 'react'` y un ErrorBoundary por ruta en App.jsx que muestre un mensaje y un botón de reintento. Añadir un smoke test que monte cada página.
- **Verificación (CONFIRMED):** Confirmado. Lo he leído en src/pages/FlagQuiz.jsx: las líneas 1-6 importan framer-motion, react-router-dom, ../components, useCountryGame, useWorldData y useKeyboard, pero no hay ningún import de 'react'. Aun así el componente usa useState en la línea 10, useMemo en la 14 y useEffect en la 33. El test monta <FlagQuiz/> dentro de un MemoryRouter en /flag con react-dom/client createRoot y act. Solo simula useWorldData, con 4 países mínimos. No usa render de @testing-library/react porque @testing-library/dom no está instalado y no tengo permiso para instalarlo. El test comprueba lo correcto, que el montaje no lanza error, y falla con el mismo error del hallazgo: el ReferenceError 'useState is not defined', lanzado al renderizar FlagQuiz. No es un fallo de import ni de configuración: los módulos se resuelven bien y el error sale del cuerpo del componente. No he comprobado en el navegador la pantalla en blanco ni que falte un ErrorBoundary; eso queda fuera del test. Que un error de render no capturado desmonte todo el árbol en React 19 es coherente con lo que dice el hallazgo.

### SRS-2 · No hay repetición espaciada: la siguiente pregunta se elige con Math.random() uniforme

- **Severidad:** alta
- **Ubicación:** `src/hooks/useCountryGame.js:44`
- **Evidencia:** Línea 38: comentario "Pick a random country. (Improvement: weight by difficulty or spaced repetition later)". Línea 44: `const pick = activePool[Math.floor(Math.random() * activePool.length)]`. No se lee countryProgress, no hay fecha de vencimiento, intervalo ni cola diaria. SKILLD.md:203-209 exige SRS con intervalo creciente, cola de repaso diaria y "Search for the best spaced repetition algorithm".
- **Reproducción:** 1) Jugar /find y fallar Chad 3 veces (timesWrong=3, locationConf=0). 2) Jugar otra sesión de 20: la probabilidad de que salga Chad es 1-(194/195)^20, unos 9,8 %, igual que la de un país dominado al 100 %. Ningún país vuelve 'mañana' ni en el siguiente intervalo.
- **Propuesta:** Sustituir la selección por un selector puro `buildSession(cards, now, opts)` sobre FSRS-6 (ver diseño): primero aprendizaje y reaprendizaje vencidos, después repasos vencidos ordenados por menor retrievability y después nuevas con cupo diario, ordenadas por popularidad.
- **Verificación (CONFIRMED):** The finding holds. I read src/hooks/useCountryGame.js. The comment at line 38 says "Improvement: weight by difficulty or spaced repetition later". Line 44 picks the next country with `activePool[Math.floor(Math.random() * activePool.length)]`. The hook never reads countryProgress; it only writes to it through updateProgress at lines 84 and 89. It also has no due date, no interval and no daily queue.

The test mocks only useWorldData, with two countries (TCD and FRA) that both have a shape, and useSounds. It loads into the real Zustand store a weak Chad (conf 0, timesWrong 3) and a mastered France (conf 100). It then mounts useCountryGame('find') 400 times and counts how often Chad is the first question.

@testing-library/react could not load because its dependency @testing-library/dom is missing, so I rendered the hook with react-dom/client and act instead. A sanity check confirms the hook produced a question in all 400 mounts, so the failure is not a setup problem.

Result: Chad came up 181 of 400 times (45.3%), which matches a uniform 50/50 pick. The test expected more than 70%, as weighting toward weak countries should give, and it fails on that assertion. The selection ignores the user's progress, which confirms the finding.

A note on the proposed reproduction steps: they fit the code exactly, but "locationConf=0" after 3 misses assumes a starting value of 0 (the clamp floors at 0).

### SRS-4 · Se penaliza al país elegido por error (-5 y timesWrong+1), aunque nunca se preguntó por él

- **Severidad:** alta
- **Ubicación:** `src/hooks/useCountryGame.js:92`
- **Evidencia:** Líneas 90-93: `if (answerId) { // Punish the wrongly selected country too playfully  updateProgress(answerId, confType, -5, true) }`. Lo llaman FindCountry.jsx:47 (cid del polígono clicado), FlagQuiz.jsx:79, NameCountry.jsx:76 y CapitalQuiz.jsx:71 (modo 'On Globe', que escribe capitalConf del país clicado). updateProgress (useGameStore.js:22-35) crea una entrada aunque el id no esté en countries.json.
- **Reproducción:** 1) /find, pregunta 'Chad'. 2) Clicar Níger. 3) En localStorage 'orbita-storage', countryProgress.NER.timesWrong pasa a 1 y locationConf baja 5, aunque no se preguntó por Níger. Níger aparece en 'Top Weak Spots' (Progress.jsx:80-86). Si se clica un polígono que no está en el dataset, aparece una tarjeta de weak spot sin nombre ni bandera.
- **Propuesta:** En SRS solo se califica la tarjeta preguntada. Guardar el error como par de confusión `confusions['flag:TCD|ROU']++` para detectar puntos débiles y elegir distractores, sin tocar la tarjeta del distractor. Validar que el id existe en countries antes de escribir.
- **Verificación (CONFIRMED):** The finding is confirmed. Both tests fail for the reason the finding gives, not because of setup.

What the test does: it renders the real useCountryGame('find') hook with the real Zustand store. The only mocks are useWorldData (countries = [Chad]; geoData has Chad and Niger) and useSounds. With Chad as the question, it calls handleAnswer(false, 'NER') the same way FindCountry.jsx:47 does.

What happens:
- Chad is penalised, which is expected (useCountryGame.js:89).
- An entry is also created for NER with timesWrong=1 (useCountryGame.js:90-93), even though nobody asked about Niger. locationConf stays at 0 only because it started at 0; the -5 is applied and clamped at 0 by useGameStore.js:31.
- The second test passes the id '-99', which is not in the dataset. The store still creates an entry with timesWrong=1, because updateProgress (useGameStore.js:22-35) never checks that the id exists.

Visible effect: Progress.jsx:80-86 builds the Weak Spots list from entries with timesWrong > 0, using countries.find(...). So Niger shows up as a weak spot. For an id not in the dataset, that lookup returns undefined, which leaves a card with no name and no flag.

Caveats:
- The comment in the code ("Punish the wrongly selected country too playfully") shows the penalty is deliberate. But it conflicts with the SRS spec, and it corrupts the timesWrong count used for Weak Spots, so I am keeping the severity.
- @testing-library/dom is not installed in the worktree, so renderHook from @testing-library/react fails on import. I could not install it, so the test file has a minimal renderHook of its own built on react-dom/client and React's act. Only that file was created; nothing in src/ or any other file was changed.

### SRS-5 · Speed Round no registra ninguna respuesta en el progreso, la sesión ni la racha

- **Severidad:** alta
- **Ubicación:** `src/pages/SpeedRound.jsx:70`
- **Evidencia:** handleAnswer (líneas 70-84) solo cambia el estado local (score, correctCount, wrongCount) y los sonidos. handleTimeUp (120-132) solo llama a addSpeedScore y unlockChallenge. En todo el archivo no hay updateProgress, logSession ni incrementStreak. Además, generateQuestion (38-58) elige el país y el tipo con sort(()=>Math.random()-0.5), que es un barajado sesgado.
- **Reproducción:** 1) Jugar /speed 60 s acertando 15 banderas y capitales. 2) countryProgress, dailyActivity, streak y totalSessions no cambian. ActivityGrid y la racha no reflejan la sesión.
- **Propuesta:** Usar el mismo pipeline de revisión: para cada respuesta, `reviewCard(cardId(target, category(type)), rating, now)`, con la calificación limitada a Again o Good, porque con prisa la latencia no es fiable. Al terminar, llamar a logSession e incrementStreak. Si se quiere que Speed sea un juego puro, documentarlo y excluirlo explícitamente.
- **Verificación (CONFIRMED):** Hallazgo confirmado. El test renderiza el SpeedRound real (src/pages/SpeedRound.jsx) con el store real de Zustand. Solo se simulan WorldDataContext (4 países), useSounds, useKeyboard, Button y CircleTimer. CircleTimer se sustituye por un botón que llama a onComplete para simular que pasan los 60 s. Math.random está fijado en 0.5, así que el orden queda determinista: el objetivo es ESP y el tipo es capital_to_name. La fecha está fijada en 2026-11-05 con TZ=Europe/Madrid.

Se responde 15 veces bien y luego se agota el tiempo. Las comprobaciones de control pasan: speedRoundBests[0] tiene score 150 y fraction '15/15'. Eso demuestra que la partida se jugó y que handleTimeUp se ejecutó. Las cuatro comprobaciones del comportamiento esperado fallan, y lo hacen por el motivo del hallazgo, no por errores de import o de configuración:
- countryProgress.ESP es undefined.
- dailyActivity está vacío.
- totalSessions vale 0.
- streak vale 0.

Esto coincide con el código:
- handleAnswer (SpeedRound.jsx:70-84) solo cambia el estado local y reproduce sonidos.
- handleTimeUp (120-132) solo llama a addSpeedScore y unlockChallenge.
- En ninguna parte del archivo se llama a updateProgress, logSession ni incrementStreak (useGameStore.js:22, 38, 58).

El barajado sesgado con sort(() => Math.random() - 0.5) en las líneas 48 y 52 existe en el código, pero este test no lo mide. Solo se usó un objetivo fijo.

El único archivo creado es src/__audit__/SRS-5.test.jsx. No se ha modificado nada de src/.

### SRS-6 · El temporizador de Speed Round se congela si se responde más rápido que una vez por segundo

- **Severidad:** alta
- **Ubicación:** `src/components/CircleTimer.jsx:17`
- **Evidencia:** CircleTimer.jsx:6-17 tiene useEffect con deps [isRunning, timeLeft, onComplete] y crea un setInterval nuevo de 1000 ms cada vez que el efecto se vuelve a ejecutar. SpeedRound.jsx:169 pasa `onComplete={handleTimeUp}`, una función nueva en cada render, y cada respuesta provoca renders (setScore, más setFlash(true) y setFlash(false) a los 50 ms, líneas 63-64). Cada render limpia el intervalo y lo reinicia desde 0 ms.
- **Reproducción:** Test con vi.useFakeTimers(): renderizar <CircleTimer durationSeconds={60} isRunning onComplete={()=>{}}/> y hacer rerender con una nueva función onComplete cada 900 ms durante 10 s. timeLeft sigue en 60. En la app, pulsar '1' repetidamente cada menos de 1 s: el contador no baja. Además, StrictMode (main.jsx:8) puede llamar dos veces a onComplete en desarrollo.
- **Propuesta:** Calcular el tiempo restante a partir de un deadline (endAt = now()+60000) con un solo intervalo, guardar onComplete en un ref (useRef/useEffectEvent) y quitarlo de las deps. Disparar onComplete una única vez con una bandera. Inyectar now() para testear.

### SRS-8 · La confianza no decae con el tiempo: 'Mastered' es permanente y no modela el olvido

- **Severidad:** alta
- **Ubicación:** `src/store/useGameStore.js:31`
- **Evidencia:** useGameStore.js:31 `[type]: Math.max(0, Math.min(100, prev[type] + delta))` solo cambia al responder, nunca en función del tiempo transcurrido. Progress.jsx:29 y Challenges.jsx:44 cuentan como dominado si las tres Conf son >= 60. Con +15 por acierto (useCountryGame.js:84) basta con 4 aciertos seguidos en una sola tarde. No se guarda last_review ni due.
- **Reproducción:** 1) Acertar Bután 4 veces en cada categoría hoy. 2) Avanzar el reloj 1 año (vi.setSystemTime). 3) Progress sigue mostrando Bután como Mastered, y Globe3D (línea 166) y WorldHeatmap (30, 46) lo pintan como dominado, aunque la probabilidad real de recordarlo es baja.
- **Propuesta:** Guardar el estado FSRS (stability, difficulty, last_review, due, state, reps, lapses) por tarjeta y derivar *Conf a partir de la retrievability actual y la stability (ver diseño). Así la confianza baja sola con el tiempo y 'Mastered' significa S >= 7 días y R >= 0,9.

### SRS-10 · El toggle 'Similar Flags Challenge' no se puede activar: setSimilarMode nunca se usa

- **Severidad:** alta
- **Ubicación:** `src/pages/FlagQuiz.jsx:147`
- **Evidencia:** Línea 11: `const [similarMode, setSimilarMode] = useState(false)`. eslint informa de "'setSimilarMode' is assigned a value but never used". El <label> de las líneas 147-156 no contiene ningún <input> ni onClick. Los 10 países con similarTo (TCD<->ROU, COL<->VEN, ISL<->NOR, IDN<->MCO, IRL<->CIV) nunca se entrenan como pares confundibles.
- **Reproducción:** Con SRS-1 corregido: abrir /flag y hacer clic en 'Similar Flags Challenge'. La casilla no se marca y el pool sigue siendo de 195 países.
- **Propuesta:** Usar <input type='checkbox' checked={similarMode} onChange={e=>setSimilarMode(e.target.checked)}> dentro del label. Integrarlo con el SRS: el par similar se usa como distractor y el error se guarda como confusión.

### DB-5 · Acceso directo a localStorage sin try/catch: la app se rompe si el storage está bloqueado; el store no persiste y no avisa

- **Severidad:** alta
- **Ubicación:** `src/hooks/useSounds.js:13`
- **Evidencia:** useSounds.js:13 y :31, FlagQuiz.jsx:30 y :35, SpeedRound.jsx:20 y :103 y useKeyboard.js:26 llaman a localStorage sin try/catch. Con el almacenamiento bloqueado, acceder a window.localStorage lanza SecurityError. En ese caso createJSONStorage devuelve undefined (middleware.mjs:278-282) y persist solo hace console.warn en cada set (middleware.mjs:344-353): no se guarda nada y la UI no lo indica.
- **Reproducción:** 1) En Chrome: Configuración > Cookies > Bloquear todas las cookies de terceros y datos de sitios (o en un iframe sandbox sin allow-same-origin). 2) Abre /flag-quiz: el render de useSounds o FlagQuiz lanza SecurityError y la pantalla se queda en blanco. 3) En una página que no accede directo a localStorage, el progreso no se guarda y no aparece ningún aviso.
- **Propuesta:** Crear un helper safeStorage (get/set/remove con try/catch y fallback en memoria) y usarlo en todos los accesos. Cuando persist no tenga storage, mostrar un banner del tipo 'Tu progreso no se guardará en este navegador'.

### DB-9 · Fechas guardadas en UTC: dailyActivity y streak se asignan al día equivocado en Europe/Madrid

- **Severidad:** alta
- **Ubicación:** `src/store/useGameStore.js:39`
- **Evidencia:** incrementStreak usa new Date().toISOString().split('T')[0] (useGameStore.js:39) y logSession hace lo mismo (useGameStore.js:59). Es la fecha UTC. En Madrid (UTC+1 en invierno, UTC+2 en verano), entre las 00:00 y la 01:00 o 02:00 locales se guarda el día anterior.
- **Reproducción:** 1) Con vi.setSystemTime('2026-11-06T00:30:00+01:00') y TZ=Europe/Madrid, llama a logSession('find', 10). 2) dailyActivity guarda '2026-11-05' en vez de '2026-11-06'. 3) Si se juega el día 5 a las 20:00 y el día 6 a las 00:30, ambos cuentan como el día 5 y la racha no sube.
- **Propuesta:** Guardar la clave de día como fecha local (Intl.DateTimeFormat('en-CA') con la zona del dispositivo), y los timestamps como epoch ms. En v2, usar dayIndex local para due y SRS. La migración puede dejar las claves viejas como están.

### DB-10 · WorldDataContext solo carga countries si el fetch del GeoJSON va bien: sin red, el juego no arranca

- **Severidad:** alta
- **Ubicación:** `src/context/WorldDataContext.jsx:20`
- **Evidencia:** setCountries(countriesStaticData) está dentro del try, después de await fetch y res.json() (líneas 16-20), y no se comprueba res.ok. Si el fetch falla (offline en la primera visita, rate limit de raw.githubusercontent o un 404), countries queda en null. useCountryGame.js:27 sale con if (!countries || !geoData) return y no hay preguntas, aunque countries.json es local.
- **Reproducción:** 1) DevTools > Network > Offline (o bloquea raw.githubusercontent.com) con la caché del SW vacía. 2) Abre /flag-quiz: no aparece ninguna pregunta, ni siquiera en modo bandera, que no necesita el GeoJSON.
- **Propuesta:** Llamar a setCountries(countriesStaticData) fuera del try y de forma síncrona en el useState inicial. Comprobar res.ok. Permitir los modos flag y capital sin geoData, o empaquetar el GeoJSON en el build.

### BUG-03 · logSession guarda la puntuación sin los puntos de la última respuesta (closure obsoleto de score)

- **Severidad:** alta
- **Ubicación:** `src/hooks/useCountryGame.js:31`
- **Evidencia:** nextQuestion es un useCallback que captura `score` (deps en la l.62) y en la l.31 hace `logSession(mode, score)`. Las páginas lo llaman desde un setTimeout creado en el handler del clic: FindCountry.jsx:35-40 y 48-53, FlagQuiz.jsx:72-77, CapitalQuiz.jsx:37-41 y NameCountry.jsx:57-62. Ese handler se renderizó antes de que handleAnswer hiciera setScore(s => s + 10 + combo*2) (useCountryGame.js:79), así que la última respuesta acertada no llega a activityLog. La pantalla final muestra `score` actualizado; el valor persistido es menor.
- **Reproducción:** Jugar FindCountry hasta la pregunta 20 y acertarla. La overlay muestra, por ejemplo, 250, pero useGameStore.getState().activityLog[0].score vale 240 o menos (falta 10 + combo*2). En Vitest: renderHook(useCountryGame) con WorldData mockeado y fake timers; llegar a questionCount=20, act(() => handleAnswer(true)), y después llamar al nextQuestion capturado antes del re-render. activityLog[0].score !== result.current.score.
- **Propuesta:** Mantener la puntuación en un useRef (scoreRef.current += pts) o mover la lógica de fin de sesión a una acción del store (endSession(mode)) que lea el estado actual. Mejor aún: que handleAnswer registre cada respuesta en el store y que la puntuación final se derive de ahí.

### BUG-05 · ActivityGrid desplaza un día toda la actividad en Europe/Madrid: lo jugado hoy no aparece y cada celda muestra el recuento del día anterior

- **Severidad:** alta
- **Ubicación:** `src/components/ActivityGrid.jsx:17`
- **Evidencia:** l.10: today.setHours(0,0,0,0) fija la medianoche local. l.17: d.toISOString().split('T')[0]. En CET (UTC+1) la medianoche local del 2026-11-05 es 2026-11-04T23:00Z, así que la clave resulta '2026-11-04'. logSession (useGameStore.js:59) guarda las sesiones de hoy a mediodía con la clave '2026-11-05', que no está entre las 364 claves generadas. El tooltip usa dateObj (fecha local), por lo que la etiqueta dice 5 nov y muestra el recuento del 4.
- **Reproducción:** Con TZ=Europe/Madrid, jugar una sesión completa de 20 preguntas a las 12:00 y abrir /progress: la última celda (hoy) está vacía. Mañana esa sesión aparecerá en la celda etiquetada como 'mañana'. En Vitest: process.env.TZ='Europe/Madrid', vi.setSystemTime('2026-11-05T11:00:00Z'), poner dailyActivity {'2026-11-05': 3} en el store, renderizar ActivityGrid y comprobar que el último cuadro tiene el fondo vacío '#0d0d1a'.
- **Propuesta:** Crear una única utilidad localDateKey(date) que use getFullYear/getMonth/getDate (o Intl.DateTimeFormat('en-CA', {timeZone})) y usarla en ActivityGrid, logSession e incrementStreak.

### BUG-10 · 31 de los 195 países no tienen forma en la GeoJSON (SSD aparece como 'SDS'): 'The 195' es imposible y el modo Capital 'On Globe' pregunta países que no se pueden pulsar

- **Severidad:** alta
- **Ubicación:** `src/hooks/useCountryGame.js:48`
- **Evidencia:** He cruzado countries.json con la GeoJSON de WorldDataContext.jsx:6 (descargada a scratchpad): faltan AND, ATG, BHR, BRB, CPV, COM, DMA, GRD, KIR, UNK, LIE, MDV, MLT, MHL, MUS, FSM, MCO, NRU, PLW, KNA, LCA, VCT, WSM, SMR, STP, SYC, SGP, SSD, TON, TUV y VAT (31). En useCountryGame.js:48-56 los modos find/name los descartan, así que su locationConf nunca puede subir y Challenges.jsx:44/69 (masteredCount >= 195) es inalcanzable (el máximo es 164). En el modo 'capital' la comprobación de forma se salta (l.48-49), pero CapitalQuiz.jsx:15/52-77 usa ese mismo modo para 'locate' en el globo: pide, por ejemplo, 'Valletta' (MLT), que no tiene polígono, y cualquier clic cuenta como fallo.
- **Reproducción:** CapitalQuiz, pestaña 'On Globe': jugar sesiones hasta que salga un microestado (alrededor del 16 % de las preguntas). No hay polígono que pulsar y cualquier respuesta resta 10 de capitalConf. En Vitest: con una GeoJSON de fixture sin MLT y Math.random mockeado para elegir MLT, useCountryGame('capital') devuelve MLT como currentCountry.
- **Propuesta:** Calcular una sola vez el conjunto askableByMode (ids con forma, más una tabla de alias SSD↔SDS y -99→XKX/CYN/SOL) y filtrar el pool por modo. Para los microestados, usar puntos (pointsData con capitalCoords) como objetivos pulsables o excluirlos de 'locate' y de la meta 'The 195' para locationConf.

### BUG-13 · SpeedRound nunca muestra 'New Record!' y en su lugar enseña '+score from your previous attempts'

- **Severidad:** alta
- **Ubicación:** `src/pages/SpeedRound.jsx:236`
- **Evidencia:** l.35: bestScore = speedRoundBests[0]?.score, leído del store en cada render. handleTimeUp (l.126) llama a addSpeedScore antes de que se pinte la pantalla final, así que en ese render bestScore ya incluye la puntuación actual y `score > bestScore` (l.236) siempre es falso.
- **Reproducción:** Primera Speed Round con 50 pts: aparece '+50 from your previous attempts' en lugar de 'New Record!'. En Vitest: fake timers, START, un acierto, avanzar 60 s y comprobar que no aparece el texto 'New Record'.
- **Propuesta:** Guardar el récord previo en un ref al llamar a startGame (prevBestRef.current = bestScore) y comparar con él.

### SRS-7 · La calificación es binaria: no se mide el tiempo de respuesta y la pista no reduce la nota

- **Severidad:** media
- **Ubicación:** `src/hooks/useCountryGame.js:72`
- **Evidencia:** handleAnswer(isCorrect, answerId) (líneas 72-95) solo recibe un booleano y aplica +15 o -10 fijos (líneas 84 y 89). No existe ningún timestamp de presentación de la pregunta. FindCountry.jsx:72-77 muestra el continente como pista con el comentario "Deduct simple hint penalty if wanted", pero no se informa al hook y el acierto con pista vale lo mismo.
- **Reproducción:** 1) /find, pulsar H (pista del continente) y acertar tras 25 s. 2) locationConf sube +15, igual que un acierto instantáneo sin pista.
- **Propuesta:** Medir la latencia desde que la pregunta es visible (en banderas, desde el onLoad de la imagen) hasta la respuesta, y pasar {correct, latencyMs, hintUsed, mode} a un mapeo puro `toRating()` (Again/Hard/Good/Easy, ver diseño).

### SRS-9 · Los puntos débiles solo se muestran: no se priorizan, se mezclan las categorías y el botón 'Drill' no practica ese país

- **Severidad:** media
- **Ubicación:** `src/pages/Progress.jsx:80`
- **Evidencia:** Progress.jsx:80-86 ordena por timesWrong, pero ningún selector lee timesWrong (useCountryGame.js:39-44 no lo usa). timesWrong es un único contador para location, capital y flag (useGameStore.js:32). El enlace Drill (Progress.jsx:218) va a '/find' sin parámetros. No existe el registro de confusiones que pide SKILLD.md:214 ("You confuse Chad and Romania flags often"), aunque answerId está disponible en handleAnswer.
- **Reproducción:** 1) Fallar la bandera de Chad 5 veces. 2) En Progress aparece 'Chad, Wrong 5 times'; al pulsar Drill se abre Find Country (ubicación, no bandera) y Chad sale con la misma probabilidad que cualquier otro país.
- **Propuesta:** Weak spot = tarjeta con lapses >= 2 o difficulty FSRS >= 7, o par de confusión con contador >= 2. El selector las ordena por menor R, así que salen antes de forma natural. Usar los pares de confusión como distractores preferentes. Drill debe enlazar a /flag?focus=TCD o a una sesión filtrada por cardIds.

### SRS-11 · No hay dificultad adaptativa: el campo 'difficulty' del dataset no se usa y los 195 países se mezclan desde el día 1

- **Severidad:** media
- **Ubicación:** `src/hooks/useCountryGame.js:39`
- **Evidencia:** countries.json tiene 'difficulty' en los 195 países (por ejemplo, línea 22: "difficulty": "easy"; reparto easy 50 / medium 73 / hard 72, verificado con node) y 'population'. useCountryGame.js:39 usa todo `countries` sin filtrar ni ordenar. SKILLD.md:219-221 exige empezar por los países conocidos y desbloquear los más oscuros según crece la confianza.
- **Reproducción:** Usuaria nueva: la primera sesión de /find puede preguntar Tuvalu, Nauru o Comoras con la misma probabilidad que Francia o Brasil.
- **Propuesta:** Ordenar las tarjetas nuevas por rango de popularidad (difficulty easy < medium < hard y, dentro de cada grupo, población descendente, o un rank explícito en el dataset). Introducirlas con un cupo diario y desbloquear el siguiente tier cuando, por ejemplo, el 80 % de las tarjetas del tier actual estén en estado Review. Permitir desbloquear una región manualmente.

### DB-6 · QuotaExceededError al guardar se propaga desde la acción y deja la memoria distinta del disco

- **Severidad:** media
- **Ubicación:** `src/store/useGameStore.js:22`
- **Evidencia:** El set envuelto hace set(...args) y luego return setItem() (middleware.mjs:366-371). setItem llama a storage.setItem (middleware.mjs:298), que lanza QuotaExceededError sin capturar. updateProgress (useGameStore.js:22) se llama desde handleAnswer (useCountryGame.js:84 y :89), así que el error sale por el handler de click. El estado en memoria ya ha cambiado y el del disco no.
- **Reproducción:** 1) En DevTools, llena la cuota del origen: for(let i=0;;i++) localStorage.setItem('fill'+i,'x'.repeat(1e6)) hasta que falle. 2) Responde una pregunta: aparece Uncaught QuotaExceededError, la UI muestra el progreso subido y al recargar no está.
- **Propuesta:** Usar un storage propio cuyo setItem capture el error, avise a la UI una sola vez y aplique una purga controlada (recortar reviewLog o activityLog) antes de reintentar. Pedir navigator.storage.persist().

### DB-8 · El esquema declarado challenges.perfectContinents no coincide con lo que se escribe (claves perfect_X)

- **Severidad:** media
- **Ubicación:** `src/store/useGameStore.js:17`
- **Evidencia:** El estado inicial y el partialize declaran challenges: { perfectContinents: {} } (useGameStore.js:16-18 y :100). SpeedRound.jsx:130 escribe unlockChallenge(`perfect_${activeContinent}`), que crea challenges.perfect_Europe al mismo nivel (useGameStore.js:76-77). Challenges.jsx:135 lee claves que empiezan por 'perfect_'. perfectContinents no se escribe nunca. Además, activeContinent sale del query param sin validar (SpeedRound.jsx:12).
- **Reproducción:** 1) Juega /speed-round?continent=Europe sin fallos. 2) useGameStore.getState().challenges da {perfectContinents:{}, perfect_Europe:true}. 3) Con ?continent=xyz y un pool distinto de vacío, cualquier valor arbitrario acaba como clave persistida.
- **Propuesta:** En la migración v2, mover las claves perfect_X a challenges.perfectContinents[X] y validar X contra la lista de continentes. unlockChallenge debe escribir en el subobjeto.

### BUG-08 · La racha mostrada no caduca: Progress enseña una racha antigua aunque haga días que no se juega

- **Severidad:** media
- **Ubicación:** `src/pages/Progress.jsx:111`
- **Evidencia:** Progress.jsx:12 lee `streak` y en la l.111 la pinta tal cual. El store solo recalcula la racha dentro de incrementStreak (useGameStore.js:38-56), al terminar una sesión. No hay ningún selector que compare lastSession con la fecha de hoy.
- **Reproducción:** Con racha 7 y lastSession='2026-10-20', abrir /progress el 2026-11-05: muestra '7'. En Vitest: poner ese estado en el store, renderizar Progress y buscar el texto '7'.
- **Propuesta:** Añadir un selector derivado selectCurrentStreak(state, today) que devuelva 0 si today - lastSession > 1, sin escribir en el storage.

### BUG-12 · El umbral de 'dominado' cambia según la pantalla

- **Severidad:** media
- **Ubicación:** `src/components/WorldHeatmap.jsx:35`
- **Evidencia:** Progress.jsx:29 y Challenges.jsx:44 exigen las tres categorías >= 60. Globe3D.jsx:166-167 usa la media >= 60. WorldHeatmap.jsx:35/40/48 usa confScale = media/20 >= 5, es decir, media = 100 (las tres a 100).
- **Reproducción:** Poner countryProgress.FRA = {locationConf:100, capitalConf:100, flagConf:0}: Globe3D lo pinta como dominado (media 66,7) y Progress/Challenges no. Con {80,80,80}, Progress cuenta Mastered=1 pero WorldHeatmap dice 'Known'. En Vitest: renderizar los dos componentes con ese estado.
- **Propuesta:** Crear src/lib/mastery.js con isMastered(prog) y masteryLevel(prog) únicos e importarlos en los cuatro sitios.

### BUG-14 · speedRoundBests guarda solo un top 10 global: las marcas por continente desaparecen. Además unlockChallenge ignora el esquema perfectContinents

- **Severidad:** media
- **Ubicación:** `src/store/useGameStore.js:84`
- **Evidencia:** l.80-85: se ordena todo por score y `.slice(0, 10)` sin separar por continente. Challenges.jsx:113 busca la marca de cada continente con speedRoundBests.find(s => s.continent === cont), y l.133 bloquea 'Perfect Continent' si no queda ninguna entrada de continente. SpeedRound.jsx:130 escribe challenges['perfect_Europe'] como clave plana (useGameStore.js:76-78), mientras el esquema declara challenges.perfectContinents (l.17, l.100), que nunca se escribe. Hoy funciona porque Challenges.jsx:135 lee la clave plana, pero el esquema y los datos no cuadran.
- **Reproducción:** Hacer una Oceania Run de 40 pts y después 10 rondas 'all' de más de 40. La tarjeta 'Oceania Run' vuelve a 'PB: --' y 'Perfect Continent' se bloquea de nuevo. En Vitest: llamar 11 veces a addSpeedScore y comprobar que no queda ninguna entrada con continent 'Oceania'.
- **Propuesta:** Separar en speedBestsByContinent[cont] = top-N, y escribir challenges.perfectContinents[cont] = true. Migrar las claves perfect_* existentes en migrate (version 1) sin perderlas.

### BUG-16 · SpeedRound con un ?continent= inválido (o con menos de 4 países) rompe el render

- **Severidad:** media
- **Ubicación:** `src/pages/SpeedRound.jsx:49`
- **Evidencia:** l.42-49: si el filtro deja activePool vacío, pool[0] es undefined y target también. En el render (l.176-199) se accede a currentQ.target.name / flagCode / capital, lo que da un TypeError. Las teclas '1'-'4' (l.90-93) acceden a options[n].id sin comprobar la longitud. No hay ErrorBoundary.
- **Reproducción:** Abrir /speed?continent=Antarctica y pulsar START: 'Cannot read properties of undefined (reading ...)' y pantalla en blanco. En Vitest: MemoryRouter con initialEntries ['/speed?continent=Foo'], clic en START, y se espera que lance.
- **Propuesta:** Validar continent contra la lista conocida (si no, usar 'all') y exigir pool.length >= 4. Envolver las rutas en un ErrorBoundary.

### SRS-16 · 'Avg Accuracy' muestra la confianza media de los países tocados, no la tasa de aciertos

- **Severidad:** baja
- **Ubicación:** `src/pages/Progress.jsx:67`
- **Evidencia:** Progress.jsx:67 calcula accuracy como la media de las tres *Conf sobre las entradas de countryProgress. La línea 121 lo etiqueta 'Avg Accuracy'. Los distractores penalizados (SRS-4) crean entradas con 0 que bajan la media sin que se haya respondido sobre ellos.
- **Reproducción:** Acertar 10 de 10 preguntas de /find: accuracy = 15/3 = 5,0 %, porque solo sube locationConf (15) y capital y flag siguen en 0.
- **Propuesta:** Con FSRS, calcular la retención real = aciertos/revisiones del revlog en los últimos 30 días, y aparte la retrievability media prevista. Etiquetarlas así.

### DB-12 · Código muerto con otro esquema: progressStore.js (escala 0-5, claves orbita_*) y useLocalStorage sin uso

- **Severidad:** baja
- **Ubicación:** `src/store/progressStore.js:8`
- **Evidencia:** progressStore.js:8-23 define las claves orbita_confidence, orbita_sessions, etc. con escala 0-5 y campos {location, capital, flag}. useLocalStorage.js:7 exporta un hook. Un grep en src muestra que ninguno de los dos se importa en ningún sitio. El modelo real es useGameStore, con escala 0-100 y campos *Conf.
- **Reproducción:** grep -rn "progressStore\|useLocalStorage" src solo devuelve las propias definiciones. Quien lea progressStore.js verá un esquema distinto del real.
- **Propuesta:** Eliminarlos en la PR de v2. Antes, comprobar que ningún navegador tenga las claves orbita_* (nunca se escribieron porque nada las importa). Si se quiere ser prudente, la migración puede ignorarlas.

### DB-13 · Cada set serializa el estado entero; dailyActivity crece sin límite

- **Severidad:** baja
- **Ubicación:** `src/store/useGameStore.js:65`
- **Evidencia:** dailyActivity añade una clave por día sin recorte (useGameStore.js:65-68). activityLog se limita a 100 (línea 64) y speedRoundBests a 10 (línea 84). persist hace JSON.stringify de todo el partialize en cada set (middleware.mjs:356-361), y updateProgress se llama una o dos veces por respuesta. Hoy pesa poco (unos 20 bytes al día), pero con un reviewLog v2 dentro del mismo blob el coste por respuesta crece de forma lineal.
- **Reproducción:** Simula 365 días en dailyActivity y mide JSON.stringify(useGameStore.getState()).length antes y después de varias respuestas: el blob entero se reescribe en cada una.
- **Propuesta:** Recortar dailyActivity a 400 días en la migración y en logSession. En v2, acotar el reviewLog o sacarlo a IndexedDB, y agrupar las escrituras con un debounce de unos 300 ms más flush en pagehide/visibilitychange.

### BUG-19 · En StrictMode (dev) el efecto de inicio llama dos veces a nextQuestion: la partida empieza en 2/20 y se salta una pregunta

- **Severidad:** baja
- **Ubicación:** `src/hooks/useCountryGame.js:67`
- **Evidencia:** main.jsx:7 usa <React.StrictMode>. El efecto de las l.65-69 llama a nextQuestion() cuando questionCount === 0. StrictMode monta, desmonta y vuelve a montar con el mismo closure (questionCount 0), así que setQuestionCount(c => c + 1) se aplica dos veces. ESLint lo marca como react-hooks/set-state-in-effect (useCountryGame.js:67:7). Solo pasa en desarrollo, pero falsea las pruebas manuales.
- **Reproducción:** npm run dev, abrir /find: el contador muestra '2 / 20' en la primera pregunta. En Vitest: renderHook(useCountryGame, {wrapper: StrictMode + provider}) y se espera questionCount === 2.
- **Propuesta:** Inicializar la cola de sesión en un useState lazy o en un useRef con guarda (startedRef) en vez de en un efecto que muta el contador.

### BUG-20 · useKeyboard escribe en localStorage sin try/catch antes de ejecutar el handler

- **Severidad:** baja
- **Ubicación:** `src/hooks/useKeyboard.js:26`
- **Evidencia:** l.26: localStorage.setItem('orbita-has-used-keyboard','true') se ejecuta antes de handler() (l.29) sin protección. Si lanza (cuota llena, storage bloqueado), la tecla no responde. SpeedRound.jsx:19-21 y FlagQuiz.jsx:29-31 leen localStorage en inicializadores de useState sin try/catch, lo que puede romper el render si el acceso al storage lanza SecurityError.
- **Reproducción:** En Vitest: vi.spyOn(Storage.prototype,'setItem').mockImplementation(() => { throw new DOMException('QuotaExceededError') }), montar un componente con useKeyboard({'1': fn}), disparar keydown '1' y comprobar que fn no se ha llamado.
- **Propuesta:** Ejecutar handler() primero y envolver los accesos a localStorage en un helper safeStorage con try/catch.

### BUG-21 · Código muerto que contradice el modelo real: progressStore.js (escala 0-5 y otras claves), useLocalStorage.js y data/countries.js vacío

- **Severidad:** baja
- **Ubicación:** `src/store/progressStore.js:14`
- **Evidencia:** progressStore.js:14-19 define las claves 'orbita_confidence'/'orbita_streak' y una escala 0-5 que nadie usa. useLocalStorage.js (l.7-27) tampoco se importa en ningún sitio, igual que src/data/countries.js:20 `export const countries = []` y hooks/useScrolled.js. Lo he comprobado con grep -rn de progressStore, useLocalStorage y 'data/countries'': solo aparecen sus propias definiciones. WorldHeatmap.jsx:31-34 conserva comentarios que mezclan la escala 0-5 con la de 0-100.
- **Reproducción:** grep -rn "progressStore\|useLocalStorage\|data/countries'" src: no hay ningún import.
- **Propuesta:** Borrar esos archivos en un commit aparte, después de crear el nuevo módulo de persistencia, y documentar la única fuente de verdad (useGameStore).

## Diseños propuestos por los auditores

---

## Auditor: srs

## Diseño SRS para Orbita (585 tarjetas = 195 países x {location, capital, flag})

### 1. Comparativa de algoritmos

| | SM-2 (Anki clásico) | Leitner (5-7 cajas) | **FSRS-6** |
|---|---|---|---|
| Modelo | Ease factor e intervalo multiplicativo | Caja, con intervalo fijo por caja | Difficulty, Stability, Retrievability con curva de olvido entrenada con millones de revlogs |
| Retención objetivo configurable | No | No | Sí (`request_retention`) |
| Probabilidad de recuerdo en cualquier instante | No | No | Sí, R(t) |
| Repasos adelantados o atrasados | Mal: si el repaso se hace tarde, el intervalo no tiene en cuenta el retraso | Ignorados | Los modela (usa el tiempo real transcurrido) |
| 'Ease hell' tras fallos | Sí | No aplica | No (la difficulty tiende a volver a la media) |
| Carga para igual retención | Base | Peor | Entre un 20 y un 30 % menos de repasos según los benchmarks de open-spaced-repetition |
| Complejidad | Muy baja | Muy baja | Baja usando la librería |

**Recomendación: FSRS-6 con `ts-fsrs@5.4.2` fijado a esa versión exacta.** Comprobado hoy en el registro de npm:
- `ts-fsrs@6.0.0` es `latest`, pero se publicó el 2026-10-28 (hace 8 días). Cambia la API a `await DefaultScheduler()` (asíncrona), usa FSRS-7 por defecto y exige `node >=24`. Es demasiado nueva para un cambio en producción que puede costar progreso irreversible, y su API asíncrona complica la inicialización del store.
- `ts-fsrs@5.4.2` (2026-09-01, `node >=20`) tiene una API síncrona verificada en sus .d.ts: `fsrs(params)`, `generatorParameters({request_retention, maximum_interval, enable_fuzz, enable_short_term, learning_steps, relearning_steps, w})`, `createEmptyCard(now)`, `f.next(card, now, grade)` que devuelve `{card, log}`, `f.repeat(card, now)` (vista previa de las 4 notas), `f.get_retrievability(card, now, false)` que devuelve un número, `forgetting_curve(w, elapsed, S)`, `Rating{Again=1,Hard=2,Good=3,Easy=4}` y `State{New,Learning,Review,Relearning}`. `Card` = {due, stability, difficulty, elapsed_days (deprecated), scheduled_days, learning_steps, reps, lapses, state, last_review}.
- Aislar la librería detrás de `src/srs/scheduler.js` para poder migrar a v6/FSRS-7 más adelante sin tocar la UI.
- Leitner solo merece la pena si se descarta la dependencia. Habría que mapear Conf a la caja, con 6 cajas e intervalos 0/1/3/7/16/35 días. SM-2 no se recomienda.

Parámetros: `request_retention: 0.9`, `maximum_interval: 365` (geografía: conviene que nada pase más de un año sin repaso), `enable_short_term: true`, `learning_steps: ['1m','10m']`, `relearning_steps: ['10m']`, `enable_fuzz: true` en producción y `false` en los tests. Con 585 tarjetas no hace falta optimizar los pesos (los `default_w` sirven). Se guarda un revlog compacto para poder entrenar parámetros a partir de unas 1000 revisiones.

### 2. Modelo de datos (persist `version: 1` con `migrate`)

```js
srs: {
  cards: { 'TCD:flag': { due, stability, difficulty, scheduled_days, learning_steps, reps, lapses, state, last_review } }, // fechas en epoch ms
  revlog: [ { c:'TCD:flag', r:3, t:1762300000000, ms:2400, m:'flag' } ],   // con tope, p. ej. las 5000 últimas
  confusions: { 'flag:TCD|ROU': 3 },
  newIntroduced: { '2026-11-05': 8 },  // clave localDayKey
}
```
- Id de tarjeta: `${iso3}:${category}`. Las variantes de dirección (bandera a país y país a bandera) comparten tarjeta. Si se ve que tienen retenciones distintas, se separan más adelante.
- Serialización: guardar Date como número y rehidratar con `new Date(x)` (CardInput acepta DateInput).
- Migración v0 a v1 (nunca destructiva): copiar antes el blob crudo a `orbita-storage.v0.bak`. Para cada `*Conf > 0`, crear una tarjeta `state: Review`, `stability = max(0.5, conf/15)` días (aproximadamente el número de aciertos netos), `difficulty = clamp(5 + timesWrong*0.5, 1, 10)`, `last_review = lastSession || now` y `due = now`, para revalidarla pronto. Conf 0 da New. Conservar `timesWrong` y los campos desconocidos. La migración debe ser idempotente.
- Una única acción atómica `reviewCard(cardId, rating, now, meta)` que haga un solo `set()`.

### 3. Mapeo respuesta a Rating (función pura `toRating`)

Entrada: `{correct, latencyMs, hintUsed, mode, inputKind, timed}`. La latencia va desde que la pregunta es visible (en banderas, desde `img.onLoad`) hasta la respuesta. Si la pestaña se oculta (`visibilitychange`), la latencia se trata como `null`.

| Caso | Rating |
|---|---|
| Incorrecto (cualquier latencia) | Again |
| Correcto con pista | Hard |
| Correcto y `latency > slow` | Hard |
| Correcto y `fast < latency <= slow`, o latencia null | Good |
| Correcto, `latency <= fast` y la tarjeta ya está en `Review` | Easy |
| Speed Round (`timed`) | Solo Again o Good |

Umbrales por tipo de entrada: opción múltiple (bandera, nombre fácil) fast 2,5 s / slow 8 s; escrita o desplegable (capital, nombre difícil) 5 s / 15 s; clic en globo 4 s / 12 s (incluye rotar el globo). Easy no se da en tarjetas New o Learning, para no inflar la stability inicial. El distractor elegido **no se califica**: solo incrementa `confusions[cat:target|chosen]`.

### 4. Selector de sesión `buildSession(state, { now, category, pool, size=20, dailyNewLimit=10, rng })`, función pura

1. **Aprendizaje y reaprendizaje**: tarjetas `state ∈ {Learning, Relearning}` con `due <= now + 20 min` (horizonte de la sesión), ordenadas por `due`.
2. **Repasos vencidos**: `state = Review` y `due <= now`, ordenadas por **menor R(now)**. Desempate: `lapses` descendente, luego `confusions` descendente, luego id (para que sea determinista). Los puntos débiles salen antes de forma natural.
3. **Nuevas**: hasta `dailyNewLimit - newIntroduced[localDayKey(now)]`, filtradas por tiers desbloqueados y `pool` (continente, similares), en orden de popularidad: `difficulty` easy < medium < hard y, dentro de cada uno, `population` descendente. El siguiente tier se desbloquea cuando al menos el 80 % del tier actual está en Review. Se puede desbloquear una región manualmente.
4. **Relleno**: si no hay suficientes, práctica adelantada con las tarjetas Review de menor R aún no vencidas. Se marcan `practice: true` y Easy queda bloqueado.
5. **Intercalado y restricciones**: como máximo 1 nueva de cada 3 posiciones; nunca el mismo país en posiciones consecutivas; distractores sacados de `confusions` y `similarTo`. Si se responde Again, la tarjeta se reinserta como mínimo 4 posiciones después (paso de aprendizaje de 1 m).
6. Si no hay nada vencido ni nuevo, se muestra 'Día completado' con la opción de práctica libre.

`localDayKey(now, 'Europe/Madrid', rollover=4)` con `Intl.DateTimeFormat('en-CA', {timeZone})`. Se usa también para la racha y dailyActivity.

### 5. Derivar los *Conf 0-100 actuales (compatibilidad con Globe3D, WorldHeatmap, CountryPanel, Progress y Challenges)

```
conf(card, now) = card == null || state == New ? 0
                : round(100 * R(now) * min(1, ln(1+S) / ln(1+21)))
```
- R = `f.get_retrievability(card, now, false)`; S = stability en días; 21 días = 'madura' al estilo de Anki.
- Propiedades: entero en [0,100]; no crece con el tiempo si no hay repasos (decae con el olvido); una tarjeta recién aprendida (S aproximadamente 1 d) da unos 22, no 100. **El umbral actual >= 60 ('Mastered') equivale a S >= 7 d con R >= 0,9**, así que Progress.jsx:29 y Challenges.jsx:44 conservan su significado sin cambiar código.
- Implementación: `countryProgress` deja de ser la fuente de verdad y pasa a ser una **caché materializada** con la misma forma `{locationConf, capitalConf, flagConf, timesWrong}`, donde `timesWrong = Σ lapses + errores en Learning`. Se recalcula después de cada `reviewCard`, en `onRehydrateStorage` y cada pocos minutos en primer plano. Así los 5 consumidores siguen leyendo `countryProgress[iso].xConf` sin cambios.

### 6. Arquitectura y tiempo inyectable

`src/srs/{scheduler.js, rating.js, selector.js, conf.js, dayKey.js, migrate.js}`, todos puros y con `now` como parámetro. El hook `useCountryGame(mode, {pool, now = () => Date.now(), rng})` y el store reciben `now` en cada acción, sin `new Date()` interno.

### 7. Propiedades testeables (Vitest, `now` inyectado o `vi.setSystemTime`)

1. `buildSession` nunca devuelve el mismo iso3 en posiciones consecutivas (property-based con un rng sembrado y estados aleatorios).
2. Los repasos vencidos aparecen ordenados por R ascendente; ninguna tarjeta New precede a una Review vencida.
3. Nuevas en la sesión <= `dailyNewLimit - introducidasHoy`. El cupo se reinicia en `2026-11-06T03:00:00Z` (04:00 en Madrid) y no en `2026-11-05T23:30:00Z`.
4. `localDayKey` es correcto en el cambio de hora (2026-10-25 y 2026-03-29, Europe/Madrid).
5. `toRating`: incorrecto da siempre Again; `hintUsed` da como máximo Hard; latencia null da Good; New/Learning nunca dan Easy; `timed` da solo Again o Good.
6. Responder Good a una tarjeta en Review deja `due > now` y `stability` mayor; Again da `lapses+1` y `state = Relearning`.
7. Una respuesta incorrecta con distractor deja la tarjeta del distractor igual (deep equal) e incrementa solo `confusions`.
8. `conf` ∈ [0,100] y es entera; New da 0; es no creciente en `now` sin repasos; S >= 7 y R >= 0,9 dan >= 60.
9. La migración v0 a v1 es idempotente, conserva `timesWrong`, streak, activityLog y claves desconocidas, y crea la copia `.v0.bak`.
10. Determinismo: mismo `(state, now, seed)` da la misma sesión.
11. El filtro `pool` (similares, continente) restringe la selección y un pool vacío cae al pool por defecto.
12. Ronda de ida y vuelta: serializar y rehidratar una tarjeta (fechas en ms) da el mismo `get_retrievability` en el mismo `now`.

---

## Auditor: db

## Contexto verificado
- zustand 5.0.12 persist: `version` por defecto 0; `migrate(state, version)` solo se llama si `stored.version` es un número distinto del actual. El merge por defecto es superficial. Con localStorage (síncrono), la hidratación termina dentro de `create()`, así que **hoy no hay lecturas antes de hidratar**. Eso cambia si el storage pasa a ser asíncrono (IndexedDB): entonces un `set()` antes de hidratar escribe el estado inicial encima de los datos.
- Blob actual: `{"state":{streak,lastSession,totalSessions,countryProgress,activityLog,dailyActivity,speedRoundBests,flagSessionsCompleted,challenges},"version":0}` en 'orbita-storage'.

## Esquema v2 (clave NUEVA `orbita-v2`, version: 2)
Uso una clave nueva para que el bundle viejo, que puede seguir vivo en pestañas abiertas tras el autoUpdate, no pueda pisar los datos v2 (DB-4).
```js
{
  schema: 2,
  meta: { createdAt, migratedFrom: 0|1|null, migratedAt, rev, deviceId },
  cards: {               // 195 países x 3 = 585 cards; clave `${ISO3}:${cat}`, cat ∈ loc|cap|flag
    'ESP:loc': { st: 0|1|2|3,       // FSRS State: New, Learning, Review, Relearning
                 due: 20398,        // dayIndex local (días desde epoch en la TZ del dispositivo)
                 dueMs: 1762300000000, // solo en learning/relearning (pasos intradía)
                 s: 12.41, d: 5.32, // stability, difficulty
                 reps: 7, lapses: 1, last: 20391 }
  },
  reviewLog: [ [cardIdx, rating(1-4), tsSec, sBefore, dBefore, elapsedDays] ], // array compacto, FIFO acotado a 5000
  confusions: { 'ESP:loc': { PRT: 3, AND: 1 } }, // como mucho 5 por card, se descarta el menor
  daily: { '2026-11-05': { reviews: 20, new: 5 } }, // fecha local, recortado a 400 días
  stats: { streak, lastSessionDay, totalSessions, flagSessionsCompleted },
  speedRoundBests: [...10],
  challenges: { perfectContinents: { Europe: true } },
  settings: { dailyNew: 10, desiredRetention: 0.9 }
}
```
- Cola diaria: due ≤ hoy, ordenada por recuperabilidad ascendente, más N cards nuevas (prioridad por `difficulty` de countries.json).
- Puntos débiles: lapses alto, D alta o confusions frecuentes.
- Dificultad adaptativa: distractores tomados de `confusions` y de `borders`.

## Migración v0/v1 → v2 (idempotente)
```js
function migrateToV2(raw /* objeto parseado o null */, now, tz) {
  if (!raw) return freshV2()
  if (raw.version === 2 || raw.schema === 2) return raw  // idempotente
  const s = raw.state ?? {}
  // backup solo si no existe (no se pisa con una segunda ejecución)
  if (localStorage.getItem('orbita-storage-backup-v1') == null)
    safeSet('orbita-storage-backup-v1', JSON.stringify(raw))  // si falla por cuota, abortar la migración y seguir en modo legacy
  const ids = new Set(countries.map(c => c.id))
  const cards = {}
  for (const [iso, p] of Object.entries(s.countryProgress ?? {})) {
    if (!ids.has(iso)) continue                              // DB-11
    for (const [cat, f] of [['loc','locationConf'],['cap','capitalConf'],['flag','flagConf']]) {
      const conf = Number.isFinite(p?.[f]) ? p[f] : 0        // DB-7
      if (conf <= 0) continue                                // sigue New
      // seed: conf 0-100 a stability inicial (días); review pendiente hoy para recalibrar
      cards[`${iso}:${cat}`] = { st: 2, s: Math.max(0.5, conf / 100 * 10), d: 5 + Math.min(3, (p.timesWrong|0) / 2),
                                  reps: Math.round(conf / 15), lapses: p.timesWrong|0, due: today, last: today }
    }
  }
  const challenges = { perfectContinents: { ...(s.challenges?.perfectContinents ?? {}) } }
  for (const k of Object.keys(s.challenges ?? {})) if (k.startsWith('perfect_')) {
    const c = k.slice(8); if (CONTINENTS.includes(c)) challenges.perfectContinents[c] = true }   // DB-8
  return { schema: 2, meta: { migratedFrom: raw.version ?? 0, migratedAt: now }, cards, reviewLog: [], confusions: {},
           daily: pickLast(s.dailyActivity, 400), stats: {...}, speedRoundBests: (s.speedRoundBests ?? []).slice(0,10), challenges }
}
```
- Se ejecuta en un `storage` propio de `orbita-v2`: si `orbita-v2` no existe, se lee 'orbita-storage', se migra y se escribe en `orbita-v2`. **No se borra la clave legacy** en esta versión.
- Si una pestaña vieja escribe en 'orbita-storage' después de migrar (evento `storage`), se reaplica con max-merge (max de conf convertido a stability) y no se reemplaza nada.
- Si el JSON está corrupto: se copia a `orbita-storage-corrupt-<ts>` y no se escribe nada hasta resolverlo (DB-2).
- Si `stored.version > CODE_VERSION`: no se escribe y se muestra el aviso 'Recarga para actualizar'.
- Las escrituras van con debounce (~300 ms) y flush en `pagehide`. setItem va en try/catch: si hay QuotaExceeded, se recorta el reviewLog a la mitad y se reintenta una vez.

## Bytes estimados (JSON, ASCII)
| Parte | Cálculo | Tamaño |
|---|---|---|
| cards (dayIndex enteros) | 585 x ~95 B | ~55 KB |
| cards (si se usaran fechas ISO) | 585 x ~140 B | ~82 KB |
| reviewLog 1 año, 20 reviews/día, compacto (~33 B) | 7.300 x 33 | ~240 KB |
| reviewLog 1 año, 60 reviews/día, compacto | 21.900 x 33 | ~720 KB |
| reviewLog 1 año, 60/día, objetos con ISO (~85 B) | 21.900 x 85 | ~1,9 MB |
| reviewLog acotado a 5.000 compacto | | ~165 KB |
| confusions (peor caso, 5 por card) | 585 x ~40 | ~23 KB |
| daily 400 días + stats + bests | | ~15 KB |
| **Total v2 con log acotado** | | **~260 KB** |
La cuota de localStorage ronda 5 MB por origen (en Chrome se cuentan unidades UTF-16). Con el log acotado sobra margen. El problema real es el coste de `JSON.stringify` síncrono de todo el blob en cada respuesta: con log completo (más de 1 MB) son varios ms por respuesta en móvil.

## ¿IndexedDB (idb-keyval)?
- **Fase 1 (recomendada):** localStorage `orbita-v2` con reviewLog acotado a 5.000. Es síncrono, así que no hay carrera de hidratación, y es poco código.
- **Fase 2:** si se quiere optimizar los parámetros FSRS con el historial completo, mover **solo** el reviewLog a IndexedDB (idb-keyval, `set('log-<YYYY-MM>', ...)`, append por mes), fuera de persist. Si se mueve el store entero a IDB con `createJSONStorage(() => ({getItem: get, setItem: set, removeItem: del}))`, la hidratación pasa a ser asíncrona. Entonces hay que poner `skipHydration`, llamar a `await persist.rehydrate()` antes de montar `<App/>` y bloquear las acciones mientras `!hasHydrated()`.
- En ambas fases:
  - Llamar a `navigator.storage.persist()`.
  - Añadir exportar e importar JSON en Progress. Safari, con ITP, borra el storage escrito por scripts tras 7 días sin interacción si la app no está instalada como PWA, y el progreso solo existe en el navegador.

## Cómo testear (vitest + jsdom)
1. Fixtures en `src/store/__fixtures__/`: `v0-empty.json`, `v0-typical.json` (con `perfect_Europe`, GRL huérfano y campos que faltan), `v0-corrupt.txt`, `v2-current.json`.
2. En cada test: `localStorage.clear()`, cargar el fixture, `vi.resetModules()`, `await import('../useGameStore')`, y comprobar:
   - El estado migrado: cards con las claves correctas, `perfectContinents.Europe`, sin GRL, sin NaN.
   - Que `orbita-storage-backup-v1` es idéntico al fixture.
   - Que 'orbita-storage' sigue intacto.
3. Idempotencia: `migrateToV2(migrateToV2(x)) deepEqual migrateToV2(x)`. Además, recargar el módulo dos veces no reescribe el backup (spy en `setItem`).
4. Pestaña vieja: tras migrar, escribir un v0 nuevo en 'orbita-storage' y disparar `window.dispatchEvent(new StorageEvent('storage',{key:'orbita-storage'}))`. Comprobar el max-merge y que `orbita-v2.cards` sigue presente.
5. JSON corrupto: no hay escrituras, existe `orbita-storage-corrupt-*` y se muestra el aviso.
6. Cuota: `vi.spyOn(Storage.prototype,'setItem').mockImplementationOnce(() => { throw new DOMException('','QuotaExceededError') })`. La acción no lanza y el log se recorta.
7. Storage bloqueado: `Object.defineProperty(window,'localStorage',{get(){throw new DOMException('','SecurityError')}})`. Los hooks renderizan sin lanzar.
8. Fechas: `process.env.TZ='Europe/Madrid'` en el setup de vitest y `vi.setSystemTime('2026-11-06T00:30:00+01:00')`. La clave de día debe ser '2026-11-06'.
9. Tamaño: un test genera 585 cards y 5.000 logs y comprueba que `JSON.stringify(state).length < 350_000`.

---

## Auditor: bugs

## Hipótesis refutadas o matizadas (no incluidas en findings)

- **Fuga de memoria en Globe3D (refutada como fuga).** El cleanup manual de Globe3D.jsx:75-83 no llega a ejecutarse con efecto, porque React pone ref.current a null (cleanup de useImperativeHandle en la fase de mutación) antes de los cleanups pasivos; ESLint lo avisa en 80:18. Aun así no hay fuga: react-kapsule ejecuta `comp._destructor` al desmontar (node_modules/react-kapsule/dist/react-kapsule.mjs:89-92), globe.gl lo propaga (globe.gl.mjs:479-488) y three-render-objects llama a renderer/controls.dispose() (three-render-objects.mjs:459-465). Ese cleanup es simplemente código muerto. Hay un setTimeout sin limpiar en Globe3D.jsx:113, pero es inocuo gracias al `?.`.
- **Listeners de teclado.** useKeyboard (l.33-34) y los checkKbd de FlagQuiz y SpeedRound eliminan sus listeners: no hay fuga. El problema real es que no se filtra `e.repeat` (ver BUG-04).
- **Carreras de doble clic o tecla repetida en Find/Flag/Capital/Name.** Están cubiertas por `processing`: React vacía las actualizaciones de eventos discretos (click/keydown) entre un evento y el siguiente, y FlagQuiz devuelve handlers vacíos mientras processing está activo. Tampoco se puede responder después del temporizador en SpeedRound: la pantalla de juego se desmonta cuando isRunning=false.
- **Hipótesis 4 (unlockChallenge).** Funcionalmente no falla, porque Challenges.jsx:135 lee la misma clave plana. Lo que queda es la incoherencia con el esquema, que he incluido en BUG-14 con severidad media.
- **Hipótesis 6, parte de rendimiento.** `geoData.features.some` cuesta unos 1,2 intentos x 177 comparaciones por pregunta, que es despreciable. Lo que sí se confirma es la repetición (BUG-17).
- **useLocalStorage y su catch silencioso.** El catch existe, pero el hook está muerto (BUG-21), así que no afecta a nada.

## Clasificación de `npx eslint .` (74 problemas: 69 errores, 5 avisos)

**Bugs reales:**
- FlagQuiz no-undef useState/useMemo/useEffect: 9 errores → BUG-01 (crítico).
- FlagQuiz setSimilarMode sin usar → BUG-18.
- SpeedRound:96 exhaustive-deps: el handler 'Enter' es inalcanzable, porque solo existe con isRunning y además exige !isRunning. Es código muerto, no un closure obsoleto dañino; currentQ sí está en deps.
- SpeedRound:135 triggerFeedback sin usar (código muerto).
- useCountryGame:67 set-state-in-effect → BUG-19.
- Globe3D:80 ref en cleanup: cleanup que no hace nada (ver arriba).
- ActivityGrid:5: `|| {}` crea un objeto nuevo en cada render e invalida el useMemo. Deuda menor.

**Ruido / falsos positivos:**
- 14 'motion is defined but never used': `<motion.div>` sí se usa. Falta eslint-plugin-react con la regla `react/jsx-uses-vars`; conviene añadirla para que el ruido no tape errores como el de FlagQuiz.
- 16 react-hooks/purity por Math.random dentro de useMemo/useState (Home, Confetti, NameCountry, FlagQuiz, SpeedRound): es intencional y estable gracias a la memoización. Solo importa con React Compiler.
- preserve-manual-memoization (Globe3D, useCountryGame): avisos del compilador.
- Imports y variables sin usar (useRef, useEffect, useMemo, countries, geoData, totalScore, continents, combo, get, `_`, flag): limpieza.
- react-refresh/only-export-components (WorldDataContext): solo afecta al HMR.
- useCountryGame:62, falta playComplete en deps: inocuo, viene de un hook estable.

## Diseño recomendado

1. **Fechas.** Crear `src/lib/dates.js` con `localDateKey(d = new Date())` basado en getFullYear/getMonth/getDate y `daysBetween(keyA, keyB)` vía Date.UTC(y,m,d). Usarlo en incrementStreak, logSession y ActivityGrid. Exponer el selector `selectCurrentStreak(state, todayKey)`. Probar en Vitest con `process.env.TZ='Europe/Madrid'` y `vi.setSystemTime` en las franjas 23:30Z y 00:30 local, y en los cambios de hora de marzo y octubre.
2. **Persistencia segura (antes de tocar el modelo).** `persist({ name:'orbita-storage', version:1, migrate, onRehydrateStorage, storage: safeJSONStorage })`:
   - safeJSONStorage.getItem: si JSON.parse falla, copia el valor bruto a `orbita-storage-backup-<ISO>` y lanza.
   - onRehydrateStorage: ante un error, pone `hydrationError` y bloquea setItem (sin sobrescribir) hasta que la usuaria elija entre restaurar el backup o empezar de cero.
   - migrate(v0→v1): conserva todo; convierte `challenges.perfect_X` a `challenges.perfectContinents[X]`; añade `srs:{}` y `confusions:{}`; elimina ids que no estén en countries.json pero los guarda en `orphanProgress` (nunca se borran datos).
   - Exportar e importar el progreso a JSON desde Progress (el progreso solo vive en el navegador).
3. **Modelo SRS** (por país y categoría): `srs[ISO3][cat] = { box|ease, intervalDays, dueKey, reps, lapses, lastKey }`. Se puede usar un SM-2 simplificado o un Leitner de 5 cajas (1, 2, 4, 8 y 16 días). Al acertar: interval *= ease (mínimo 1) y confianza +15. Al fallar: interval = 0 (vuelve en la misma sesión), lapses++ y confianza −10. Mantener locationConf, capitalConf y flagConf como vista derivada para la UI.
4. **Planificador de sesión** (`buildSessionQueue(state, mode, todayKey, pool)`): (a) vencidos (dueKey <= hoy) ordenados por retraso; (b) puntos débiles (lapses/timesWrong y confusions altos); (c) nuevos según `difficulty` de countries.json (easy→medium→hard), que se van desbloqueando al dominar cada nivel (dificultad adaptativa). Sin reemplazo, con una ventana anti-repetición de 5 y filtrado por `askableIds[mode]` (formas, alias SSD↔SDS y microestados como puntos). La cola diaria es la unión de (a) y (b), limitada a N.
5. **Una sola acción de respuesta** `recordAnswer({countryId, category, correct, chosenId})` en el store. La usan todos los modos, SpeedRound incluido. `endSession(mode)` calcula la puntuación desde el store o un ref (sin closures obsoletos) y actualiza totalSessions, dailyActivity y la racha.
6. **Maestría única.** `src/lib/mastery.js` con `isMastered` (las tres categorías >= 60, o box >= 4) y `masteryLevel`, compartidos por Progress, Challenges, Globe3D y WorldHeatmap.
7. **Robustez de la UI.** ErrorBoundary por ruta; WorldDataContext con countries síncrono, comprobación de res.ok y estado de error; CircleTimer basado en una fecha límite con onComplete en un ref; useKeyboard ignorando e.repeat y los campos de texto.
8. **Orden de despliegue** (push a main = producción, autoUpdate): primero la persistencia segura y migrate v1, con tests de migración sobre fixtures v0 reales; después fechas y SRS. No borrar código muerto hasta que la migración esté probada.
