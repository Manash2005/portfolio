import { motion } from 'motion/react'
import { projects } from '../data/projectData'
import ProjectCard from '../components/ProjectCard'
import GridBg from '../utils/GridBg'
import { Link } from 'react-router-dom'
import { ArrowLeft, Grid3X3 } from 'lucide-react'

export default function AllProjects() {
  const webProjects = projects.filter(p => p.category === 'web')
  const dataProjects = projects.filter(p => p.category === 'data-analytics')

  return (
    <div className="min-h-screen relative bg-background">
      <GridBg />

      <div className="relative z-10 pt-32 pb-16 px-6 md:px-12 w-full max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link 
            to="/#projects" 
            className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors font-mono text-sm mb-10 border border-white/10 bg-white/5 px-4 py-2 rounded-full hover:border-foreground/40"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-foreground/10 border border-foreground/30 flex items-center justify-center">
              <Grid3X3 className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">Project Archive</h1>
              <p className="text-secondary text-sm mt-1">Everything I've built, shipped, and experimented with.</p>
            </div>
          </div>
          
          <div className="w-full h-px bg-white/5 mt-8 mb-12" />

          {/* Web Projects */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <span className="px-3 py-1 text-xs font-mono font-bold border border-red-500/30 bg-red-500/10 text-red-400 rounded-full">WEB SYSTEMS</span>
              <span className="text-secondary font-mono text-xs">{webProjects.length} projects</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {webProjects.map((project, index) => (
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full flex"
                >
                  <ProjectCard {...project} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Data Analytics Projects */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <span className="px-3 py-1 text-xs font-mono font-bold border border-orange-500/30 bg-orange-500/10 text-orange-400 rounded-full">DATA ANALYTICS</span>
              <span className="text-secondary font-mono text-xs">{dataProjects.length} projects</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dataProjects.map((project, index) => (
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full flex"
                >
                  <ProjectCard {...project} />
                </motion.div>
              ))}
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  )
}

