import { useState } from 'react'
import { motion } from 'motion/react'
import {
  PieChart,
  BarChart3,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react'

export default function DsaVisualCharts({ charts = {}, stats = {} }) {
  const [activeTooltip, setActiveTooltip] = useState(null)

  const diff = charts.difficulty || {
    Easy: { solved: 0, total: 18 },
    Medium: { solved: 0, total: 32 },
    Hard: { solved: 0, total: 7 },
  }

  const weekly = charts.weeklyActivity || []
  const solveTypes = charts.solveTypes || { independent: 0, assisted: 0, independentPercentage: 100 }
  const topicCharts = charts.topicCharts || []

  // Radial Donut calculations for Difficulty
  const totalSolved = (diff.Easy?.solved || 0) + (diff.Medium?.solved || 0) + (diff.Hard?.solved || 0)
  const radius = 54
  const strokeWidth = 10
  const circumference = 2 * Math.PI * radius

  // Calculate arc fractions
  const easyRatio = totalSolved > 0 ? (diff.Easy?.solved || 0) / totalSolved : 0
  const medRatio = totalSolved > 0 ? (diff.Medium?.solved || 0) / totalSolved : 0
  const hardRatio = totalSolved > 0 ? (diff.Hard?.solved || 0) / totalSolved : 0

  const easyStroke = easyRatio * circumference
  const medStroke = medRatio * circumference
  const hardStroke = hardRatio * circumference

  // Max solves in week for scaling bars
  const maxSolvesInWeek = Math.max(1, ...weekly.map((w) => w.solves || 0))

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      {/* Visual Charts Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <span>Practice Analytics & Visual Insights</span>
          </h3>
          <p className="text-xs font-mono text-muted mt-0.5">
            Real-time visual breakdown of your problem solving consistency, difficulty distribution, and topic mastery.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted bg-[#12121A] px-3 py-1.5 rounded-xl border border-hairline">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real SQLite Analytics</span>
        </div>
      </div>

      {/* Grid: 2 Primary Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Difficulty Distribution Radial Donut */}
        <div className="p-6 rounded-3xl border border-hairline bg-[#0D0D14] flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-accent" />
              <span>Difficulty Distribution</span>
            </span>
            <span className="text-xs font-mono text-white font-medium">
              {stats.uniqueSolved || 0} Solved
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
                {/* Background Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke="#1E1E2C"
                  strokeWidth={strokeWidth}
                />

                {totalSolved > 0 ? (
                  <>
                    {/* Easy Arc */}
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="transparent"
                      stroke="#10B981"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${easyStroke} ${circumference}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                    {/* Medium Arc */}
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="transparent"
                      stroke="#F59E0B"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${medStroke} ${circumference}`}
                      strokeDashoffset={`-${easyStroke}`}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                    {/* Hard Arc */}
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="transparent"
                      stroke="#F43F5E"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${hardStroke} ${circumference}`}
                      strokeDashoffset={`-${easyStroke + medStroke}`}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </>
                ) : (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#B8FF3C"
                    strokeWidth={strokeWidth}
                    strokeDasharray="4 8"
                    opacity="0.4"
                  />
                )}
              </svg>

              {/* Center Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-display font-bold text-white tracking-tight">
                  {stats.uniqueSolved || 0}
                </span>
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
                  Solved
                </span>
              </div>
            </div>

            {/* Legend & Progress Bars */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {/* Easy */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-white">Easy</span>
                  </div>
                  <span className="text-muted">
                    <span className="text-emerald-400 font-bold">{diff.Easy?.solved || 0}</span> /{' '}
                    {diff.Easy?.total || 18}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        diff.Easy?.total
                          ? Math.min(100, Math.round(((diff.Easy.solved || 0) / diff.Easy.total) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-white">Medium</span>
                  </div>
                  <span className="text-muted">
                    <span className="text-amber-400 font-bold">{diff.Medium?.solved || 0}</span> /{' '}
                    {diff.Medium?.total || 32}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        diff.Medium?.total
                          ? Math.min(100, Math.round(((diff.Medium.solved || 0) / diff.Medium.total) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Hard */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="text-white">Hard</span>
                  </div>
                  <span className="text-muted">
                    <span className="text-rose-400 font-bold">{diff.Hard?.solved || 0}</span> /{' '}
                    {diff.Hard?.total || 7}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-rose-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        diff.Hard?.total
                          ? Math.min(100, Math.round(((diff.Hard.solved || 0) / diff.Hard.total) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: Weekly Practice Momentum Bar Chart */}
        <div className="p-6 rounded-3xl border border-hairline bg-[#0D0D14] flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              <span>7-Day Activity & Momentum</span>
            </span>
            <span className="text-xs font-mono text-muted">
              {weekly.reduce((acc, curr) => acc + curr.solves, 0)} solved this week
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="flex items-end justify-between gap-2 h-36 pt-6 pb-2 px-2 border-b border-hairline/60">
            {weekly.map((day, idx) => {
              const heightPercent =
                day.solves > 0 ? Math.max(22, Math.round((day.solves / maxSolvesInWeek) * 100)) : 8

              const isActive = day.solves > 0

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveTooltip(day)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                >
                  {/* Glowing Bar */}
                  <div className="w-full max-w-[28px] h-full flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className={`w-full rounded-t-lg transition-all duration-200 ${
                        day.isToday
                          ? 'bg-accent shadow-lg shadow-accent/20 ring-1 ring-accent'
                          : isActive
                          ? 'bg-emerald-400 group-hover:bg-emerald-300'
                          : 'bg-white/5 group-hover:bg-white/10'
                      }`}
                    />
                  </div>

                  {/* Day Label */}
                  <span
                    className={`text-[10px] font-mono mt-2 transition-colors ${
                      day.isToday
                        ? 'text-accent font-bold'
                        : isActive
                        ? 'text-white'
                        : 'text-muted'
                    }`}
                  >
                    {day.day}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Dynamic Tooltip / Footer */}
          <div className="flex items-center justify-between text-xs font-mono text-muted pt-1">
            {activeTooltip ? (
              <span className="text-white flex items-center gap-2">
                <span className="text-accent font-bold">{activeTooltip.day} ({activeTooltip.date}):</span>
                <span>{activeTooltip.solves} solved</span> ·
                <span>{activeTooltip.minutes}m practiced</span> ·
                <span className="text-accent font-medium">+{activeTooltip.xp} XP</span>
              </span>
            ) : (
              <span>Hover over any day to see solving duration & XP earned</span>
            )}
            <span className="text-[11px] text-accent font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Consistent practice builds retention</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 2 Secondary Visual Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Solve Integrity & Independence */}
        <div className="p-5 rounded-2xl border border-hairline bg-[#0D0D14] flex flex-col justify-between gap-3 text-left">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-mono">Solve Independence</span>
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-accent">
              {solveTypes.independentPercentage}%
            </span>
            <span className="text-xs font-mono text-muted">
              ({solveTypes.independent} of {stats.uniqueSolved || 0} independent)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, solveTypes.independentPercentage)}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-muted">
            Solves completed without consulting hints or editorial
          </span>
        </div>

        {/* Metric 2: Topic Mastery Coverage */}
        <div className="md:col-span-2 p-5 rounded-2xl border border-hairline bg-[#0D0D14] flex flex-col justify-between gap-3 text-left">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-accent" />
              <span>Topic Coverage Progress</span>
            </span>
            <span className="text-xs font-mono">Top Topics</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
            {topicCharts.slice(0, 4).map((tc) => (
              <div
                key={tc.topic}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-white truncate">
                    {tc.topic}
                  </span>
                  <span className="text-[10px] font-mono text-accent font-bold">
                    {tc.score}%
                  </span>
                </div>
                <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${Math.max(5, tc.score)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-muted">
                  {tc.solved} / {tc.total} solved
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
