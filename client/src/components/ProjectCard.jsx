import { motion } from "motion/react";
import { ExternalLink, Terminal } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { useState } from "react";

function ProjectCard({
  title,
  description,
  image,
  techStack = [],
  liveLink,
  githubLink,
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/40 backdrop-blur-md p-5 transition-all duration-500 hover:border-foreground/30 hover:shadow-[0_0_40px_rgba(194,61,41,0.15)] flex flex-col h-full"
    >
      {/* Background Gradient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

      {/* Image / Fallback Container */}
      <div className="overflow-hidden rounded-2xl relative aspect-video w-full bg-white/5 border border-white/5 flex items-center justify-center">
        {!image || imageError ? (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex flex-col items-center justify-center text-center p-4">
            <Terminal className="w-8 h-8 text-foreground/40 mb-2" />
            <span className="text-white/40 text-xs font-mono tracking-wider uppercase">{title} Mockup</span>
          </div>
        ) : (
          <img
            src={image}
            alt={title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}
      </div>

      {/* Text Details */}
      <div className="flex-1 flex flex-col mt-5">
        <h3 className="text-white text-xl font-bold font-mono tracking-wide">
          {title}
        </h3>

        <p className="text-secondary text-xs md:text-sm mt-3 leading-relaxed flex-1">
          {description}
        </p>

        {/* Tech Stack Pills */}
        <div className="flex flex-wrap gap-1.5 mt-5">
          {techStack.map((tech, index) => (
            <span
              key={index}
              className="px-2.5 py-1 text-[10px] font-mono font-medium rounded-lg border border-white/5 bg-neutral-950/60 text-secondary hover:border-foreground/30 hover:text-white transition-all duration-300 cursor-default"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
          {githubLink ? (
            <a
              href={githubLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-mono text-secondary hover:text-white hover:border-white/20 transition-all duration-300"
            >
              <FaGithub className="w-4 h-4" />
              Source Code
            </a>
          ) : (
            <span className="text-[10px] font-mono text-white/30 italic select-none">
              Private Repository
            </span>
          )}

          <a
            href={liveLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-foreground/10 border border-foreground/30 px-3.5 py-2 text-xs font-mono text-foreground hover:bg-foreground hover:text-black transition-all duration-300 font-semibold"
          >
            Live Demo
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default ProjectCard;