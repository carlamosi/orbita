import { Routes, Route, useLocation } from 'react-router-dom'
import { Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import PageWrapper from './components/PageWrapper'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Explorer from './pages/Explorer'
import Progress from './pages/Progress'
import Challenges from './pages/Challenges'
import FindCountry from './pages/FindCountry'
import NameCountry from './pages/NameCountry'
import FlagQuiz from './pages/FlagQuiz'
import CapitalQuiz from './pages/CapitalQuiz'
import SpeedRound from './pages/SpeedRound'
import Offline from './pages/Offline'
import { WorldDataProvider, useWorldData } from './context/WorldDataContext'

function AppContent() {
  const { isLoading } = useWorldData()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_#6C63FF,0_0_40px_rgba(108,99,255,0.25)]"></div>
          <p className="font-mono text-white/50 text-[10px] tracking-[0.2em] uppercase">Initializing Orbita World Data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"           element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/explorer"   element={<PageWrapper><Explorer /></PageWrapper>} />
          <Route path="/progress"   element={<PageWrapper><Progress /></PageWrapper>} />
          <Route path="/challenges" element={<PageWrapper><Challenges /></PageWrapper>} />
          {/* New Game Modes */}
          <Route path="/find"       element={<PageWrapper><FindCountry /></PageWrapper>} />
          <Route path="/name"       element={<PageWrapper><NameCountry /></PageWrapper>} />
          <Route path="/flag"       element={<PageWrapper><FlagQuiz /></PageWrapper>} />
          <Route path="/capital"    element={<PageWrapper><CapitalQuiz /></PageWrapper>} />
          <Route path="/speed"      element={<PageWrapper><SpeedRound /></PageWrapper>} />
          <Route path="/offline"    element={<PageWrapper><Offline /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <WorldDataProvider>
      <AppContent />
    </WorldDataProvider>
  )
}
