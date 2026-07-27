import Navbar from './layouts/Navbar'
import About from './sections/About'
import Contact from './sections/Contact'
import Hero from './sections/Hero'
import Projects from './sections/Projects'
import Intro from './sections/Intro'
import { easeInOut, motion } from "motion/react"
import { useState, useEffect } from 'react'
import UnderConstruction from './sections/UnderConstruction'
import Skills from './sections/Skills'
import { statsData as initialStats } from './data/statsData'

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [globalStats, setGlobalStats] = useState(initialStats);

  // Monitor page scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch dynamic LeetCode stats
  useEffect(() => {
    const fetchLeetcodeStats = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "https://portfolio-c43c.onrender.com";
        const response = await fetch(`${apiUrl}/api/v1/leetcode/stats/Manash_22`);
        if (!response.ok) {
          throw new Error("Failed to fetch leetcode stats");
        }
        const data = await response.json();
        if (data.success && data.stats) {
          setGlobalStats((prev) => {
            const leetcode = {
              easy: data.stats.easy || prev.leetcode.easy,
              medium: data.stats.medium || prev.leetcode.medium,
              hard: data.stats.hard || prev.leetcode.hard,
            };
            leetcode.total = leetcode.easy + leetcode.medium + leetcode.hard;
            return {
              ...prev,
              leetcode,
            };
          });
        }
      } catch (error) {
        console.error("Leetcode stats fetch error:", error);
      }
    };
    fetchLeetcodeStats();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1}}
      transition={{ duration: 2, ease: easeInOut }}
      className="flex w-full items-center justify-center fixed top-0 left-1/2 transform -translate-x-1/2 z-50">
        <Navbar />
      </motion.header>

      <main>
        {showIntro ? (
          <Intro
            stats={globalStats}
            onComplete={() => setShowIntro(false)}
          />
        ) : (
          <>
            <Hero stats={globalStats} />
            <Skills stats={globalStats} />
            <About />
            <Projects />
            <Contact />
            {/* <UnderConstruction /> */}
          </>
        )}
      </main>

      {/* Page Scroll Meter fixed at bottom */}
      {!showIntro && (
        <>
          <div className="fixed bottom-0 left-0 w-full h-[4px] bg-[#0c0a1c]/60 backdrop-blur-sm z-[9999] pointer-events-none">
            <div 
              className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 shadow-[0_0_12px_rgba(239,68,68,0.85)] transition-all duration-75 ease-out" 
              style={{ width: `${scrollProgress}%` }} 
            />
          </div>
          <div className="fixed bottom-3 right-4 z-[9999] pointer-events-none font-mono text-[10px] text-white/50 bg-[#070514]/80 border border-white/5 backdrop-blur-md rounded-md px-2 py-0.5 shadow-[0_0_10px_rgba(194,61,41,0.15)] flex items-center gap-1 select-none">
            <span>SCROLLED</span>
            <span className="text-[#C23D29] font-bold">{Math.round(scrollProgress)}%</span>
          </div>
        </>
      )}
    </div>
  )
}

export default App