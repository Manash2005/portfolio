/* eslint-disable react-hooks/purity */
import StatCard from "../components/StatCard";
import { Download } from "lucide-react";
import SocialMediaCard from "../components/SocialMediaCard";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { SiGmail } from "react-icons/si";
import EducationCard from "../components/EducationCard";
import { motion } from "motion/react";
import { TypeAnimation } from "react-type-animation";

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-foreground/40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 1, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function Hero() {
  const handleResume = () => {
    window.open("/resume.pdf", "_blank");
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="relative bg-background min-h-screen overflow-hidden"
      id="hero"
    >
      {/* GRID BACKGROUND */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* FLOATING PARTICLES */}
      <FloatingParticles />

      {/* HERO CONTENT */}
      <div className="relative z-10 px-2 lg:px-8">
        <div className="block md:flex border-b-[0.1px] justify-center">

          {/* LEFT COLUMN */}
          <div className="flex flex-col justify-around w-full md:w-1/2 mt-15 md:mt-0 min-h-screen">

            <motion.p
              className="text-primary text-3xl px-1 font-bold md:mt-20 mt-5"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              I am <span className="text-foreground font-mono">Manash</span>
            </motion.p>

            {/* ROLE */}
            <motion.div
              className="text-secondary text-5xl md:text-8xl py-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <TypeAnimation
                sequence={[
                  "Frontend",
                  2000,
                  "Backend",
                  2000,
                  "Full-Stack",
                  2000,
                ]}
                speed={50}
                deletionSpeed={70}
                repeat={Infinity}
              />

              <p>Developer</p>
            </motion.div>

            {/* DESCRIPTION */}
            <motion.p
              className="text-secondary text-lg mt-3 md:mt-5"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              viewport={{ once: true }}
            >
              I love the idea of creating something from nothing but code.
              Since then, I've spent my time building web applications,
              solving DSA problems, and constantly challenging myself to
              learn new technologies.
            </motion.p>

            <div className="block md:flex justify-between mt-10">

              {/* RESUME BUTTON */}
              <motion.button
                variants={{
                  rest: { y: 0 },
                  hover: { y: -5 },
                }}
                initial="rest"
                animate="rest"
                whileHover="hover"
                whileTap={{ y: -45 }}
                transition={{ duration: 0.3 }}
                className="
                  flex items-center
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
                onClick={handleResume}
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
              </motion.button>

              {/* SOCIALS */}
              <div className="flex items-center justify-start md:justify-center mt-10 md:mt-0">
                <SocialMediaCard
                  href="https://github.com/Manash2005"
                  icon={<FaGithub />}
                  name="Github"
                />

                <SocialMediaCard
                  href="https://www.linkedin.com/in/manash-swain"
                  icon={<FaLinkedin />}
                  name="LinkedIn"
                />

                <SocialMediaCard
                  href="mailto:swainm099@gmail.com"
                  icon={<SiGmail />}
                  name="Gmail"
                />
              </div>
            </div>

            {/* STATS */}
            <motion.div
              className="md:flex items-center justify-center mt-10 gap-5 p-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              <StatCard
                value="100+"
                description="Leetcode Problems"
                className="mt-5 md:mt-0"
              />

              <StatCard
                value="170+"
                description="GeeksforGeeks Problems"
                className="mt-5 md:mt-0"
              />

              <StatCard
                value="2"
                description="Projects Built"
                className="mt-5 md:mt-0"
              />
            </motion.div>

            {/* EDUCATION */}
            <motion.div
              className="block md:flex justify-between gap-10 mt-10 mb-10"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <EducationCard
                institute="BITS PILANI"
                logo="/bitsPilaniLogo.png"
                details={{
                  degree: "BS in Computer Science",
                  duration: "2024 - 2027",
                }}
              />
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div
            className="hidden md:block w-full md:w-1/2 mt-10 md:mt-0 pointer-events-none select-none"
          >
            <img
              src="/heroImage.png"
              alt="Hero Image"
              className="h-full object-cover"
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default Hero;
