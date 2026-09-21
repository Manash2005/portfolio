import { Suspense, lazy } from 'react'
import Hero from '../sections/Hero'
import Projects from '../sections/Projects'
import Activity from '../sections/Activity'
import Build from '../sections/Build'
import About from '../sections/About'
import Contact from '../sections/Contact'

// Lazy-load 3D canvas so text paints first
const Scene = lazy(() => import('../three/Scene'))

export default function Home() {
  return (
    <main>
      {/* 3D canvas — fixed behind everything, aria-hidden */}
      <Suspense fallback={null}>
        <Scene />
      </Suspense>

      <Hero />
      <Projects />
      <Activity />
      <Build />
      <About />
      <Contact />
    </main>
  )
}
