import { motion } from 'motion/react'

function SocialMediaCard({ href, icon, name }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      whileHover="hover"
      initial="rest"
      animate="rest"
      variants={{ rest: { y: 0 }, hover: { y: -4 } }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md text-white/80 px-4 py-3 rounded-xl hover:bg-[#C23D29]/10 hover:border-[#C23D29]/40 hover:text-white hover:shadow-[0_0_20px_rgba(194,61,41,0.25)] transition-colors duration-200"
    >
      <span className="text-xl flex items-center justify-center">{icon}</span>

      <motion.div
        variants={{
          rest:  { opacity: 0, width: 0, x: -8 },
          hover: { opacity: 1, width: "auto", x: 0 },
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="overflow-hidden ml-2 font-mono text-xs font-medium"
      >
        <span>{name}</span>
      </motion.div>
    </motion.a>
  )
}

export default SocialMediaCard;