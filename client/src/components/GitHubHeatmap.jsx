import { GitHubCalendar } from "react-github-calendar";
import { Calendar, Flame, Trophy, Zap } from "lucide-react";
import { useState } from "react";

/**
 * GitHubHeatmap — visually matches LeetCodeHeatmap layout exactly:
 * same card wrapper, same padding, same legend row, same 4-stat footer.
 * Uses react-github-calendar internally so data comes from GitHub directly.
 */
export default function GitHubHeatmap({ username = "Manash2005" }) {
  const [calendarData, setCalendarData] = useState(null);

  // Derived stats from the calendar data once react-github-calendar loads it
  const stats = calendarData ? deriveStats(calendarData) : null;

  return (
    <div className="w-full">
      {/* Heatmap Card — same shell as LeetCodeHeatmap */}
      <div className="relative border border-white/5 bg-neutral-950/20 backdrop-blur-md rounded-2xl p-5 md:p-6">
        {/* Day-of-week labels + calendar in a flex row (matching LeetCodeHeatmap layout) */}
        <div className="flex flex-row">
          {/* Day-of-week labels — same font/colour as LeetCodeHeatmap */}
          <div className="flex flex-col justify-between text-[10px] text-white/30 font-mono pr-2 select-none h-[108px] pt-5">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          {/* Calendar with overflow scroll */}
          <div className="flex-1 overflow-x-auto scrollbar-thin">
            <GitHubCalendar
              username={username}
              colorScheme="dark"
              hideColorLegend
              hideMonthLabels={false}
              hideTotalCount
              theme={{
                dark: [
                  "rgba(255, 255, 255, 0.05)",
                  "rgba(194, 61, 41, 0.2)",
                  "rgba(194, 61, 41, 0.45)",
                  "rgba(194, 61, 41, 0.7)",
                  "#C23D29",
                ],
              }}
              style={{
                color: "rgba(255,255,255,0.4)",
                fontFamily: "monospace",
                fontSize: "10px",
              }}
              blockSize={12}
              blockMargin={4}
              blockRadius={2}
              onDataFetched={(data) => setCalendarData(data)}
            />
          </div>
        </div>

        {/* Legend row — same as LeetCodeHeatmap */}
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

      {/* Stat cards — identical grid as LeetCodeHeatmap */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {/* Total Contributions */}
        <div className="border border-white/5 bg-neutral-950/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-foreground/5 text-foreground border border-white/5">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
              Total Contributions
            </p>
            <h5 className="text-xl font-bold text-white font-mono mt-0.5">
              {stats ? stats.total : <Skeleton />}
            </h5>
          </div>
        </div>

        {/* Active Days */}
        <div className="border border-white/5 bg-neutral-950/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/5 text-emerald-400 border border-white/5">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
              Active Days
            </p>
            <h5 className="text-xl font-bold text-white font-mono mt-0.5">
              {stats ? stats.activeDays : <Skeleton />}
            </h5>
          </div>
        </div>

        {/* Current Streak */}
        <div className="border border-white/5 bg-neutral-950/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/5 text-amber-400 border border-white/5">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
              Current Streak
            </p>
            <h5 className="text-xl font-bold text-white font-mono mt-0.5">
              {stats
                ? `${stats.currentStreak} ${stats.currentStreak === 1 ? "day" : "days"}`
                : <Skeleton />}
            </h5>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="border border-white/5 bg-neutral-950/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/5 text-indigo-400 border border-white/5">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
              Longest Streak
            </p>
            <h5 className="text-xl font-bold text-white font-mono mt-0.5">
              {stats
                ? `${stats.longestStreak} ${stats.longestStreak === 1 ? "day" : "days"}`
                : <Skeleton />}
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Tiny inline skeleton for loading state */
function Skeleton() {
  return (
    <span className="inline-block w-10 h-5 bg-white/10 rounded animate-pulse" />
  );
}

/**
 * Derive streak / active-day stats from the raw activity array
 * that react-github-calendar passes to onDataFetched.
 * Each item: { date: "YYYY-MM-DD", count: number, level: 0-4 }
 */
function deriveStats(data) {
  let total = 0;
  let activeDays = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Sort ascending to walk forward
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  sorted.forEach((d) => {
    total += d.count;
    if (d.count > 0) {
      activeDays++;
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  });

  // Walk backwards for current streak
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].count > 0) {
      currentStreak++;
    } else {
      if (i < sorted.length - 2 && currentStreak === 0) break;
      if (currentStreak > 0) break;
    }
  }

  return { total, activeDays, currentStreak, longestStreak };
}
