import StatCard from "../components/StatCard"
import {Download} from "lucide-react"
import SocialMediaCard from "../components/SocialMediaCard"
import { FaGithub, FaLinkedin } from "react-icons/fa"
import { SiGmail } from "react-icons/si"
import EducationCard from "../components/EducationCard"
import { motion } from "motion/react";
function Hero() {
  return (
    <motion.section
    initial = {{opacity:0}}
    animate = {{opacity:1}}
    transition={{duration: 0.2}}
    className="bg-background min-h-screen">

        {/* Top section */}
        <div className="block lg:flex border-b-[0.1px]">

            {/* left column */}
            <div className="w-full md:w-1/2 mt-15 md:mt-0">
                <motion.p 
                  className="text-primary text-3xl px-1 font-bold mt-10"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                  viewport={{ once: true }}
                >
                  I am <span className="text-foreground font-mono">Manash</span>
                </motion.p>

                {/* Role */}
                <motion.p 
                  className="text-secondary text-7xl py-2"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  Full-Stack <br /> Developer
                </motion.p>

                {/* Description */}
                <motion.p 
                  className="text-secondary text-lg mt-5"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                    I am a passionate full-stack developer with expertise in building scalable web applications. I enjoy working with modern technologies and continuously learning to enhance my skills.
                </motion.p>

                <div className="block lg:flex justify-between mt-10 mb-4">
                    {/* Download Resume Button */}
                    <motion.div
                    variants={{
                        rest: {
                        y: 0,
                        },

                        hover: {
                        y: -5,
                        },
                    }}
                    initial="rest"
                    animate="rest"
                    whileHover="hover"
                    whileTap={{y:-45}}
                    transition={{duration: 0.3}}
                    className="
                        flex
                        items-center
                        bg-foreground
                        border-secondary/50
                        shadow-lg
                        hover:shadow-2xl
                        shadow-orange-700
                        hover:shadow-hover
                        p-4
                        rounded-2xl
                        w-fit
                        overflow-hidden

                        hover:bg-hover
                        hover:text-black

                        transition-all
                        duration-500

                        cursor-pointer
                    "
                    >

                        <span className="whitespace-nowrap">
                            Download Resume
                        </span>

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
                            className="overflow-hidden ml-4"
                        >
                            <Download size={20} />
                        </motion.div>
                    </motion.div>

                    {/* Socials */}
                    <motion.div 
                      className="flex items-center justify-start lg:justify-center mt-10 lg:mt-0">
                        <SocialMediaCard href="https://github.com/Manash2005" icon={<FaGithub/>} name="Github" />
                        <SocialMediaCard href="https://www.linkedin.com/in/manash-swain" icon={<FaLinkedin />} name="LinkedIn" />
                        <SocialMediaCard href="mailto:swainm099@gmail.com" icon={<SiGmail />} name="Email" />
                    </motion.div>
                </div>

                {/* Stats */}
                <motion.div 
                  className=" lg:flex items-center justify-center  mt-10 gap-5 p-2 "
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                  viewport={{ once: true }}
                >
                    <StatCard value="100+" description="Leetcode Problems" className="mt-5 lg:mt-0"/>
                    <StatCard value="170+" description="GeeksforGeeks Problems" className="mt-5 lg:mt-0" />
                    <StatCard value="2" description="Projects Built" className="mt-5 lg:mt-0" />
                </motion.div>

                {/* Education card */}
                <motion.div 
                  className="block lg:flex justify-between gap-10 mt-10 mb-10"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                    <EducationCard institute="BITS PILANI" logo="/bitsPilaniLogo.png" details={{ degree: "BS in Computer Science", duration: "2024 - 2027" }} />
                    <EducationCard institute="PW IOI" logo="/pwIoiLogo.png" details={{ Program: "Skills Program", duration: "2024 - 2028" }} />
                </motion.div>

            </div>

            {/* right column */}
            <motion.div 
              className="hidden lg:block w-full md:w-1/2 mt-10 md:mt-0 z-10 pointer-events-none select-none"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              viewport={{ once: true }}
            >
                <img src="/heroImage.png" alt="Hero Image" className="h-full object-cover" />
            </motion.div>
        </div>

    </motion.section>
  )
}

export default Hero