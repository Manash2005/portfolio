import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// Dead static STATS array removed — replaced by dynamic `dynamicStats` below

const DOTS = [
  { x: "8%",  y: "20%" }, { x: "91%", y: "13%" },
  { x: "5%",  y: "70%" }, { x: "93%", y: "74%" },
  { x: "47%", y: "7%"  }, { x: "21%", y: "88%" },
  { x: "76%", y: "83%" }, { x: "17%", y: "44%" },
  { x: "83%", y: "41%" }, { x: "33%", y: "5%"  },
  { x: "63%", y: "9%"  }, { x: "3%",  y: "45%" },
];

const CORNERS = [
  { top: 20, left: 20,   borderWidth: "2px 0 0 2px" },
  { top: 20, right: 20,  borderWidth: "2px 2px 0 0" },
  { bottom: 20, left: 20,  borderWidth: "0 0 2px 2px" },
  { bottom: 20, right: 20, borderWidth: "0 2px 2px 0" },
];

const statInitial = {
  left:   { x: "-20vw", y: "0vh" },
  right:  { x: "20vw",  y: "0vh" },
  bottom: { x: "0vw",   y: "20vh" },
};

function StatItem({ value, label, direction, delay, shouldReduceMotion }) {
  const { x, y } = statInitial[direction];

  const posStyle = {
    left: {
      position: "absolute",
      left: "clamp(24px, 5vw, 80px)",
      top: "30vh",
      transform: "translateY(-50%)",
    },
    right: {
      position: "absolute",
      right: "clamp(24px, 5vw, 80px)",
      top: "70vh",
      transform: "translateY(-50%)",
    },
    bottom: {
      position: "absolute",
      bottom: "clamp(48px, 8vh, 110px)",
      left: "50%",
      transform: "translateX(-50%)",
    },
  }[direction];

  return (
    <motion.div
      style={posStyle}
      initial={shouldReduceMotion ? { opacity: 0 } : { x: x ?? 0, y: y ?? 0, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={
        shouldReduceMotion
          ? { duration: 0.2, delay: delay * 0.3 }
          : { duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }
      }
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
          textTransform: "uppercase", color: "rgba(255,255,255,0.55)",
          marginTop: "6px", maxWidth: "90px", fontFamily: "Inter, sans-serif",
        }}>
          {label}
        </span>
        <div style={{ width: "28px", height: "1px", background: "rgba(194,61,41,0.35)", marginTop: "8px" }} />
      </div>
    </motion.div>
  );
}

function Intro({ onComplete, stats }) {
  const [phase, setPhase] = useState("enter");
  const shouldReduceMotion = useReducedMotion();

  const dynamicStats = [
    { value: `${stats?.leetcode?.total || 95}`,  label: "LeetCode Problems", direction: "left"   },
    { value: `${stats?.gfg?.total || 174}`,       label: "GFG Problems",      direction: "right"  },
    { value: `${stats?.projectsCount || 4}`,      label: "Projects Built",    direction: "bottom" },
  ];

  // Cut from 4.8s → 2.5s total. prefers-reduced-motion exits even faster.
  useEffect(() => {
    const totalDuration = shouldReduceMotion ? 800 : 2500;
    const exitDelay = totalDuration - 400;
    const t1 = setTimeout(() => setPhase("exit"), exitDelay);
    const t2 = setTimeout(() => onComplete(), totalDuration);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete, shouldReduceMotion]);

  const skip = () => {
    setPhase("exit");
    setTimeout(() => onComplete(), 350);
  };

  return (
    <motion.section
      className="fixed inset-0 z-10 overflow-hidden"
      style={{ background: "#010011" }}
      animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
      transition={phase === "exit" ? { duration: 0.35, ease: "easeInOut" } : {}}
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
        transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.1 }}
      />

      {/* Scan line — skipped when prefers-reduced-motion */}
      {!shouldReduceMotion && (
        <motion.div
          className="absolute left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(194,61,41,0.7), transparent)" }}
          initial={{ top: "-2px" }}
          animate={{ top: "102%" }}
          transition={{ duration: 1.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        />
      )}

      {/* Corner accents */}
      {CORNERS.map((style, i) => (
        <motion.div
          key={i}
          className="absolute w-6 h-6"
          style={{ ...style, borderColor: "#C23D29", borderStyle: "solid" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: shouldReduceMotion ? 0.1 : 0.5 + i * 0.05 }}
        />
      ))}

      {/* Ambient dots */}
      {!shouldReduceMotion && DOTS.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ left: pos.x, top: pos.y, width: 3, height: 3, background: "#C23D29" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.6 + i * 0.06, ease: "backOut" }}
        />
      ))}

      {/* H-rule behind name */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{ translateX: "-50%", translateY: "-50%", height: "1px", background: "rgba(194,61,41,0.18)" }}
        initial={{ width: 0 }}
        animate={{ width: "min(300px, 55vw)" }}
        transition={{ duration: shouldReduceMotion ? 0.2 : 0.8, delay: shouldReduceMotion ? 0.1 : 0.6, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <motion.p
          style={{ fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(194,61,41,0.85)", fontFamily: "Inter, sans-serif" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: shouldReduceMotion ? 0.1 : 0.6 }}
        >
          Full-Stack & AI Automation Engineer
        </motion.p>

        <div style={{ overflow: "hidden", margin: "10px 0 6px" }}>
          <motion.h1
            style={{ fontSize: "clamp(40px, 8vw, 64px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1, fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: "6px" }}
            initial={{ y: shouldReduceMotion ? 0 : "105%", opacity: shouldReduceMotion ? 0 : 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: shouldReduceMotion ? 0.3 : 0.65, delay: shouldReduceMotion ? 0.15 : 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            Hi, I&apos;m <span style={{ color: "#C23D29" }}>Manash</span>
            {!shouldReduceMotion && (
              <motion.span
                style={{ display: "inline-block", width: "3px", height: "0.82em", background: "#C23D29", verticalAlign: "middle" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0, 1, 1, 0, 0] }}
                transition={{ duration: 1.5, delay: 0.8, times: [0, .08, .45, .55, .63, .88, .95, 1] }}
              />
            )}
          </motion.h1>
        </div>

        <div style={{ overflow: "hidden" }}>
          <motion.p
            style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", fontFamily: "Inter, sans-serif" }}
            initial={{ y: shouldReduceMotion ? 0 : "105%", opacity: shouldReduceMotion ? 0 : 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: shouldReduceMotion ? 0.3 : 0.65, delay: shouldReduceMotion ? 0.2 : 0.95, ease: [0.16, 1, 0.3, 1] }}
          >
            Building ideas into reality
          </motion.p>
        </div>
      </div>

      {/* Stats */}
      {dynamicStats.map((stat, i) => (
        <StatItem
          key={stat.label}
          value={stat.value}
          label={stat.label}
          direction={stat.direction}
          delay={shouldReduceMotion ? 0.2 + i * 0.05 : 1.3 + i * 0.3}
          shouldReduceMotion={shouldReduceMotion}
        />
      ))}

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: shouldReduceMotion ? 0.1 : 1.0 }}
        onClick={skip}
        className="absolute bottom-6 right-6 font-mono text-[11px] text-white/40 hover:text-white/80 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors duration-200 select-none backdrop-blur-sm"
        aria-label="Skip intro animation"
      >
        skip →
      </motion.button>
    </motion.section>
  );
}

export default Intro;