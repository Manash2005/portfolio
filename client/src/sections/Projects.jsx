import { motion } from "motion/react";
import GridBg from "../utils/GridBg";
import FloatingParticles from "../utils/FloatingParticles";
import ProjectCard from "../components/ProjectCard";
import { projects } from "../data/projectData";

function Projects() {
  return (
    <section id="projects" className="relative min-h-screen overflow-hidden pt-10 md:pt-20 w-full">
      <GridBg />
      <FloatingParticles />

      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-foreground/20 blur-3xl" />

      <div className="relative z-10 px-6 md:px-10 2xl:px-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-primary font-mono text-2xl md:text-4xl 2xl:text-5xl font-bold">
            PROJECTS
          </h2>

          <p className="text-secondary mt-4 max-w-2xl mx-auto">
            A collection of projects showcasing my frontend, backend and full stack development journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-14 max-w-7xl mx-auto">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: index * 0.15 }}
              viewport={{ once: true }}
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