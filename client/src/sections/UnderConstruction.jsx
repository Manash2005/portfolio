import { motion } from "motion/react";

function UnderConstruction() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="
          text-center
          rounded-3xl
          w-auto
          bg-secondary/10
          backdrop-blur-md
          p-10
          shadow-lg
        "
      >
        <motion.h1
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
            text-7xl
            font-bold
            text-foreground
            mb-4
          "
        >
          404
        </motion.h1>

        <h2 className="text-2xl font-semibold text-primary mb-4">
          Content not found.
        </h2>

        <motion.div
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
          className="
            mt-6
            text-sm
            text-primary/60
            font-mono
          "
        >
          Developer is still building it.
        </motion.div>
      </motion.div>
    </section>
  );
}

export default UnderConstruction;