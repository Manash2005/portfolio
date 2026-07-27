import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import GridBg from "../utils/GridBg";
import FloatingParticles from "../utils/FloatingParticles";
import ProjectCard from "../components/ProjectCard";
import { projects } from "../data/projectData";
import { Code2 } from "lucide-react";

function Projects() {
  const [activeCategory, setActiveCategory] = useState("web");

  const filteredProjects = projects.filter((p) => p.category === activeCategory);

  return (
    <section id="projects" className="relative min-h-screen overflow-hidden pt-20 md:pt-28 pb-16 w-full flex items-center">
      {/* GRID BACKGROUND */}
      <GridBg />
      
      {/* Floating Particles */}
      <FloatingParticles />

      {/* Backdrop Accent Glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1], 
          opacity: [0.15, 0.35, 0.15] 
        }} 
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }} 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-foreground/10 blur-3xl pointer-events-none" 
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Heading */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }} 
          viewport={{ once: true }} 
          className="text-center mb-8 md:mb-12"
        >
          <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-full px-4 py-1.5 w-fit text-xs font-mono text-secondary mb-4 mx-auto backdrop-blur-sm shadow-inner">
            <Code2 className="h-3.5 w-3.5 text-foreground" />
            My Portfolio
          </div>
          <h2 className="text-white text-4xl md:text-5xl font-extrabold tracking-tight">
            Featured Projects
          </h2>
          <p className="text-secondary text-sm md:text-base mt-3 max-w-lg mx-auto">
            A curated showcase of my engineering work, categorized by domain.
          </p>
        </motion.div>

        {/* Futuristic Category Selector Switch */}
        <div className="relative flex justify-center mb-8 select-none max-w-xs mx-auto">
          <div className="relative flex w-full border border-white/5 bg-neutral-950/50 backdrop-blur-md p-1 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <button
              onClick={() => setActiveCategory("web")}
              className="relative flex-1 py-2.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-center cursor-pointer transition-colors duration-300 z-10"
            >
              {activeCategory === "web" && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-600/90 to-orange-500/90 shadow-[0_0_15px_rgba(239,68,68,0.4)] z-0"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <span className={`relative z-10 ${activeCategory === "web" ? "text-white" : "text-white/40 hover:text-white/70"}`}>
                Web Systems
              </span>
            </button>
            
            <button
              onClick={() => setActiveCategory("data-analytics")}
              className="relative flex-1 py-2.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-center cursor-pointer transition-colors duration-300 z-10"
            >
              {activeCategory === "data-analytics" && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-600/90 to-amber-500/90 shadow-[0_0_15px_rgba(249,115,22,0.4)] z-0"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <span className={`relative z-10 ${activeCategory === "data-analytics" ? "text-white" : "text-white/40 hover:text-white/70"}`}>
                Data Insights
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Category Tech Specs HUD */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-xs md:max-w-md mx-auto mb-12 border border-white/5 bg-[#070514]/30 backdrop-blur-md rounded-xl p-3 flex items-center justify-between font-mono text-[9px] tracking-wider text-white/45"
        >
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${activeCategory === "web" ? "bg-red-500 animate-pulse" : "bg-orange-500 animate-pulse"}`} />
            <span>STATUS: ACTIVE</span>
          </div>
          <div>
            <span>SYSTEM: {activeCategory === "web" ? "NODE.JS / EXPRESS / SUPABASE" : "PYTHON / PANDAS / SEABORN"}</span>
          </div>
          <div>
            <span>COUNT: {filteredProjects.length} / 4</span>
          </div>
        </motion.div>

        {/* Project Cards Grid with 3D Perspective */}
        <div 
          style={{ perspective: "1200px" }}
          className={`grid grid-cols-1 ${
            filteredProjects.length > 1 ? "md:grid-cols-2 max-w-5xl" : "md:grid-cols-1 max-w-lg"
          } gap-8 mx-auto items-stretch justify-center`}
        >
          <AnimatePresence mode="wait">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, rotateY: 15, z: -100, scale: 0.95 }}
                animate={{ opacity: 1, rotateY: 0, z: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: -15, z: -100, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 120, damping: 18, delay: index * 0.08 }}
                style={{ transformStyle: "preserve-3d" }}
                className="h-full flex"
              >
                <ProjectCard {...project} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default Projects;