import { useEffect, useMemo, useState } from "react";
import { Flame, Calendar, Trophy, Zap } from "lucide-react";

function getColorClass(count) {
  if (count === 0) return "bg-white/5 hover:bg-white/15";
  if (count <= 2) return "bg-[#C23D29]/20 hover:bg-[#C23D29]/30";
  if (count <= 5) return "bg-[#C23D29]/45 hover:bg-[#C23D29]/55";
  if (count <= 10) return "bg-[#C23D29]/70 hover:bg-[#C23D29]/80";
  return "bg-[#C23D29] hover:brightness-110";
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

const formatDateFull = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function LeetCodeHeatmap({ data = [], type = "leetcode" }) {
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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
    
    // 6 months (182 days) on mobile, 1 year (364 days to fit weeks perfectly) on desktop
    const daysToShow = isMobile ? 181 : 363;

    // Adjust start date to begin on a Sunday to align grid rows perfectly (Sunday is row 0)
    start.setDate(end.getDate() - daysToShow);
    const dayOfWeek = start.getDay();
    if (dayOfWeek !== 0) {
      start.setDate(start.getDate() - dayOfWeek);
    }

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

  const cellSize = isMobile ? 8 : 12;
  const gapSize = 4; // gap-1 in tailwind is 4px

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;

    for (let i = 0; i < cells.length; i += 7) {
      const date = new Date(cells[i].date);
      const month = date.getMonth();
      const colIndex = Math.floor(i / 7);

      if (month !== lastMonth) {
        labels.push({
          colIndex,
          name: date.toLocaleString("default", { month: "short" }),
        });
        lastMonth = month;
      }
    }
    return labels;
  }, [cells]);

  const stats = useMemo(() => {
    let totalSubmissions = 0;
    let activeDays = 0;
    let maxCount = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    cells.forEach((cell) => {
      totalSubmissions += cell.count;
      if (cell.count > 0) {
        activeDays++;
        if (cell.count > maxCount) maxCount = cell.count;
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    });

    // Calculate current streak
    let streakCount = 0;
    for (let i = cells.length - 1; i >= 0; i--) {
      if (cells[i].count > 0) {
        streakCount++;
      } else {
        // Allow streak to be active if last submissions were yesterday or today
        if (i < cells.length - 2 && streakCount === 0) {
          break;
        }
        if (streakCount > 0) {
          break;
        }
      }
    }
    currentStreak = streakCount;

    return {
      totalSubmissions,
      activeDays,
      maxCount,
      currentStreak,
      longestStreak,
    };
  }, [cells]);

  const handleMouseEnter = (cell, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement.parentElement.getBoundingClientRect();
    setHoveredCell(cell);
    setTooltipPos({
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top - 46,
    });
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  return (
    <div className="w-full">
      {/* Heatmap Section */}
      <div className="relative border border-white/5 bg-neutral-950/20 backdrop-blur-md rounded-2xl p-5 md:p-6">
        <div className="flex flex-row">
          {/* Day of Week Labels */}
          <div className="flex flex-col justify-between text-[10px] text-white/30 font-mono pr-2 select-none h-[108px] md:h-[108px] pt-5">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          {/* Grid and Months */}
          <div className="flex-1 overflow-x-auto scrollbar-thin">
            <div className="min-w-max relative pb-1">
              {/* Months Headers */}
              <div className="relative h-5 text-[10px] text-white/40 font-mono select-none mb-1">
                {monthLabels.map((lbl, idx) => (
                  <span
                    key={idx}
                    className="absolute"
                    style={{
                      left: `${lbl.colIndex * (cellSize + gapSize)}px`,
                    }}
                  >
                    {lbl.name}
                  </span>
                ))}
              </div>

              {/* Grid */}
              <div
                className="grid grid-flow-col grid-rows-7 gap-1"
                style={{
                  gridAutoColumns: `${cellSize}px`,
                }}
              >
                {cells.map((cell) => (
                  <div
                    key={cell.date}
                    onMouseEnter={(e) => handleMouseEnter(cell, e)}
                    onMouseLeave={handleMouseLeave}
                    className={`
                      rounded-[2px]
                      transition-colors duration-150
                      cursor-pointer
                      ${isMobile ? "h-2 w-2" : "h-3 w-3"}
                      ${getColorClass(cell.count)}
                    `}
                  />
                ))}
              </div>

              {/* Floating Tooltip */}
              {hoveredCell && (
                <div
                  className="absolute z-30 pointer-events-none bg-neutral-900 border border-white/10 text-white rounded-lg px-2.5 py-1 text-[11px] font-mono shadow-xl -translate-x-1/2 flex flex-col items-center gap-0.5 whitespace-nowrap"
                  style={{
                    left: `${tooltipPos.x}px`,
                    top: `${tooltipPos.y}px`,
                  }}
                >
                  <span className="font-semibold">
                    {hoveredCell.count > 0
                      ? `${hoveredCell.count} Submissions`
                      : "No Submissions"}
                  </span>
                  <span className="text-white/50 text-[10px]">
                    {formatDateFull(hoveredCell.date)}
                  </span>
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-end text-[10px] text-white/40 font-mono select-none gap-2 border-t border-white/5 pt-3">
          <span>Less</span>
          <div className="flex gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-white/5" />
            <span className="h-2.5 w-2.5 rounded-sm bg-[#C23D29]/20" />
            <span className="h-2.5 w-2.5 rounded-sm bg-[#C23D29]/45" />
            <span className="h-2.5 w-2.5 rounded-sm bg-[#C23D29]/70" />
            <span className="h-2.5 w-2.5 rounded-sm bg-[#C23D29]" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="border border-white/5 bg-neutral-950/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-foreground/5 text-foreground border border-white/5">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
              {type === "github" ? "Total Contributions" : "Total Submissions"}
            </p>
            <h5 className="text-xl font-bold text-white font-mono mt-0.5">
              {stats.totalSubmissions}
            </h5>
          </div>
        </div>

        <div className="border border-white/5 bg-neutral-950/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/5 text-emerald-400 border border-white/5">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
              Active Days
            </p>
            <h5 className="text-xl font-bold text-white font-mono mt-0.5">
              {stats.activeDays}
            </h5>
          </div>
        </div>

        <div className="border border-white/5 bg-neutral-950/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/5 text-amber-400 border border-white/5">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
              Current Streak
            </p>
            <h5 className="text-xl font-bold text-white font-mono mt-0.5">
              {stats.currentStreak} {stats.currentStreak === 1 ? "day" : "days"}
            </h5>
          </div>
        </div>

        <div className="border border-white/5 bg-neutral-950/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/5 text-indigo-400 border border-white/5">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
              Longest Streak
            </p>
            <h5 className="text-xl font-bold text-white font-mono mt-0.5">
              {stats.longestStreak} {stats.longestStreak === 1 ? "day" : "days"}
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
}