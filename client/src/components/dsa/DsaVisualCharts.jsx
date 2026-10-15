import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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
  HelpCircle,
  Activity,
  Flame,
  X,
} from 'lucide-react'

export default function DsaVisualCharts({
  charts = {},
  stats = {},
  recentAttempts = [],
  onViewStats,
}) {
  const [activeTooltip, setActiveTooltip] = useState(null)
  const [activeInfoModal, setActiveInfoModal] = useState(null) // 'trajectory' | 'difficulty' | 'activity' | 'independence'

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

  // Line Chart calculation for Weekly Trajectory
  const linePoints = weekly.map((day, idx) => {
    const x = 30 + idx * 75 // 7 points over 450 width
    const maxY = 130
    const minY = 30
    const normalizedY = maxY - ((day.solves || 0) / Math.max(1, maxSolvesInWeek)) * (maxY - minY)
    return { ...day, x, y: normalizedY }
  })

  const pathD = linePoints.length > 0
    ? `M ${linePoints[0].x} ${linePoints[0].y} ` +
      linePoints.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
    : ''

  const areaD = linePoints.length > 0
    ? `${pathD} L ${linePoints[linePoints.length - 1].x} 150 L ${linePoints[0].x} 150 Z`
    : ''

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      {/* Visual Charts Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <span>Interactive Visual Arena & Trajectory</span>
          </h3>
          <p className="text-xs font-mono text-muted mt-0.5">
            Real-time visual velocity curves, difficulty ratios, and mastery progression.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted bg-[#12121A] px-3 py-1.5 rounded-xl border border-hairline">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time SQLite Analytics</span>
        </div>
      </div>

      {/* TOP ROW: LINE CHART (XP & Solve Velocity Trajectory) + DIFFICULTY RADIAL ARENA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Velocity & XP Curve (Line Chart) */}
        <div className="p-6 rounded-3xl border border-hairline bg-[#0D0D14] flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-accent" />
              <span>Velocity & XP Trajectory</span>
              <button
                onClick={() => setActiveInfoModal('trajectory')}
                className="p-1 rounded-full text-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="View metric details"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </span>
            <span className="text-xs font-mono text-accent font-medium">
              +{weekly.reduce((acc, curr) => acc + (curr.xp || 0), 0)} XP This Week
            </span>
          </div>

          {/* SVG Line Chart */}
          <div className="relative w-full h-44 flex items-center justify-center">
            <svg viewBox="0 0 510 160" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B8FF3C" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#B8FF3C" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="50%" stopColor="#B8FF3C" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="30" x2="490" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="20" y1="80" x2="490" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="20" y1="130" x2="490" y2="130" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="20" y1="150" x2="490" y2="150" stroke="rgba(255,255,255,0.1)" />

              {/* Area fill under curve */}
              {areaD && (
                <path d={areaD} fill="url(#areaGradient)" className="transition-all duration-700" />
              )}

              {/* Curve Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Points (Rock-solid hitbox, no jitter) */}
              {linePoints.map((pt, idx) => {
                const isHovered = activeTooltip?.day === pt.day
                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setActiveTooltip(pt)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    {/* Generous static invisible hit area to prevent mouse flicker */}
                    <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" pointerEvents="all" />

                    {/* Outer pulse circle for today or when hovered */}
                    {(pt.isToday || isHovered) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 12 : 9}
                        fill="none"
                        stroke="#B8FF3C"
                        strokeWidth="1.5"
                        opacity={isHovered ? 0.8 : 0.6}
                        className="transition-all duration-200"
                        pointerEvents="none"
                      >
                        {pt.isToday && !isHovered && (
                          <animate attributeName="r" values="6;11;6" dur="2s" repeatCount="indefinite" />
                        )}
                      </circle>
                    )}

                    {/* Point circle - anchored smoothly to true SVG center without transform jitter */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6.5 : (pt.isToday ? 5 : 4)}
                      fill={isHovered || pt.isToday ? '#B8FF3C' : '#0E0E14'}
                      stroke={isHovered || pt.isToday ? '#08080C' : '#B8FF3C'}
                      strokeWidth={isHovered ? 2.5 : 2}
                      className="transition-all duration-200"
                      pointerEvents="none"
                    />

                    {/* X Axis Labels */}
                    <text
                      x={pt.x}
                      y="158"
                      textAnchor="middle"
                      fill={isHovered || pt.isToday ? '#B8FF3C' : '#71717A'}
                      fontSize="9"
                      fontFamily="var(--font-mono)"
                      pointerEvents="none"
                    >
                      {pt.day}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Dynamic Tooltip / Footer */}
          <div className="flex items-center justify-between text-xs font-mono text-muted pt-1 border-t border-hairline/60">
            {activeTooltip ? (
              <span className="text-white flex items-center gap-2">
                <span className="text-accent font-bold">{activeTooltip.day} ({activeTooltip.date}):</span>
                <span>{activeTooltip.solves} solved</span> ·
                <span className="text-accent font-medium">+{activeTooltip.xp} XP</span>
              </span>
            ) : (
              <span>Hover over trajectory points to view session velocity</span>
            )}
            <span className="text-[11px] text-accent font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Momentum Active</span>
            </span>
          </div>
        </div>

        {/* CHART 2: Difficulty Distribution Radial Arena */}
        <div className="p-6 rounded-3xl border border-hairline bg-[#0D0D14] flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-2">
              <PieChart className="w-3.5 h-3.5 text-accent" />
              <span>Difficulty Arena Ratio</span>
              <button
                onClick={() => setActiveInfoModal('difficulty')}
                className="p-1 rounded-full text-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="View difficulty weights"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </span>
            <span className="text-xs font-mono text-white font-medium">
              {stats.uniqueSolved || 0} Solved Overall
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
      </div>

      {/* BOTTOM ROW: 7-DAY MOMENTUM BARS + SOLVE INTEGRITY & TOPICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 3: 7-Day Activity Rhythm Bar Chart */}
        <div className="p-6 rounded-3xl border border-hairline bg-[#0D0D14] flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              <span>7-Day Rhythm</span>
              <button
                onClick={() => setActiveInfoModal('activity')}
                className="p-1 rounded-full text-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="View activity rules"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </span>
            <span className="text-xs font-mono text-muted">
              {weekly.reduce((acc, curr) => acc + curr.solves, 0)} solved
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-2 px-1 border-b border-hairline/60">
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
                  <div className="w-full max-w-[24px] h-full flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.4, delay: idx * 0.04 }}
                      className={`w-full rounded-t-md transition-all duration-200 ${
                        day.isToday
                          ? 'bg-accent shadow-lg shadow-accent/20 ring-1 ring-accent'
                          : isActive
                          ? 'bg-emerald-400 group-hover:bg-emerald-300'
                          : 'bg-white/5 group-hover:bg-white/10'
                      }`}
                    />
                  </div>

                  <span
                    className={`text-[9px] font-mono mt-1.5 transition-colors ${
                      day.isToday ? 'text-accent font-bold' : isActive ? 'text-white' : 'text-muted'
                    }`}
                  >
                    {day.day}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-muted">
            <span>Streak: {stats.streak || 0} days</span>
            <span className="text-accent flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current" />
              <span>Grit Verified</span>
            </span>
          </div>
        </div>

        {/* Metric 1: Solve Integrity & Independence */}
        <div className="p-6 rounded-3xl border border-hairline bg-[#0D0D14] flex flex-col justify-between gap-4 text-left">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-mono uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span>Solve Integrity</span>
              <button
                onClick={() => setActiveInfoModal('independence')}
                className="p-1 rounded-full text-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="View integrity rules"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-accent">
              {solveTypes.independentPercentage}%
            </span>
            <span className="text-xs font-mono text-muted">
              ({solveTypes.independent} independent)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, solveTypes.independentPercentage)}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-muted">
            Zero-hint solves strictly verify your independent algorithmic problem solving.
          </span>
        </div>

        {/* Metric 2: Topic Coverage Progress */}
        <div className="p-6 rounded-3xl border border-hairline bg-[#0D0D14] flex flex-col justify-between gap-4 text-left">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-accent" />
              <span>Core Topic Mastery</span>
            </span>
            <span className="text-xs font-mono text-accent">
              {topicCharts.length} Core
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 py-1">
            {topicCharts.slice(0, 4).map((tc) => (
              <div
                key={tc.topic}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-medium text-white truncate">
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
                <span className="text-[9px] font-mono text-muted">
                  {tc.solved} / {tc.total} solved
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* Extra Info Help Modal */}
      <AnimatePresence>
        {activeInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveInfoModal(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-hairline bg-[#0E0E14] p-6 flex flex-col gap-4 text-left shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-accent" />
                  <h4 className="text-sm font-display font-bold text-white">
                    {activeInfoModal === 'trajectory' && 'Velocity & XP Trajectory'}
                    {activeInfoModal === 'difficulty' && 'Difficulty Arena Weights'}
                    {activeInfoModal === 'activity' && '7-Day Rhythm & Streaks'}
                    {activeInfoModal === 'independence' && 'Solve Integrity Metric'}
                  </h4>
                </div>
                <button
                  onClick={() => setActiveInfoModal(null)}
                  className="p-1.5 rounded-lg text-muted hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs font-mono text-muted leading-relaxed flex flex-col gap-2">
                {activeInfoModal === 'trajectory' && (
                  <p>
                    Tracks your daily problem solves and cumulative XP points. Points are awarded based on difficulty (Easy: +15, Medium: +25, Hard: +40) plus bonuses for first-try solves and timely spaced revisions.
                  </p>
                )}
                {activeInfoModal === 'difficulty' && (
                  <p>
                    Calculates your problem solving distribution. Technical interview readiness typically requires at least 60% Mediums and 15% Hards across core algorithmic patterns.
                  </p>
                )}
                {activeInfoModal === 'activity' && (
                  <p>
                    Highlights active practice consistency across the week. Practicing at least one problem daily maintains your streak. When fair penalties are active, missing a day uses a streak freeze.
                  </p>
                )}
                {activeInfoModal === 'independence' && (
                  <p>
                    Measures problems solved completely independently without consulting editorial solutions, AI hints, or external walkthroughs. Higher integrity accelerates topic mastery scores.
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveInfoModal(null)}
                  className="px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-accent text-[#08080C] hover:opacity-90 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
