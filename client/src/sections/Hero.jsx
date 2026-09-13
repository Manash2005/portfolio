import StatCard from "../components/StatCard";
import { Download } from "lucide-react";
import SocialMediaCard from "../components/SocialMediaCard";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { SiGmail } from "react-icons/si";
import EducationCard from "../components/EducationCard";
import { motion } from "motion/react";
import { TypeAnimation } from "react-type-animation";
import NoiseBg from "../utils/NoiseBg";
import GridBg from "../utils/GridBg";
import ScrambleText from "../components/ScrambleText";
import portfolioData from "../data/portfolio_data.json";

function Hero({ stats }) {
  const handleResume = () => {
    window.open(portfolioData.contact.resume_url, "_blank");
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
      <GridBg />

      {/* FLOATING PARTICLES */}
      <NoiseBg />

      {/* HERO CONTENT */}
      <div className="relative z-10 px-2 lg:px-8">
        <div className="block md:flex border-b-[0.1px] justify-center">

          {/* LEFT COLUMN */}
          <div className="flex flex-col justify-center w-full md:w-[55%] lg:w-[50%] mt-0 min-h-screen py-16 md:py-24 pr-4 md:pr-8 gap-2 md:gap-6">
            {/* GREETING */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 border border-foreground/30 bg-foreground/5 rounded-full px-3.5 py-1.5 w-fit text-xs font-mono text-foreground backdrop-blur-sm shadow-inner select-none hover:bg-foreground/15 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-ping" />
                Open to work
              </a>
            </motion.div>

            {/* ROLE */}
            <motion.div
              className="text-4xl md:text-6xl font-mono text-white/90 font-medium h-[120px] md:h-[140px]"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              viewport={{ once: true }}
            >
              <span className=" font-bold" style={{ color: '#ADFF2F' }}>
                <TypeAnimation
                  sequence={[
                    "AI Workflow",
                    2000,
                    "Backend",
                    2000,
                    "Full Stack",
                    2000,
                  ]}
                  speed={50}
                  deletionSpeed={70}
                  repeat={Infinity}
                />
              </span><br />
              Engineer
            </motion.div>

            {/* DESCRIPTION */}
            <motion.div
              className="text-white/60 text-base md:text-lg leading-relaxed max-w-xl"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              viewport={{ once: true }}
            >
              <p className="mb-2 font-mono text-sm text-foreground/80">{portfolioData.personal.taglines[0]}</p>
              <p>{portfolioData.personal.taglines[1]}</p>
            </motion.div>

            {/* ACTIONS & SOCIALS */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row sm:items-center gap-6 mt-4 w-full"
            >
              {/* RESUME BUTTON */}
              <motion.button
                whileHover="hover"
                whileTap={{ scale: 0.97 }}
                variants={{
                  rest: { y: 0 },
                  hover: { y: -5 },
                }}
                initial="rest"
                animate="rest"
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="
                  flex items-center
                  bg-foreground/10
                  border border-foreground/30
                  backdrop-blur-md
                  text-foreground
                  shadow-[0_0_20px_rgba(194,61,41,0.15)]
                  hover:shadow-[0_0_30px_rgba(194,61,41,0.35)]
                  px-5
                  py-3.5
                  rounded-xl
                  w-fit
                  overflow-hidden
                  hover:bg-foreground
                  hover:text-black
                  transition-all
                  duration-300
                  cursor-pointer
                  font-mono
                  text-sm
                  font-semibold
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
                    duration: 0.35,
                    ease: "easeOut",
                  }}
                  className="overflow-hidden ml-3"
                >
                  <Download size={18} />
                </motion.div>
              </motion.button>

              {/* SOCIALS */}
              <div className="flex items-center gap-2 select-none">
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
            </motion.div>

            {/* STATS */}
            <motion.div
              className="grid grid-cols-3 gap-4 mt-6 w-full max-w-xl"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              viewport={{ once: true }}
            >
              <StatCard
                value={stats?.leetcode?.total ? `${stats.leetcode.total}` : "95"}
                description="LeetCode"
              />

              <StatCard
                value={stats?.gfg?.total ? `${stats.gfg.total}` : "174"}
                description="GFG Solves"
              />

              <StatCard
                value={stats?.projectsCount ? `${stats.projectsCount}` : "4"}
                description="Projects"
              />
            </motion.div>

            {/* EDUCATION */}
            <motion.div
              className="mt-6 w-full max-w-xl"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55 }}
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
            className="hidden md:flex items-end justify-end  w-full md:w-1/2 mt-10 md:mt-0 pointer-events-none select-none"
          >
            <img
              src="/heroImage.png"
              alt="Manash Swain — Full-Stack & AI Engineer"
              width={600}
              height={600}
              loading="eager"
              decoding="async"
              className="h-full max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default Hero;
