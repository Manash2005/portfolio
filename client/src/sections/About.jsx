import { motion } from "motion/react";
import { User, MapPin, Briefcase, GraduationCap } from "lucide-react";
import GridBg from "../utils/GridBg";
import NoiseBg from "../utils/NoiseBg";
import portfolioData from "../data/portfolio_data.json";

function About() {
  return (
    <section id="about" className="relative min-h-screen overflow-hidden pt-20 md:pt-28 pb-16 w-full flex items-center justify-center">
      {/* GRID BACKGROUND */}
      <GridBg />

      {/* FLOATING PARTICLES */}
      <NoiseBg />

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

      <div className="relative z-10 w-full max-w-6xl px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
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

            <div className="mt-6 space-y-4">
              {portfolioData.personal.about.map((paragraph, idx) => (
                <motion.p 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="text-secondary text-base md:text-lg leading-relaxed max-w-2xl"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-8 flex flex-col sm:flex-row gap-4"
            >
              <div className="flex items-center gap-2 text-sm text-secondary font-mono bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                <MapPin className="h-4 w-4 text-foreground" />
                <span>Bangalore, India</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary font-mono bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                <Briefcase className="h-4 w-4 text-foreground" />
                <span>Open to Internships</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary font-mono bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                <GraduationCap className="h-4 w-4 text-foreground" />
                <span>BITS Pilani CS</span>
              </div>
            </motion.div>

          </motion.div>
        </div>

        {/* Right Side: Photo Frame */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center lg:items-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative group w-full max-w-[380px] aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 bg-neutral-950/40 backdrop-blur-md shadow-xl"
          >
            {/* Photo Placeholder/Image - Replace src with your actual photo */}
            <img 
              src="/about_me_photo.png" 
              alt="Manash Swain" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#010011] via-transparent to-transparent opacity-80" />
            
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="text-white font-bold text-xl mb-1">Manash Swain</h3>
              <p className="text-foreground text-sm font-mono opacity-80">Building ideas into reality</p>
            </div>
            
            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-foreground/50 rounded-tl-xl transition-all duration-300 group-hover:border-foreground" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-foreground/50 rounded-tr-xl transition-all duration-300 group-hover:border-foreground" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-foreground/50 rounded-br-xl transition-all duration-300 group-hover:border-foreground" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default About;