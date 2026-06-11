import {motion} from "motion/react"
function Navbar() {
  return (
    
    <div className="relative">

    <div
    className="
      absolute
      left-1/2
      top-1/2

      -translate-x-1/2
      -translate-y-1/2

      w-[250px]
      h-[80px]

      rounded-full

      bg-orange-600/65

      blur-3xl

      -z-10
    "
    ></div>

    <nav className="bg-black/50 flex items-center justify-center font-sans rounded-b-3xl hover:shadow-2xl hover:shadow-foreground/40  transition-all duration-600 p-2">
      <motion.ul className="px-2">
        <motion.li 
        whileTap={{scale: 1.1, transition: 0.4}}
        className="inline-block py-2 px-4 text-primary text-sm font-medium hover:bg-secondary/10 transition-colors duration-300 cursor-pointer rounded-md">Home</motion.li>
       
        <motion.li 
        whileTap={{scale: 1.1, transition: 0.4}}
        className="inline-block py-2 px-4 text-gray-400 text-sm font-medium  transition-colors duration-300 cursor-not-allowed rounded-md">About</motion.li>
       
        <motion.li 
        whileTap={{scale: 1.1, transition: 0.4}}
        className="inline-block py-2 px-4 text-gray-400 text-sm font-medium transition-colors duration-300 cursor-not-allowed rounded-md">Projects</motion.li>
       
        <motion.li 
        whileTap={{scale: 1.1, transition: 0.4}}
        className="inline-block py-2 px-4 text-gray-400 text-sm font-medium transition-colors duration-300 cursor-not-allowed rounded-md">Contact Me</motion.li>
       
      </motion.ul>
    </nav>

    </div>
  )
}

export default Navbar