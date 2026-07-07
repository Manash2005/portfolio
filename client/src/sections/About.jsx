import { motion } from "motion/react";
import { User, Code, Terminal, Brain, Cpu } from "lucide-react";
import GridBg from "../utils/GridBg";
import FloatingParticles from "../utils/FloatingParticles";

function About() {
  const cards = [
    {
      icon: <Code className="h-6 w-6 text-foreground" />,
      title: "Full-Stack Development",
      description: "Building responsive frontend apps and robust REST APIs using React, Node.js, Express, and databases."
    },
    {
      icon: <Brain className="h-6 w-6 text-foreground" />,
      title: "Problem Solving",
      description: "Actively solving DSA problems with 100+ Leetcode and 170+ GeeksforGeeks solutions under my belt."
    },
    {
      icon: <Terminal className="h-6 w-6 text-foreground" />,
      title: "CS Fundamentals",
      description: "Pursuing BS in Computer Science at BITS Pilani, mastering databases, OS, networks, and software engineering."
    }
  ];

  const tags = [
    "React", "Node.js", "Express", "MongoDB", "JavaScript", 
    "TailwindCSS", "SQL", "C++", "Data Structures", "Algorithms", 
    "Git", "REST APIs"
  ];

  return (
    <section id="about" className="relative min-h-screen overflow-hidden pt-20 md:pt-28 pb-16 w-full flex items-center justify-center">
      {/* GRID BACKGROUND */}
      <GridBg />

      {/* FLOATING PARTICLES */}
      <FloatingParticles />

      {/* Accent Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.4, 0.15],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-foreground/15 blur-3xl z-0 pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-7xl px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Side: Journey & Philosophy */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-full px-4 py-1.5 w-fit text-xs font-mono text-secondary mb-6 backdrop-blur-sm shadow-inner">
              <User className="h-3.5 w-3.5 text-foreground" />
              About Me
            </div>

            <h2 className="text-primary text-4xl md:text-5xl font-extrabold tracking-tight">
              My Developer Journey
            </h2>

            <p className="text-secondary mt-6 text-base md:text-lg leading-relaxed max-w-2xl">
              I am a passionate Full-Stack Software Developer currently pursuing a BS in Computer Science at <span className="text-primary font-semibold">BITS Pilani</span> (2024 - 2027). I specialize in creating clean, maintainable web applications and solving complex algorithmic challenges.
            </p>
            <p className="text-secondary mt-4 mb-8 text-base md:text-lg leading-relaxed max-w-2xl">
              For me, coding is not just about writing syntax—it is about designing elegant solutions to real problems. Whether optimizing a SQL database query, designing a Kanban dashboard, or practicing core computer science concepts, I love the endless learning loop that development offers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                viewport={{ once: true }}
                className="border border-white/5 bg-neutral-950/40 backdrop-blur-md rounded-2xl p-5 hover:border-foreground/35 transition-all duration-300 shadow-sm"
              >
                <div className="h-10 w-10 rounded-lg bg-secondary/10 border border-white/10 flex justify-center items-center mb-4">
                  {card.icon}
                </div>
                <h3 className="text-primary font-bold text-base mb-2 font-mono">
                  {card.title}
                </h3>
                <p className="text-secondary text-xs leading-relaxed">
                  {card.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Side: Skill Tags & Interactive Visual Card */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="border border-white/10 bg-neutral-950/30 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(194,61,41,0.01)]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-foreground/10 border border-foreground/30 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-primary font-bold text-lg font-mono">Core Toolset</h3>
                <p className="text-secondary text-xs">Technologies I work with daily</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {tags.map((tag, idx) => (
                <motion.span
                  key={idx}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-mono border border-white/5 bg-neutral-950/60 text-secondary hover:border-foreground/40 hover:text-foreground transition-all duration-300 cursor-default"
                >
                  {tag}
                </motion.span>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-white/5 flex flex-col gap-3.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-secondary">Status:</span>
                <span className="text-foreground animate-pulse">Open to Opportunities</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-secondary">Location:</span>
                <span className="text-primary">Goa, India</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-secondary">Interests:</span>
                <span className="text-primary">Full-Stack, DSA, Systems</span>
              </div>
              <a
                href="#skills"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("skills")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-2 text-center py-2.5 rounded-xl text-xs font-mono border border-foreground/30 bg-foreground/10 text-primary hover:bg-foreground hover:text-black transition-all duration-300 font-semibold"
              >
                View Coding Dashboard
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default About;