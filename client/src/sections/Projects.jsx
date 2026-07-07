import { motion } from "motion/react";
import GridBg from "../utils/GridBg";
import FloatingParticles from "../utils/FloatingParticles";
import ProjectCard from "../components/ProjectCard";
import { projects } from "../data/projectData";
import { Code2 } from "lucide-react";

function Projects() {
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
          className="text-center mb-12 md:mb-16"
        >
          <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-full px-4 py-1.5 w-fit text-xs font-mono text-secondary mb-4 mx-auto backdrop-blur-sm shadow-inner">
            <Code2 className="h-3.5 w-3.5 text-foreground" />
            My Portfolio
          </div>
          <h2 className="text-white text-4xl md:text-5xl font-extrabold tracking-tight">
            Featured Projects
          </h2>
          <p className="text-secondary text-sm md:text-base mt-3 max-w-lg mx-auto">
            A collection of web applications showcasing my frontend, backend, and full-stack development journey.
          </p>
        </motion.div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <ProjectCard {...project} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Projects;