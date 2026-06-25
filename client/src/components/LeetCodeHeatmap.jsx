import { useEffect, useMemo, useState } from "react";

function getColorClass(count) {
  if (count === 0) return "bg-white/5";
  if (count <= 2) return "bg-emerald-500/20";
  if (count <= 5) return "bg-emerald-500/40";
  if (count <= 10) return "bg-emerald-500/60";
  if (count <= 20) return "bg-emerald-500/80";
  return "bg-emerald-400";
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

export default function LeetCodeHeatmap({ data = [] }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreen();

    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const submissionMap = useMemo(() => {
    const map = new Map();

    data.forEach((item) => {
      map.set(String(item.date).slice(0, 10), item.count);
    });

    return map;
  }, [data]);

  const cells = useMemo(() => {
    const end = new Date();
    const start = new Date();

    // 6 months on mobile, 1 year on desktop
    const daysToShow = isMobile ? 170 : 365;

    start.setDate(end.getDate() - daysToShow);

    const allDays = [];
    const current = new Date(start);

    while (current <= end) {
      const key = formatDate(current);

      allDays.push({
        date: key,
        count: submissionMap.get(key) || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return allDays;
  }, [submissionMap, isMobile]);

  return (
    <div className="overflow-hidden">
      <div
        className={`mx-auto ${
          isMobile ? "max-w-[450px]" : "max-w-full"
        }`}
      >
        <div className="mb-3 flex items-center justify-between text-xs text-white/50">
          <span>Less</span>

          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm bg-white/5" />
            <span className="h-3 w-3 rounded-sm bg-emerald-500/20" />
            <span className="h-3 w-3 rounded-sm bg-emerald-500/40" />
            <span className="h-3 w-3 rounded-sm bg-emerald-500/60" />
            <span className="h-3 w-3 rounded-sm bg-emerald-400" />
          </div>

          <span>More</span>
        </div>

        <div
          className={`
            grid
            grid-flow-col
            grid-rows-7
            ${isMobile ? "auto-cols-[8px] gap-1" : "auto-cols-[12px] gap-1"}
          `}
        >
          {cells.map((cell) => (
            <div
              key={cell.date}
              title={`
              ${cell.date}

              LeetCode: ${cell.leetcode}
              GFG: ${cell.gfg}

              Total: ${cell.total}
              `}
              className={`
                rounded-sm
                ring-1 ring-white/5
                ${isMobile ? "h-2 w-2" : "h-3 w-3"}
                ${getColorClass(cell.total)}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}