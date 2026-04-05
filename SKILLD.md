# Orbita

You are a senior full-stack developer and UI/UX expert. You are building a complete,
production-ready interactive web application called **Orbita,** a personal geography learning platform with a stunning tech 3D aesthetic.

---

## BRAND IDENTITY

**Name:** Orbita
**Tagline:** "Master the world, one country at a time"
**Personality:** Intelligent, sleek, immersive, ambitious
**Target user:** A single motivated learner who wants to master world geography
**Tone:** Focused, elegant, no gamification fluff — serious but beautiful, catchy. Never use “— “ in all website

**Color Palette:**

- Background: #050508 (near black, deep space)
- Primary glow: #6C63FF (electric violet/purple)
- Secondary glow: #00D4FF (cyan neon)
- Accent: #FF6B6B (coral red — for wrong answers)
- Success: #00FFB2 (neon green — for correct answers)
- Text primary: #FFFFFF
- Text secondary: #8B8FA8
- Card background: rgba(255,255,255,0.04)
- Border: rgba(255,255,255,0.08)

**Typography:**

- Headings: Space Grotesk — geometric, futuristic
- Body: "Inter" — clean and readable
- Numbers/Stats: "JetBrains Mono" — monospaced tech feel

**Visual Language:**

- Dark space aesthetic — like Earth seen from orbit
- Neon glowing outlines on country borders when selected
- Subtle particle effects and ambient light
- Glassmorphism cards (blur + low opacity background)
- Smooth, cinematic animations — nothing abrupt
- No flat design — everything has depth and glow

---

## 🌐 TECH STACK

