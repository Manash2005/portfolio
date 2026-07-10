import { motion } from "motion/react";
import GridBg from "../utils/GridBg";
import FloatingParticles from "../utils/FloatingParticles";

/**
 * A dedicated component that displays a stylized 'Service Unavailable' message,
 * designed to match the high-polish dark mode aesthetic of the Developer Dashboard.
 */
function UnderConstruction() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 pb-16">
      {/* Grid Background */}
      <GridBg />

      {/* Floating Particles */}
      <FloatingParticles />

      {/* Main Content Card - Styled to match dashboard aesthetic */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        viewport={{ once: true }}
        className="relative z-10 text-center rounded-[2rem] p-16 max-w-xl border border-white/10 bg-neutral-950/30 backdrop-blur-lg shadow-[0_0_40px_rgba(194,61,41,0.08)]"
      >
        {/* Primary Error Code - Animated Glow */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, type: "spring", stiffness: 120 }}
          className="text-8xl md:text-9xl font-extrabold tracking-tight mb-4"
          style={{ color: 'var(--color-foreground)' }} // Using the defined variable for glow accent
        >
          404
        </motion.h1>

        {/* Subheading - High Visibility Text */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-4xl md:text-5xl font-bold text-primary mb-3"
        >
          Service Unavailable.
        </motion.h2>

        {/* Descriptive Message - Secondary Accent */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-6 text-base md:text-lg text-secondary/80 font-mono"
        >
          The requested resource path is currently undergoing development and has been temporarily archived for optimization. We anticipate an update shortly!
        </motion.div>

        {/* Call to Action / Developer Note - Tertiary Accent */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-12 p-4 border border-white/5 bg-neutral-950/50 rounded-[1rem] text-sm text-primary/60 font-mono tracking-wider"
        >
          Development is in progress, focusing on enhancing user experience and stabilizing core features. Stay tuned for the next release cycle!
        </motion.div>
      </motion.div>
    </section>
  );
}

export default UnderConstruction;