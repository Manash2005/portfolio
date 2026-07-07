import { motion } from 'motion/react'

function SocialMediaCard(props) {
  return (
    <div>
      <motion.a 
        variants={{
          rest: {
            y: 0,
          },
          hover: {
            y: -4,
          },
        }}
        initial="rest"
        animate="rest"
        whileHover="hover"
        href={props.href} 
        target="_blank" 
        className="flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md text-white/80 px-4 py-3 rounded-xl mx-2 hover:bg-[#C23D29]/10 hover:border-[#C23D29]/40 hover:text-white hover:shadow-[0_0_20px_rgba(194,61,41,0.25)] transition-all duration-300 cursor-pointer"
      >
        <span className="text-xl flex items-center justify-center">{props.icon}</span>

        <motion.div
          variants={{
            rest: {
              opacity: 0,
              width: 0,
              x: -10,
            },
            hover: {
              opacity: 1,
              width: "auto",
              x: 0,
            },
          }}
          transition={{
            duration: 0.35,
            ease: "easeOut",
          }}
          className="overflow-hidden ml-2 font-mono text-xs font-medium"
        >
          <p>{props.name}</p>
        </motion.div>
      </motion.a>
    </div>
  )
}

export default SocialMediaCard;