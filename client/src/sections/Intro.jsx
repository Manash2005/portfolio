import { motion } from "motion/react";
import { useEffect, useState } from "react";

const STATS = [
  { value: "100+", label: "LeetCode Problems", direction: "left"   },
  { value: "170+", label: "GFG Problems",       direction: "right"  },
  { value: "2",    label: "Projects Built",     direction: "bottom" },
];

const DOTS = [
  { x: "8%",  y: "20%" }, { x: "91%", y: "13%" },
  { x: "5%",  y: "70%" }, { x: "93%", y: "74%" },
  { x: "47%", y: "7%"  }, { x: "21%", y: "88%" },
  { x: "76%", y: "83%" }, { x: "17%", y: "44%" },
  { x: "83%", y: "41%" }, { x: "33%", y: "5%"  },
  { x: "63%", y: "9%"  }, { x: "3%",  y: "45%" },
  { x: "96%", y: "50%" }, { x: "12%", y: "82%" },
  { x: "88%", y: "28%" }, { x: "55%", y: "93%" },
  { x: "38%", y: "96%" }, { x: "72%", y: "6%"  },
  { x: "28%", y: "15%" }, { x: "68%", y: "58%" },
  { x: "42%", y: "78%" }, { x: "15%", y: "60%" },
  { x: "85%", y: "62%" }, { x: "52%", y: "18%" },
  { x: "25%", y: "35%" }, { x: "78%", y: "76%" },
  { x: "10%", y: "92%" }, { x: "90%", y: "88%" },
  { x: "60%", y: "42%" }, { x: "35%", y: "55%" },
];

const CORNERS = [
  { top: 20, left: 20,   borderWidth: "2px 0 0 2px" },
  { top: 20, right: 20,  borderWidth: "2px 2px 0 0" },
  { bottom: 20, left: 20,  borderWidth: "0 0 2px 2px" },
  { bottom: 20, right: 20, borderWidth: "0 2px 2px 0" },
];

const statInitial = {
  left: {
    x: "-20vw",
    y: "0vh",
  },

  right: {
    x: "20vw",
    y: "0vh",
  },

  bottom: {
    x: "0vw",
    y: "20vh",
  },
};

function StatItem({ value, label, direction, delay }) {
  const { x, y } = statInitial[direction];

  const posStyle = {
  left: {
    position: "absolute",
    left: "5vw",
    top: "30vh",
    transform: "translateY(-50%)",
  },

  right: {
    position: "absolute",
    right: "5vw",
    top: "70vh",
    transform: "translateY(-50%)",
  },

  bottom: {
    position: "absolute",
    bottom: "5vh",
    left: "25vw",
    transform: "translateX(-50%)",
  },
}[direction];

  return (
    <motion.div
      style={posStyle}
      initial={{ x: x ?? 0, y: y ?? 0, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <span style={{
          fontSize: "clamp(22px, 4vw, 30px)",
          fontWeight: 700, color: "#C23D29",
          lineHeight: 1, fontFamily: "Inter, sans-serif",
        }}>
          {value}
        </span>
        <span style={{
          fontSize: "10px", letterSpacing: "0.18em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.35)",
          marginTop: "6px", maxWidth: "90px", fontFamily: "Inter, sans-serif",
        }}>
          {label}
        </span>
        <div style={{ width: "28px", height: "1px", background: "rgba(194,61,41,0.35)", marginTop: "8px" }} />
      </div>
    </motion.div>
  );
}

function Intro({ onComplete }) {
  const [phase, setPhase] = useState("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("exit"), 4200);
    const t2 = setTimeout(() => onComplete(), 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <motion.section
      className="fixed inset-0 z-10 overflow-hidden"
      style={{ background: "#010011" }}
      animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
      transition={phase === "exit" ? { duration: 0.55, ease: "easeInOut" } : {}}
    >

      {/* Grid */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(194,61,41,0.065) 1px, transparent 1px),
            linear-gradient(90deg, rgba(194,61,41,0.065) 1px, transparent 1px)
          `,
          backgroundSize: "52px 52px",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />

      {/* Scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(194,61,41,0.7), transparent)" }}
        initial={{ top: "-2px" }}
        animate={{ top: "102%" }}
        transition={{ duration: 2.3, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
      />

      {/* Corner accents */}
      {CORNERS.map((style, i) => (
        <motion.div
          key={i}
          className="absolute w-6 h-6"
          style={{ ...style, borderColor: "#C23D29", borderStyle: "solid" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.78 + i * 0.06 }}
        />
      ))}

      {/* Ambient dots */}
      {DOTS.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ left: pos.x, top: pos.y, width: 3, height: 3, background: "#C23D29" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.9 + i * 0.09, ease: "backOut" }}
        />
      ))}

      {/* H-rule behind name */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{ translateX: "-50%", translateY: "-50%", height: "1px", background: "rgba(194,61,41,0.18)" }}
        initial={{ width: 0 }}
        animate={{ width: "min(300px, 55vw)" }}
        transition={{ duration: 0.9, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Guide lines */}
      <motion.div
        className="absolute"
        style={{ left: "clamp(110px, 18vw, 160px)", top: "50%", translateY: "-50%", width: "1px", background: "rgba(194,61,41,0.14)" }}
        initial={{ height: 0 }}
        animate={{ height: "100px" }}
        transition={{ duration: 0.55, delay: 1.75 }}
      />
      <motion.div
        className="absolute"
        style={{ right: "clamp(110px, 18vw, 160px)", top: "38%", translateY: "-50%", width: "1px", background: "rgba(194,61,41,0.14)" }}
        initial={{ height: 0 }}
        animate={{ height: "100px" }}
        transition={{ duration: 0.55, delay: 2.05 }}
      />
      <motion.div
        className="absolute"
        style={{ bottom: "clamp(80px, 12vh, 110px)", left: "50%", translateX: "-50%", height: "1px", background: "rgba(194,61,41,0.14)" }}
        initial={{ width: 0 }}
        animate={{ width: "100px" }}
        transition={{ duration: 0.55, delay: 2.35 }}
      />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">

        <motion.p
          style={{ fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(194,61,41,0.85)", fontFamily: "Inter, sans-serif" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          Full-Stack Developer
        </motion.p>

        <div style={{ overflow: "hidden", margin: "10px 0 6px" }}>
          <motion.h1
            style={{ fontSize: "clamp(40px, 8vw, 64px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1, fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: "6px" }}
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Hi, I&apos;m <span style={{ color: "#C23D29" }}>Manash</span>
            <motion.span
              style={{ display: "inline-block", width: "3px", height: "0.82em", background: "#C23D29", verticalAlign: "middle" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0] }}
              transition={{ duration: 2, delay: 1.22, times: [0, .05, .45, .5, .55, .85, .9, .95, .97, .99, 1] }}
            />
          </motion.h1>
        </div>

        <div style={{ overflow: "hidden" }}>
          <motion.p
            style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", fontFamily: "Inter, sans-serif" }}
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            Building ideas into reality
          </motion.p>
        </div>

      </div>

      {/* Stats */}
      {STATS.map((stat, i) => (
        <StatItem
          key={stat.label}
          value={stat.value}
          label={stat.label}
          direction={stat.direction}
          delay={2.1 + i * 0.38}
        />
      ))}

    </motion.section>
  );
}

export default Intro;