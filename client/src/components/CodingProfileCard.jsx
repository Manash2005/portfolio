import { motion } from "motion/react";

function CodingProfileCard({
  logo,
  platform,
  totalSolved,
  easy,
  medium,
  hard,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      viewport={{ once: true }}
      className="w-full max-w-sm bg-secondary/10 hover:bg-background border border-foreground/40 rounded-3xl p-6 shadow-[0_0_40px_rgba(194,61,41,0.1)] hover:shadow-[30px_20px_40px_rgba(194,61,41,0.3)] transition-all duration-700"
    >
      {/* Header */}

      <div className="flex items-center gap-4">
        <img
          src={logo}
          alt={platform}
          className="w-12 h-12 object-contain rounded-md"
        />

        <div>
          <h3 className="text-primary text-xl font-semibold">
            {platform}
          </h3>

          <p className="text-secondary text-sm">
            Coding Profile
          </p>
        </div>
      </div>

      {/* Total Solved */}

      <div className="mt-8">
        <p className="text-secondary text-sm">
          Problems Solved
        </p>

        <motion.h1
          initial={{ scale: 0.9 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-5xl font-bold text-foreground mt-1"
        >
          {totalSolved}
        </motion.h1>
      </div>

      {/* Difficulty Stats */}

      <div className="grid grid-cols-3 gap-3 mt-8">
        <div className="bg-secondary/20 rounded-2xl p-3 text-center">
          <p className="text-secondary text-xs">Easy</p>
          <p className="text-primary font-semibold mt-1">
            {easy}
          </p>
        </div>

        <div className="bg-secondary/20 rounded-2xl p-3 text-center">
          <p className="text-secondary text-xs">Medium</p>
          <p className="text-primary font-semibold mt-1">
            {medium}
          </p>
        </div>

        <div className="bg-secondary/20 rounded-2xl p-3 text-center">
          <p className="text-secondary text-xs">Hard</p>
          <p className="text-primary font-semibold mt-1">
            {hard}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default CodingProfileCard;