import { motion } from "motion/react";
import { useEffect, useState } from "react";

function Navbar() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Ignore tiny scroll movements
      if (Math.abs(currentScrollY - lastScrollY) < 10) return;

      if (currentScrollY < 50) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // scrolling down
        setVisible(false);
      } else {
        // scrolling up
        setVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToHome = () => {
    document
      .getElementById("hero")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSkills = () => {
    document
      .getElementById("skills")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToProjects = () => {
    document
      .getElementById("projects")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.div
      animate={{
        y: visible ? 0 : -100,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="sticky top-0 z-50 font-mono"
    >
      <div className="relative">
        {/* Orange Glow */}
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
        />

        <nav
          className="
            w-full
            bg-black/50
            backdrop-blur-md
            border-b
            border-white/10
            flex
            items-center
            justify-center
            rounded-b-3xl
            hover:shadow-2xl
            hover:shadow-foreground/30
            transition-all
            duration-500
            p-1
            md:p-2
          "
        >
          <motion.ul className="px-1 md:px-2 text-[10px] md:text-sm">
            <motion.li
              whileTap={{ scale: 0.95 }}
              className="
                inline-block
                py-2
                px-2
                md:px-4
                text-primary
                hover:bg-secondary/10
                transition-colors
                duration-300
                cursor-pointer
                rounded-md
              "
              onClick={scrollToHome}
            >
              Home
            </motion.li>

            <motion.li
              whileTap={{ scale: 0.95 }}
              className="
                inline-block
                py-2
                px-2
                md:px-4
                text-primary
                hover:bg-secondary/10
                transition-colors
                duration-300
                cursor-pointer
                rounded-md
              "
              onClick={scrollToSkills}
            >
              Skills
            </motion.li>

            <motion.li
              whileTap={{ scale: 0.95 }}
              className="
                inline-block
                py-2
                px-2
                md:px-4
                text-primary
                hover:bg-secondary/10
                transition-colors
                duration-300
                cursor-pointer
                rounded-md
              "
              onClick={scrollToProjects}
            >
              Projects
            </motion.li>

            <motion.li
              whileTap={{ scale: 0.95 }}
              className="
                inline-block
                py-2
                px-2
                md:px-4
                text-gray-400
                cursor-not-allowed
                rounded-md
              "
            >
              Contact Me
            </motion.li>
          </motion.ul>
        </nav>
      </div>
    </motion.div>
  );
}

export default Navbar;