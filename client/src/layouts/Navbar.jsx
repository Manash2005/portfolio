import {motion} from "motion/react"
function Navbar() {
  return (
    <nav className="bg-secondary/20 flex items-center justify-center font-sans rounded-b-3xl shadow-lg hover:shadow-xl shadow-orange-700 hover:shadow-hover transition-all duration-600">
      <motion.ul className="px-2">
        <motion.li 
        whileTap={{scale: 1.1, transition: 0.4}}
        className="inline-block p-4 text-primary text-sm font-medium hover:bg-secondary/10 transition-colors duration-300 cursor-pointer rounded-md">Home</motion.li>
       
        <motion.li 
        whileTap={{scale: 1.1, transition: 0.4}}
        className="inline-block p-4 text-primary text-sm font-medium hover:bg-secondary/10 transition-colors duration-300 cursor-pointer rounded-md">About</motion.li>
       
        <motion.li 
        whileTap={{scale: 1.1, transition: 0.4}}
        className="inline-block p-4 text-primary text-sm font-medium hover:bg-secondary/10 transition-colors duration-300 cursor-pointer rounded-md">Projects</motion.li>
       
        <motion.li 
        whileTap={{scale: 1.1, transition: 0.4}}
        className="inline-block p-4 text-primary text-sm font-medium hover:bg-secondary/10 transition-colors duration-300 cursor-pointer rounded-md">Contact Me</motion.li>
       
      </motion.ul>
    </nav>
  )
}

export default Navbar