import Scene from '../three/Scene'
import Hero from '../sections/Hero'
import Projects from '../sections/Projects'
import Activity from '../sections/Activity'
import Build from '../sections/Build'
import About from '../sections/About'
import Contact from '../sections/Contact'

export default function Home() {
  return (
    <main>
      {/* 3D canvas — fixed behind everything, aria-hidden */}
      <Scene />

      <Hero />
      <Projects />
      <Activity />
      <Build />
      <About />
      <Contact />
    </main>
  )
}