- **Framework:** React + Vite
- **3D Globe:** Three.js with custom Earth shader OR [react-globe.gl](http://react-globe.gl/)
- **Styling:** Tailwind CSS + custom CSS for glow effects
- **Animations:** Framer Motion
- **Data:** GeoJSON for country borders, custom JSON for capitals/flags/data. Or any suggested relevant free API.
- **Audio:** Howler.js (subtle sounds)
- **Charts/Stats:** Recharts or D3.js
- **Routing:** React Router
- You can suggest other tech stack if you think your option is better

---

## 🗂️ WEBSITE SECTIONS & PAGES

### 1. HERO SECTION (Landing)

- Full-screen dark background
- Animated 3D Earth globe centered or slightly offset
- Globe slowly auto-rotates, glowing city lights visible (night side texture)
- Headline: "Orbita" in large Space Grotesk font with subtle purple glow
- Subheadline: "Master the world, one country at a time"
- Two CTA buttons: [Start Exploring] [View Progress]
- Subtle floating particles in background
- Scroll indicator arrow at bottom
- On scroll: globe scales down and transitions into the modes section

### 2. MODES SECTION

Display 6 interactive mode cards in a grid. Each card:

- Glassmorphism style (backdrop blur, low opacity)
- Icon + title + short description
- Hover: border glows with accent color, slight scale up
- Click: navigates to that game mode

**The 6 modes:**

1. 🌍 Find the Country — given a name, click on the globe
2. 🔤 Name the Country — country highlighted on globe, you type the name
3. 🚩 Flag Quiz — see a flag, identify the country (or vice versa)
4. 🏛️ Capital Quiz — country ↔ capital in both directions
5. ⚡ Speed Round — 60 seconds, as many as possible, mixed questions
6. 📅 Daily Quest — 5 curated mixed questions per day with streak tracking

### 3. EXPLORER (Free Study Mode)

- Full interactive 3D globe, no quiz pressure
- Click any country → side panel slides in from right with:
    - Country name + flag
    - Capital city
    - Population
    - Official language(s)
    - Continent
    - One interesting fact
- Filter bar at top: filter by continent, population size, region
- Search bar: type a country name → globe auto-rotates and zooms to it
- Countries you've already mastered show a subtle green glow

### 4. MY PROGRESS (Personal Dashboard)

- Greeting: "Welcome back, Explorer"
- Top stats row: Countries mastered / Current streak / Total sessions / Accuracy %
- **World Heatmap**: canvas world map showing:
    - Gray: not yet studied
    - Blue gradient: studied, partially known
    - Green glow: mastered (answered correctly 3+ times)
- **Category breakdown** (radial or bar charts):
    - Locations / Capitals / Flags / History — % complete each
- **Regional progress**:
    - Europe ████████░░ 80%
    - Asia ████░░░░░░ 40%
    - Africa ██░░░░░░░░ 20%
    - etc.
- **Weak spots section**: "These countries keep tripping you up" → list with flag + name
- **Spaced repetition queue**: "You have 12 countries to review today"
- **GitHub-style activity heatmap**: yearly grid of daily study activity
- **Personal records**: Best streak / Fastest speed round / Most accurate category

### 5. CHALLENGES

- **The 195 Challenge**: Progress bar toward naming all 195 countries
- **Continent Speedruns**: Time yourself on each continent — personal bests
- **Perfect Continent**: Complete a continent with zero mistakes
- **Blind Mode**: Globe has no labels, borders are subtle — maximum difficulty
- **Flag Master**: Identify all flags without hints
- Each challenge shows: locked/unlocked state, completion %, personal best

---

## 🎮 GAME MODES — DETAILED UX

### Find the Country

1. Screen shows the 3D globe
2. Top center: question card appears → "Find: MONGOLIA"
3. User rotates globe and clicks the correct country
4. On hover: country border glows softly in white/blue
5. On click correct:
    - Country fills with green glow animation
    - Satisfying "ding" sound
    - Score +10 points, combo multiplier if streak
    - Next question after 0.5s
6. On click wrong:
    - Clicked country flashes red
    - Soft error sound
    - Correct country reveals in orange glow
    - 0 points (no punishment, just no gain)
7. Progress bar at top showing session progress (e.g., 7/20)
8. Hint button: reveals the continent (-5 points penalty)

### Name the Country

1. Globe auto-zooms and rotates to a country
2. Selected country outlined in bright neon purple glow
3. Text input appears: "What country is this?"
4. Auto-complete suggestions appear as user types
5. On correct: same success animation
6. On wrong: show correct answer, reveal on globe
7. Difficulty levels: Easy (multiple choice 4 options) / Hard (free type)

### Flag Quiz

1. Large flag displayed center screen (crisp, no pixelation)
2. Four country name buttons below (multiple choice)
3. OR: country name shown → pick from 4 flags in a grid
4. Correct: button turns green, confetti particle burst
5. Wrong: button turns red, correct highlighted green
6. "Similar flags" challenge mode: only shows visually similar flags

### Capital Quiz

- **Mode A** — "What is the capital of Japan?" → free text input
- **Mode B** — "Nairobi is the capital of which country?" → free text or multiple choice
- **Mode C** — "Locate the capital on the globe" → click on map
- Capitals shown as glowing dots on the globe in explorer mode

### Speed Round

- 30-second countdown timer (circular, glowing)
- Mixed question types cycling rapidly
- No animations between questions — instant next
- Final screen: score, correct/total, comparison to personal best
- Questions per minute metric shown

### Daily Quest

- 5 questions curated by weak-spot algorithm
- Streak counter prominently displayed (fire icon 🔥)
- Calendar showing streak history
- Completion triggers a satisfying full-screen celebration animation
- Cannot be replayed — resets at midnight

---

## 🧠 LEARNING INTELLIGENCE

**Spaced Repetition System:**

- Each country has a "confidence score" per category (location/capital/flag)
- Correct answer → confidence +1, next review in longer interval
- Wrong answer → confidence -1, appears again in next session
- Countries below confidence threshold → added to daily review queue
- Search for the best spaced repetition algorithm

**Weak Spot Detection:**

- Track which countries are answered wrong most frequently
- Show in dashboard: "You confuse Chad and Romania flags often"
- Automatically prioritize these in sessions

**Adaptive Difficulty:**

- Starts with most popular/well-known countries
- Unlocks more obscure countries as confidence grows
- Can manually unlock any region to study ahead

---

## 🎨 UI COMPONENTS — DETAILED SPECS

### Globe Component

- Texture: dark Earth with glowing city lights (night texture)
- Atmosphere glow: subtle blue rim light around Earth
- Country borders: very subtle white lines, low opacity by default
- Selected country: bright neon border (purple/cyan), inner glow fill
- Hover state: slight white border brightening
- Rotation: smooth inertia, mouse drag or touch
- Auto-rotate: slow constant rotation when idle
- Camera: smooth lerp to target country on zoom

### Question Card

- Floating card above or beside globe
- Glassmorphism: backdrop-blur-md, bg-white/5, border-white/10
- Smooth slide-in animation from top
- Progress indicator (dots or bar)
- Timer ring (in speed mode)
- Hint button bottom right

### Answer Feedback

- Correct: green particle burst from country location + sound
- Wrong: red pulse on selected country, then orange reveal on correct
- Transition: 1.5s pause then smooth next question

### Navigation

- Top navbar: minimal, transparent/glass, blurs on scroll
- Logo: "Orbita" with small orbit ring icon (SVG)
- Nav links: About / Explorer / Progress / Challenges
- No hamburger on desktop — clean horizontal links

### Sounds (subtle, optional toggle)

- Correct answer: soft crystalline ding
- Wrong answer: low soft thud
- Streak milestone: ascending chime sequence
- Daily quest complete: short triumphant melody
- Globe rotation: very faint whoosh (optional)

---

## ✅ IMPORTANT CONSTRAINTS

- No login, no backend, no community features — fully local/personal app
- All progress stored in localStorage
- Must work offline after first load
- Performance: globe must run at 60fps on mid-range laptops
- Accessibility: keyboard navigation for all game modes
- All 195 UN-recognized countries included
- Country border GeoJSON data must be accurate
- Flags must be SVG format (crisp at all sizes)
- Prioritize visual quality and smooth animations above all else.