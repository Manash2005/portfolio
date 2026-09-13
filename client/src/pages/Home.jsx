import Hero from '../sections/Hero'
import Skills from '../sections/Skills'
import About from '../sections/About'
import Projects from '../sections/Projects'
import Contact from '../sections/Contact'
import Intro from '../sections/Intro'

export default function Home({ stats, showIntro, setShowIntro }) {
  return (
    <main>
      {showIntro ? (
        <Intro
          stats={stats}
          onComplete={() => setShowIntro(false)}
        />
      ) : (
        <>
          <Hero stats={stats} />
          <Skills stats={stats} />
          <About />
          <Projects />
          <Contact />
        </>
      )}
    </main>
  )
}
