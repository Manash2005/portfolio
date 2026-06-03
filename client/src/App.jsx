import Navbar from './layouts/Navbar'
import About from './sections/About'
import Contact from './sections/Contact'
import Hero from './sections/Hero'
import Projects from './sections/Projects'
function App() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="flex items-center justify-center fixed top-0 left-1/2 transform -translate-x-1/2 z-50">
        <Navbar />
      </header>

      <main className="px-10 py-4">
        <Hero />
        <About />
        <Projects />
        <Contact />
      </main>
    </div>
  )
}

export default App