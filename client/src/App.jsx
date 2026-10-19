import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import Home from './pages/Home'
import AllProjects from './pages/AllProjects'
import SecondBrain from './pages/SecondBrain'
import AdminLogin from './pages/AdminLogin'
import Blogs from './pages/Blogs'
import BlogDetail from './pages/BlogDetail'
import Navbar from './layouts/Navbar'
import Loader from './components/Loader'
import Footer from './components/Footer'
import { AdminProvider, useAdmin } from './context/AdminContext'
import AdminToolbar from './components/admin/AdminToolbar'
import ProjectModal from './components/admin/ProjectModal'
import AboutModal from './components/admin/AboutModal'
import EventAdminModal from './components/admin/EventAdminModal'
import GoalModal from './components/admin/GoalModal'

gsap.registerPlugin(ScrollTrigger)

function ProtectedRoute({ children }) {
  const { isAdmin, isCheckingSession } = useAdmin()

  if (isCheckingSession) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: '#08080C' }}>
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

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
            <Route path="/blogs" element={<Navigate to="/second-brain/blogs" replace />} />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <SecondBrain defaultMode="calendar" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/second-brain"
              element={
                <ProtectedRoute>
                  <SecondBrain defaultMode="calendar" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar/dsa"
              element={
                <ProtectedRoute>
                  <SecondBrain defaultMode="dsa" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/second-brain/dsa"
              element={
                <ProtectedRoute>
                  <SecondBrain defaultMode="dsa" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar/blogs"
              element={
                <ProtectedRoute>
                  <SecondBrain defaultMode="blogs" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/second-brain/blogs"
              element={
                <ProtectedRoute>
                  <SecondBrain defaultMode="blogs" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar/blogs/:slug"
              element={
                <ProtectedRoute>
                  <SecondBrain defaultMode="blogs" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/second-brain/blogs/:slug"
              element={
                <ProtectedRoute>
                  <SecondBrain defaultMode="blogs" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar/core-cs"
              element={
                <ProtectedRoute>
                  <SecondBrain defaultMode="core-cs" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/second-brain/core-cs"
              element={
                <ProtectedRoute>
                  <SecondBrain defaultMode="core-cs" />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/login" element={<AdminLogin />} />
          </Routes>
          {!isAdminLogin && <Footer />}

          {/* Floating Admin Controls & Modals */}
          <AdminToolbar />
          <ProjectModal />
          <AboutModal />
          <EventAdminModal />
          <GoalModal />
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