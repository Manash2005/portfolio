import {motion} from 'motion/react'
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
          className={`flex items-center justify-center bg-secondary/10 text-foreground font-mono p-2 rounded-lg hover:rounded-lg mx-3 hover:bg-foreground  hover:text-white hover:scale-102 ps-4 py-4 shadow-lg hover:shadow-foreground transition-all duration-600`}
        >
            <span className="text-2xl">{props.icon}</span>

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
                duration: 0.5,
                ease: "easeOut",
              }}
              className="overflow-hidden ml-2"
              >
                <p>{props.name}</p>
              </motion.div>
        </motion.a>
    </div>
  )
}

export default SocialMediaCard