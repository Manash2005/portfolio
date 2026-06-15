import Navbar from './layouts/Navbar'
import About from './sections/About'
import Contact from './sections/Contact'
import Hero from './sections/Hero'
import Projects from './sections/Projects'
import Intro from './sections/Intro'
import { easeInOut, motion } from "motion/react"
import { useState } from 'react'
import UnderConstruction from './sections/UnderConstruction'
import Skills from './sections/Skills'
function App() {
  const [showIntro, setShowIntro] = useState(true);
  return (
    <div className="min-h-screen overflow-x-hidden">
      <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1}}
      transition={{ duration: 2, ease: easeInOut }}
      className="hidden lg:flex items-center justify-center fixed top-0 left-1/2 transform -translate-x-1/2 z-50">
        <Navbar />
      </motion.header>

      <main>
        {showIntro ? (
          <Intro
            onComplete={() => setShowIntro(false)}
          />
        ) : (
          <>
            <Hero />
            <Skills />
            <About />
            <Projects />
            <Contact />
            <UnderConstruction />
          </>
        )}
    </main>
    </div>
  )
}

export default App