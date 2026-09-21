import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'motion/react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import Home from './pages/Home'
import AllProjects from './pages/AllProjects'
import Navbar from './layouts/Navbar'
import Loader from './components/Loader'
import Footer from './components/Footer'
import { useState } from 'react'

gsap.registerPlugin(ScrollTrigger)

function App() {
  const [loaderDone, setLoaderDone] = useState(false)
  const lenisRef = useRef(null)
  const location = useLocation()

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
        {!loaderDone && (
          <Loader key="loader" onComplete={() => setLoaderDone(true)} />
        )}
      </AnimatePresence>

      {loaderDone && (
        <>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<AllProjects />} />
          </Routes>
          <Footer />
        </>
      )}
    </div>
  )
}

export default App