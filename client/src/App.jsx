import Navbar from './layouts/Navbar'
import About from './sections/About'
import Contact from './sections/Contact'
import Hero from './sections/Hero'
import Projects from './sections/Projects'
import { easeInOut, motion } from "motion/react"
function App() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1}}
      transition={{ duration: 2, ease: easeInOut }}
      className="hidden lg:flex items-center justify-center fixed top-0 left-1/2 transform -translate-x-1/2 z-50">
        <Navbar />
      </motion.header>

      <main className="px-2 lg:px-8">
        <Hero />
        <About />
        <Projects />
        <Contact />
      </main>
    </div>
  )
}

export default App