import { useEffect, useRef, useState } from "react";

function StatCard({ value, description }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);
  const numValue = parseInt(value) || 0;
  const suffix = value?.replace(/[0-9]/g, "") ?? "";

  // Only start the counter once the card enters the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const duration = 900;
    const increment = numValue / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= numValue) {
        setCount(numValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted, numValue]);

  return (
    <div
      ref={ref}
      className="bg-neutral-950/40 border border-white/10 backdrop-blur-md hover:border-foreground/30 p-4 rounded-2xl text-center transition-all duration-300 w-full"
    >
      {value && (
        <div className="text-3xl md:text-4xl font-extrabold text-foreground font-mono tabular-nums">
          {count}{suffix}
        </div>
      )}
      {description && (
        <div className="text-white/60 text-xs md:text-sm mt-1.5 font-mono uppercase tracking-wider">
          {description}
        </div>
      )}
    </div>
  );
}

export default StatCard;