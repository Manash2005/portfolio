import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";
import { FaGithub } from "react-icons/fa";

function ProjectCard({
  title,
  description,
  image,
  techStack,
  liveLink,
  githubLink,
}) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-background/70 backdrop-blur-xl p-4 shadow-[0_0_40px_rgba(194,61,41,0.08)] hover:shadow-[0_0_60px_rgba(194,61,41,0.2)]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

      <div className="relative z-10">
        <div className="overflow-hidden rounded-2xl">
          <img
            src={image}
            alt={title}
            className="w-full h-52 md:h-64 object-cover transition duration-500 group-hover:scale-105"
          />
        </div>

        <h3 className="text-primary text-xl md:text-2xl font-bold mt-6">
          {title}
        </h3>

        <p className="text-secondary mt-3 leading-relaxed">
          {description}
        </p>

        <div className="flex flex-wrap gap-3 mt-6">
          {techStack.map((tech, index) => (
            <div
              key={index}
              className="h-10 w-10 rounded-full border border-white/10 bg-white flex justify-center items-center"
            >
              <img
                src={tech}
                alt=""
                className="h-9 w-10 object-contain rounded-full"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
            <a
                href={githubLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-secondary hover:text-primary hover:border-foreground/40 transition-all duration-300"
            >
                <FaGithub size={18} />
                Github Repo
            </a>

            <a
                href={liveLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl bg-foreground/10 border border-foreground/30 px-4 py-2 text-foreground hover:bg-foreground/20 transition-all duration-300"
            >
                Live Demo
                <ExternalLink size={18} />
            </a>
        </div>
      </div>
    </motion.div>
  );
}

export default ProjectCard;