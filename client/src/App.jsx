import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import Home from './pages/Home'
import AllProjects from './pages/AllProjects'
import SecondBrain from './pages/SecondBrain'
import AdminLogin from './pages/AdminLogin'
import Navbar from './layouts/Navbar'
import Loader from './components/Loader'
import Footer from './components/Footer'
import { AdminProvider } from './context/AdminContext'
import AdminToolbar from './components/admin/AdminToolbar'
import ProjectModal from './components/admin/ProjectModal'
import AboutModal from './components/admin/AboutModal'
import EventAdminModal from './components/admin/EventAdminModal'

gsap.registerPlugin(ScrollTrigger)

function AppContent() {
  const [loaderDone, setLoaderDone] = useState(false)
  const lenisRef = useRef(null)
  const location = useLocation()
  const isAdminLogin = location.pathname === '/admin/login'

  // Lenis smooth scroll — sync to GSAP ticker
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
    })
    lenisRef.current = lenis

    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    lenis.on('scroll', ScrollTrigger.update)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])

  // Reset scroll on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="min-h-screen w-full overflow-x-clip" style={{ background: '#08080C' }}>
      <AnimatePresence mode="wait">
        {!loaderDone && !isAdminLogin && (
          <Loader key="loader" onComplete={() => setLoaderDone(true)} />
        )}
      </AnimatePresence>

      {(loaderDone || isAdminLogin) && (
        <>
          {!isAdminLogin && <Navbar />}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<AllProjects />} />
            <Route path="/calendar" element={<SecondBrain defaultMode="calendar" />} />
            <Route path="/second-brain" element={<SecondBrain defaultMode="calendar" />} />
            <Route path="/calendar/dsa" element={<SecondBrain defaultMode="dsa" />} />
            <Route path="/second-brain/dsa" element={<SecondBrain defaultMode="dsa" />} />
            <Route path="/admin/login" element={<AdminLogin />} />
          </Routes>
          {!isAdminLogin && <Footer />}

          {/* Floating Admin Controls & Modals */}
          <AdminToolbar />
          <ProjectModal />
          <AboutModal />
          <EventAdminModal />
        </>
      )}
    </div>
  )
}

function App() {
  return (
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  )
}

export default App