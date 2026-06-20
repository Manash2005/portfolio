import { motion } from "motion/react";
import CodingProfileCard from "../components/CodingProfileCard";

function Skills() {

  const problemCount= {
    leetcodeDSA : {
      easy : 45,
      medium : 42,
      hard : 6
    },
    gfgDSA : {
      easy : 122,
      medium : 50,
      hard : 2
    },
    leetcodeSQL : {
      easy : 25,
      medium : 1,
      hard : 0
    },
    dataVidhya : {
      easy : 1,
      medium : 0,
      hard : 0
    }
  }

  const totalProblems = Object.values(problemCount).reduce(
    (total, platform) =>
      total +
      Object.values(platform).reduce((sum, count) => sum + count, 0),
    0
  );
  return (
    <section className="relative min-h-screen overflow-hidden pt-20 w-full">

      {/* Glow */}
      <motion.div 
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-foreground/40 blur-3xl" />

      <div className="relative z-10 w-full px-6">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center "
        >
          <h2 className="text-primary font-mono 2xl:text-5xl md:text-4xl font-bold mt-3">
            Coding Profiles
          </h2>
        </motion.div>

        {/* Coding Profiles */}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-row justify-between mt-20 md:px-2 2xl:px-15"
        >
          <div className="min-w-sm m-2 p-2 w-auto">
            <p className="text-center text-amber-200 font-mono">DSA Problems</p>
            <CodingProfileCard
              logo="/leetcode.png"
              platform="LeetCode"
              easy={problemCount.leetcodeDSA.easy}
              medium={problemCount.leetcodeDSA.medium}
              hard={problemCount.leetcodeDSA.hard}
              />

  
            <CodingProfileCard
              logo="/gfg.png"
              platform="GeeksforGeeks"
              easy={problemCount.gfgDSA.easy}
              medium={problemCount.gfgDSA.medium}
              hard={problemCount.gfgDSA.hard}
              />
          </div>

          <div className="flex justify-center items-center">
            <div>
            <p className="text-center font-bold md:text-7xl 2xl:text-9xl text-foreground mb-40">{totalProblems}</p>
            </div>
          </div>

          <div className="min-w-sm m-2 p-2">
            <p className="text-center text-amber-200 font-mono">SQL Problems</p>
            <CodingProfileCard
              logo="/leetcode.png"
              platform="LeetCode"
              easy={problemCount.leetcodeSQL.easy}
              medium={problemCount.leetcodeSQL.medium}
              hard={problemCount.leetcodeSQL.hard}
              />

  
            <CodingProfileCard
              logo="/dataVidhya.png"
              platform="DataVidhya"
              easy={problemCount.dataVidhya.easy}
              medium={problemCount.dataVidhya.medium}
              hard={problemCount.dataVidhya.hard}
              />
          </div>
        </motion.div>

      </div>
    </section>
  );
}

export default Skills;