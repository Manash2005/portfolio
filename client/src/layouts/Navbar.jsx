import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const [visible, setVisible] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isProjectsPage = location.pathname === "/projects";

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY) < 10) return;

      if (currentScrollY < 50) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    if (isProjectsPage) {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navItems = [
    { label: "Home", id: "hero" },
    { label: "Skills", id: "skills" },
    { label: "About", id: "about" },
    { label: "Projects", id: "projects" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <motion.div
      animate={{ y: visible ? 0 : -100 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="sticky top-0 z-50 font-mono"
    >
      <div className="relative">
        {/* Orange Glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[80px] rounded-full bg-orange-600/65 blur-3xl -z-10" />

        <nav className="w-full bg-black/50 backdrop-blur-md border-b border-white/10 flex items-center justify-between rounded-b-3xl hover:shadow-2xl hover:shadow-foreground/30 transition-all duration-500 p-1 md:p-2 px-4">
          {/* Logo */}
          <Link to="/" className="text-foreground font-bold font-mono text-sm tracking-widest hover:opacity-80 transition-opacity">
            MS.
          </Link>

          {/* Nav Items */}
          <ul className="px-1 md:px-2 text-[10px] md:text-sm">
            {navItems.map((item) => (
              <motion.li
                key={item.id}
                whileTap={{ scale: 0.95 }}
                className="inline-block py-2 px-2 md:px-4 text-primary hover:bg-secondary/10 transition-colors duration-300 cursor-pointer rounded-md relative group"
                onClick={() => scrollTo(item.id)}
              >
                {item.label}
                {/* Active indicator on projects page */}
                {isProjectsPage && item.label === "Projects" && (
                  <motion.span
                    layoutId="activeNav"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-foreground"
                  />
                )}
              </motion.li>
            ))}
          </ul>

          {/* Resume CTA */}
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-foreground/30 bg-foreground/10 text-foreground text-xs font-mono font-semibold hover:bg-foreground hover:text-black transition-all duration-300"
          >
            Resume ↗
          </a>
        </nav>
      </div>
    </motion.div>
  );
}

export default Navbar;