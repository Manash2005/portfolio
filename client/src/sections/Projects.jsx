import { motion } from "motion/react";
import GridBg from "../utils/GridBg";
import NoiseBg from "../utils/NoiseBg";
import ProjectCard from "../components/ProjectCard";
import { Code2, ArrowRight } from "lucide-react";
import portfolioData from "../data/portfolio_data.json";
import { Link } from 'react-router-dom';

function Projects() {
  const featuredProjects = portfolioData.projects.filter(p => p.featured);
  const gatekeeper = featuredProjects.find(p => p.title.includes("Gatekeeper"));
  const otherFeatured = featuredProjects.filter(p => !p.title.includes("Gatekeeper"));

  return (
    <section id="projects" className="relative min-h-screen overflow-hidden pt-20 md:pt-28 pb-16 w-full flex flex-col items-center">
      <GridBg />
      <NoiseBg />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-16">
        
        {/* Section Heading */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }} 
          viewport={{ once: true }} 
          className="text-center"
        >
          <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-full px-4 py-1.5 w-fit text-xs font-mono text-secondary mb-4 mx-auto backdrop-blur-sm shadow-inner">
            <Code2 className="h-3.5 w-3.5 text-foreground" />
            Engineering Showcases
          </div>
          <h2 className="text-white text-4xl md:text-5xl font-extrabold tracking-tight">
            Featured Projects
          </h2>
        </motion.div>

        {/* Gatekeeper Deep Dive Feature */}
        {gatekeeper && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="w-full border border-foreground/30 bg-neutral-950/40 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-[0_0_50px_rgba(194,61,41,0.1)] group relative"
          >
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            {/* Image Side */}
            <div className="w-full lg:w-1/2 relative bg-black/50 border-b lg:border-b-0 lg:border-r border-white/10 p-4 md:p-8 flex items-center justify-center">
              <img 
                src={gatekeeper.image} 
                alt="Gatekeeper Architecture"
                className="rounded-xl w-full h-auto object-cover border border-white/5 shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]"
              />
              {/* Highlight badge */}
              <div className="absolute top-4 left-4 bg-foreground text-black text-[10px] font-bold font-mono px-3 py-1 rounded-full shadow-lg">
                DEEP DIVE
              </div>
            </div>

            {/* Content Side */}
            <div className="w-full lg:w-1/2 p-6 md:p-10 flex flex-col justify-center">
              <h3 className="text-3xl font-bold text-white mb-2">{gatekeeper.title}</h3>
              <p className="text-foreground/80 font-mono text-xs mb-6">{gatekeeper.category}</p>
              
              <div className="space-y-4 text-sm md:text-base text-secondary leading-relaxed">
                <div>
                  <span className="text-white font-semibold">The Problem:</span> {gatekeeper.problem}
                </div>
                <div>
                  <span className="text-white font-semibold">Architecture:</span> {gatekeeper.architecture}
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 font-mono text-xs text-white/70 italic relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-foreground" />
                  " {gatekeeper.reflection} "
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {gatekeeper.metrics.map((metric, idx) => (
                  <span key={idx} className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono rounded-lg">
                    {metric}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex gap-4">
                <a href={gatekeeper.githubLink} target="_blank" rel="noreferrer" className="flex-1 text-center py-3 rounded-xl border border-white/20 hover:bg-white hover:text-black transition-all text-sm font-semibold">
                  View Source
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* Other Featured Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherFeatured.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <ProjectCard {...project} />
            </motion.div>
          ))}
        </div>

        {/* See All Button */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mt-8"
        >
          <Link 
            to="/projects"
            className="group flex items-center gap-3 bg-white/5 border border-white/10 hover:border-foreground/40 hover:bg-white/10 px-8 py-4 rounded-full text-white font-semibold transition-all duration-300 backdrop-blur-md"
          >
            See All Projects
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 group-hover:text-foreground transition-transform" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
}

export default Projects;