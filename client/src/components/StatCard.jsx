import { useEffect, useState } from "react";

function StatCard(props) {
  const [count, setCount] = useState(0);
  const numValue = parseInt(props.value) || 0;
  const suffix = props.value.replace(/[0-9]/g, "");

  useEffect(() => {
    let start = 0;
    const duration = 1000; // 1 second
    const increment = numValue / (duration / 50);

    const timer = setInterval(() => {
      start += increment;
      if (start >= numValue) {
        setCount(numValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 50);

    return () => clearInterval(timer);
  }, [numValue]);

  return (
    <div className="bg-neutral-950/40 border border-white/10 backdrop-blur-md hover:border-foreground/30 p-4 rounded-2xl text-center transition-all duration-300 w-full">
      {props.value && (
        <div className="text-3xl md:text-4xl font-extrabold text-foreground font-mono">
          {count}
          {suffix}
        </div>
      )}
      {props.description && (
        <div className="text-white/60 text-xs md:text-sm mt-1.5 font-mono uppercase tracking-wider">
          {props.description}
        </div>
      )}
    </div>
  );
}

export default StatCard;