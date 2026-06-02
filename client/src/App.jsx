import Navbar from './layouts/Navbar'
import About from './sections/About'
import Contact from './sections/Contact'
import Hero from './sections/Hero'
import Projects from './sections/Projects'
function App() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

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