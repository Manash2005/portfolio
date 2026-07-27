import { motion } from "motion/react";
import CodingProfileCard from "../components/CodingProfileCard";
import GridBg from "../utils/GridBg";
import FloatingParticles from "../utils/FloatingParticles";
import { useEffect, useState } from "react";
import LeetCodeHeatmap from "../components/LeetCodeHeatmap";
import {
  SiCplusplus,
  SiMongodb,
  SiExpress,
  SiTailwindcss,
  SiPython,
  SiNextdotjs,
  SiNumpy,
  SiPandas,
} from "react-icons/si";
import {
  FaReact,
  FaNodeJs,
  FaJsSquare,
  FaGitAlt,
  FaDatabase,
  FaHtml5,
  FaCss3Alt,
  FaTerminal,
  FaGithub,
} from "react-icons/fa";
import { Brain, Cpu, ExternalLink, Code2, Trophy, BarChart3, LineChart } from "lucide-react";

function Skills({ stats }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [heatmapLoading, setHeatmapLoading] = useState(true);
  const [githubHeatmapData, setGithubHeatmapData] = useState([]);
  const [githubHeatmapLoading, setGithubHeatmapLoading] = useState(true);

  const totalProblems =
    (stats?.leetcode?.total || 95) +
    (stats?.gfg?.total || 174);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "https://portfolio-c43c.onrender.com";
        const response = await fetch(`${apiUrl}/api/v1/coding-activity`);
        if (!response.ok) {
          throw new Error("Failed to fetch heatmap data");
        }
        const data = await response.json();
        setHeatmapData(data.heatmapData || []);
      } catch (error) {
        console.error("Heatmap fetch error:", error);
      } finally {
        setHeatmapLoading(false);
      }
    };

    const fetchGithubHeatmap = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "https://portfolio-c43c.onrender.com";
        const response = await fetch(`${apiUrl}/api/v1/coding-activity/github-heatmap/Manash2005`);
        if (!response.ok) {
          throw new Error("Failed to fetch github heatmap data");
        }
        const data = await response.json();
        setGithubHeatmapData(data.heatmapData || []);
      } catch (error) {
        console.error("Github heatmap fetch error:", error);
      } finally {
        setGithubHeatmapLoading(false);
      }
    };

    fetchHeatmap();
    fetchGithubHeatmap();
  }, []);

  const SKILLS_DATA = [
    {
      category: "Languages",
      skills: [
        { name: "C++", level: "Advanced", icon: <SiCplusplus className="text-[#00599C] w-5 h-5" /> },
        { name: "JavaScript", level: "Advanced", icon: <FaJsSquare className="text-[#F7DF1E] w-5 h-5" /> },
        { name: "Python", level: "Intermediate", icon: <SiPython className="text-[#3776AB] w-5 h-5" /> },
        { name: "SQL", level: "Intermediate", icon: <FaDatabase className="text-[#00758F] w-5 h-5" /> },
      ],
    },
    {
      category: "Frontend",
      skills: [
        { name: "React", level: "Advanced", icon: <FaReact className="text-[#61DAFB] w-5 h-5" /> },
        { name: "Next.js", level: "Intermediate", icon: <SiNextdotjs className="text-white w-5 h-5" /> },
        { name: "TailwindCSS", level: "Advanced", icon: <SiTailwindcss className="text-[#06B6D4] w-5 h-5" /> },
        {
          name: "HTML5 & CSS3",
          level: "Expert",
          icon: (
            <div className="flex gap-0.5">
              <FaHtml5 className="text-[#E34F26] w-4 h-4" />
              <FaCss3Alt className="text-[#1572B6] w-4 h-4" />
            </div>
          ),
        },
      ],
    },
    {
      category: "Backend & Databases",
      skills: [
        { name: "Node.js", level: "Advanced", icon: <FaNodeJs className="text-[#339933] w-5 h-5" /> },
        { name: "Express.js", level: "Advanced", icon: <SiExpress className="text-white w-5 h-5" /> },
        { name: "MongoDB", level: "Intermediate", icon: <SiMongodb className="text-[#47A248] w-5 h-5" /> },
        { name: "REST APIs", level: "Advanced", icon: <FaTerminal className="text-secondary w-5 h-5" /> },
      ],
    },
    {
      category: "CS & Tools",
      skills: [
        { name: "Data Structures", level: "Advanced", icon: <Brain className="text-[#A07CFE] w-5 h-5" /> },
        { name: "Algorithms", level: "Advanced", icon: <Cpu className="text-[#00C2FF] w-5 h-5" /> },
        { name: "Git & GitHub", level: "Advanced", icon: <FaGitAlt className="text-[#F05032] w-5 h-5" /> },
      ],
    },
    {
      category: "Data Science & Analytics",
      skills: [
        { name: "Pandas", level: "Advanced", icon: <SiPandas className="text-[#150458] w-5 h-5" /> },
        { name: "NumPy", level: "Advanced", icon: <SiNumpy className="text-[#013243] w-5 h-5" /> },
        { name: "Matplotlib", level: "Intermediate", icon: <LineChart className="text-foreground w-5 h-5" /> },
        { name: "Seaborn", level: "Intermediate", icon: <BarChart3 className="text-[#4C72B0] w-5 h-5" /> },
      ],
    },
  ];

  return (
    <section id="skills" className="relative min-h-screen overflow-hidden pt-20 md:pt-28 pb-16 w-full">
      {/* GRID BACKGROUND */}
      <GridBg />

      {/* Floating Particles */}
      <FloatingParticles />

      {/* Glow */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-foreground/10 blur-3xl pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-full px-4 py-1.5 w-fit text-xs font-mono text-secondary mb-4 mx-auto backdrop-blur-sm shadow-inner">
            <Cpu className="h-3.5 w-3.5 text-foreground animate-pulse" />
            Skills & Consistency
          </div>
          <h2 className="text-white text-4xl md:text-5xl font-extrabold tracking-tight">
            Developer Dashboard
          </h2>
          <p className="text-secondary text-sm md:text-base mt-3 max-w-lg mx-auto">
            My core technical toolset alongside live stats showing problem solving consistency.
          </p>
        </motion.div>

        {/* Row 1: Tech Stack & Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-12">
          {/* Left Column: Tech Stack (7 cols) */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h3 className="text-lg font-bold font-mono text-primary flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-foreground" />
                  Technical Expertise
                </h3>
                <span className="text-xs text-secondary font-mono">Tools of the trade</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SKILLS_DATA.map((cat, idx) => (
                  <motion.div
                    key={cat.category}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className={`border border-white/5 bg-neutral-950/20 backdrop-blur-md rounded-2xl p-5 hover:border-foreground/30 hover:bg-neutral-950/40 transition-all duration-300 shadow-sm ${idx === 4 ? "md:col-span-2" : ""}`}
                  >
                    <h4 className="text-white font-mono text-xs uppercase tracking-wider border-b border-white/5 pb-2.5 mb-3.5 font-bold">
                      {cat.category}
                    </h4>
                    <div className="space-y-3.5">
                      {cat.skills.map((skill) => (
                        <div key={skill.name} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-foreground/10 group-hover:border-foreground/30 transition-all duration-300 flex items-center justify-center">
                              {skill.icon}
                            </div>
                            <span className="text-white/85 text-xs md:text-sm font-medium group-hover:text-white transition-colors duration-150">
                              {skill.name}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-secondary border border-white/5 bg-neutral-950/60 px-2.5 py-0.5 rounded-full">
                            {skill.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Total Solved Gauge (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full">
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <h3 className="text-lg font-bold font-mono text-primary flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-foreground" />
                    Coding Stats
                  </h3>
                  <span className="text-xs text-secondary font-mono">Live Overview</span>
                </div>

                {/* Total Problems Gauge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="relative overflow-hidden border border-white/10 bg-neutral-950/40 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(194,61,41,0.02)] min-h-[220px]"
                >
                  <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-foreground/10 blur-2xl pointer-events-none" />
                  <div className="absolute -left-16 -bottom-16 w-32 h-32 rounded-full bg-foreground/10 blur-2xl pointer-events-none" />

                  <p className="text-secondary text-[10px] font-mono uppercase tracking-widest mb-1.5">
                    Total Solved Problems
                  </p>

                  <div className="relative flex items-center justify-center my-3">
                    <div className="w-24 h-24 rounded-full border border-dashed border-foreground/30 animate-[spin_40s_linear_infinite] absolute" />
                    <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center bg-black/40 backdrop-blur-md">
                      <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                        {totalProblems}
                      </span>
                    </div>
                  </div>

                  <p className="text-white/60 text-[11px] font-mono max-w-xs mt-1 leading-relaxed">
                    Solutions verified across LeetCode and GeeksforGeeks.
                  </p>
                </motion.div>
              </div>

              {/* Extra Stats Cards */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="border border-white/10 bg-neutral-950/40 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden"
                >
                  <div className="absolute -right-10 -top-10 w-20 h-20 rounded-full bg-foreground/5 blur-xl pointer-events-none" />
                  <Code2 className="w-5 h-5 text-foreground/85 mb-2" />
                  <p className="text-secondary text-[9px] font-mono uppercase tracking-wider">
                    Projects Built
                  </p>
                  <h4 className="text-2xl font-bold text-white font-mono mt-1">
                    {stats?.projectsCount || 4}
                  </h4>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="border border-white/10 bg-neutral-950/40 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden"
                >
                  <div className="absolute -right-10 -top-10 w-20 h-20 rounded-full bg-foreground/5 blur-xl pointer-events-none" />
                  <FaGithub className="w-5 h-5 text-foreground/85 mb-2" />
                  <p className="text-secondary text-[9px] font-mono uppercase tracking-wider">
                    GitHub Contributions
                  </p>
                  <h4 className="text-2xl font-bold text-white font-mono mt-1">
                    {githubHeatmapLoading ? (
                      <span className="text-sm font-normal text-white/40 animate-pulse">Loading...</span>
                    ) : (
                      githubHeatmapData.reduce((acc, curr) => acc + curr.count, 0)
                    )}
                  </h4>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Coding Profiles Cards (Full Width) */}
        <div className="mb-12">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-6">
            <h3 className="text-lg font-bold font-mono text-primary flex items-center gap-2">
              <Trophy className="w-5 h-5 text-foreground" />
              Verified Profiles
            </h3>
            <span className="text-xs text-secondary font-mono">Platform breakdowns</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CodingProfileCard
              logo="/leetcode.png"
              platform="LeetCode"
              easy={stats?.leetcode?.easy || 47}
              medium={stats?.leetcode?.medium || 42}
              hard={stats?.leetcode?.hard || 6}
              profileUrl="https://leetcode.com/u/Manash_22/"
            />

            <CodingProfileCard
              logo="/gfg.png"
              platform="GeeksforGeeks"
              easy={stats?.gfg?.easy || 122}
              medium={stats?.gfg?.medium || 50}
              hard={stats?.gfg?.hard || 2}
              profileUrl="https://www.geeksforgeeks.org/profile/swainlfei"
            />
          </div>
        </div>

        {/* Bottom Section: Coding consistency & heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-14"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-3 mb-6">
            <div>
              <h3 className="text-lg font-bold font-mono text-primary">
                Coding Consistency
              </h3>
              <p className="text-xs text-secondary mt-1">
                Aggregated activity submissions over the past year (LeetCode + GFG)
              </p>
            </div>

            {/* Quick Profile Links */}
            <div className="flex gap-3 mt-4 md:mt-0">
              <a
                href="https://leetcode.com/u/Manash_22/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-neutral-950/40 px-3.5 py-1.5 text-xs text-secondary font-mono hover:text-white hover:border-[#FFA116]/50 hover:bg-[#FFA116]/5 transition-all"
              >
                LeetCode Profile
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.geeksforgeeks.org/profile/swainlfei"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-neutral-950/40 px-3.5 py-1.5 text-xs text-secondary font-mono hover:text-white hover:border-[#2F8D46]/50 hover:bg-[#2F8D46]/5 transition-all"
              >
                GFG Profile
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {heatmapLoading ? (
            <div className="border border-white/5 bg-neutral-950/20 backdrop-blur-md rounded-2xl p-8 flex items-center justify-center min-h-[200px]">
              <p className="text-center text-white/50 font-mono text-sm animate-pulse">
                Synchronizing coding consistency calendar...
              </p>
            </div>
          ) : (
            <LeetCodeHeatmap data={heatmapData} />
          )}
        </motion.div>

        {/* GitHub Contributions Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-14"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-3 mb-6">
            <div>
              <h3 className="text-lg font-bold font-mono text-primary">
                GitHub Contributions
              </h3>
              <p className="text-xs text-secondary mt-1">
                Open source contributions and repository activity calendar
              </p>
            </div>

            <a
              href="https://github.com/Manash2005"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-neutral-950/40 px-3.5 py-1.5 text-xs text-secondary font-mono hover:text-white hover:border-white/30 hover:bg-white/5 transition-all mt-4 md:mt-0"
            >
              GitHub Profile
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {githubHeatmapLoading ? (
            <div className="border border-white/5 bg-neutral-950/20 backdrop-blur-md rounded-2xl p-8 flex items-center justify-center min-h-[200px]">
              <p className="text-center text-white/50 font-mono text-sm animate-pulse">
                Synchronizing GitHub activity calendar...
              </p>
            </div>
          ) : (
            <LeetCodeHeatmap data={githubHeatmapData} type="github" />
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default Skills;