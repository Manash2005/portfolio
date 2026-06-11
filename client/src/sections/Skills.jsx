import { motion } from "motion/react";
import CodingProfileCard from "../components/CodingProfileCard";

function Skills() {

  return (
    <section className="min-h-screen py-10 w-full">
      <div className="w-full px-6">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center "
        >
          <h2 className="text-primary text-2xl md:text-5xl font-bold mt-3">
            Skills & Coding Profiles
          </h2>
        </motion.div>

        {/* Coding Profiles */}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-col gap-8 mt-20"
        >
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <CodingProfileCard
              logo="/leetcode.png"
              platform="LeetCode"
              totalSolved={128}
              easy={58}
              medium={55}
              hard={15}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <CodingProfileCard
              logo="/gfg.png"
              platform="GeeksforGeeks"
              totalSolved={172}
              easy={75}
              medium={80}
              hard={17}
            />
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}

export default Skills;