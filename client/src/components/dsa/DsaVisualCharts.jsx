import { useState, useMemo } from 'react'
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
  Target,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'

export default function DsaVisualCharts({
  charts = {},
  stats = {},
  recentAttempts = [],
  onViewStats,
}) {
  const [activeTooltip, setActiveTooltip] = useState(null)
  const [activeInfoModal, setActiveInfoModal] = useState(null)
  const [visibleDiffLines, setVisibleDiffLines] = useState({
    Easy: true,
    Medium: true,
    Hard: true,
  })

  // 1. Difficulty distribution data
  const diff = charts.difficulty || {
    Easy: { solved: 0, total: 18 },
    Medium: { solved: 0, total: 32 },
    Hard: { solved: 0, total: 7 },
  }

  const weekly = charts.weeklyActivity || []
  const solveTypes = charts.solveTypes || { independent: 0, assisted: 0, independentPercentage: 100 }
  const topicCharts = charts.topicCharts || []

  // 2. Solve Times by Difficulty data
  const solveTimesData = charts.solveTimesByDifficulty || {
    trend: [],
    averages: { Easy: null, Medium: null, Hard: null },
    accuracyRate: 100,
    totalPracticeMinutes: 0,
    speedAdherenceRate: 100,
  }

  const trendRows = solveTimesData.trend || []
  const averages = solveTimesData.averages || {}

  // 3. Radial Donut calculations for Difficulty
  const totalSolved = (diff.Easy?.solved || 0) + (diff.Medium?.solved || 0) + (diff.Hard?.solved || 0)
  const radius = 54
  const strokeWidth = 10
  const circumference = 2 * Math.PI * radius

  const easyRatio = totalSolved > 0 ? (diff.Easy?.solved || 0) / totalSolved : 0
  const medRatio = totalSolved > 0 ? (diff.Medium?.solved || 0) / totalSolved : 0
  const hardRatio = totalSolved > 0 ? (diff.Hard?.solved || 0) / totalSolved : 0

  const easyStroke = easyRatio * circumference
  const medStroke = medRatio * circumference
  const hardStroke = hardRatio * circumference

  // 4. Weekly Velocity trajectory calculations
  const maxSolvesInWeek = Math.max(1, ...weekly.map((w) => w.solves || 0))
  const linePoints = weekly.map((day, idx) => {
    const x = 30 + idx * 75
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

  // 5. Multi-line Solve Time Graph calculations
  // Chart dimensions: viewBox="0 0 620 220"
  // Y-axis: 0m to 60m (target benchmarks: Easy 15m, Med 30m, Hard 45m)
  const graphPadding = { top: 25, bottom: 40, left: 45, right: 25 }
  const graphWidth = 620 - graphPadding.left - graphPadding.right
  const graphHeight = 220 - graphPadding.top - graphPadding.bottom

  // Y-Scale: 0 to 60 minutes
  const maxYMinutes = 60
  const getY = (mins) => {
    const clamped = Math.min(maxYMinutes, Math.max(0, mins))
    return graphPadding.top + graphHeight - (clamped / maxYMinutes) * graphHeight
  }

  // Pre-process dates or fall back to recent days if empty
  const multiLinePoints = useMemo(() => {
    if (trendRows.length === 0) return []

    const count = trendRows.length
    return trendRows.map((row, idx) => {
      const x = count === 1
        ? graphPadding.left + graphWidth / 2
        : graphPadding.left + (idx / (count - 1)) * graphWidth

      const easyMins = row.easy_avg_minutes ?? row.Easy ?? row.details?.Easy?.avgMinutes ?? null
      const medMins = row.medium_avg_minutes ?? row.Medium ?? row.details?.Medium?.avgMinutes ?? null
      const hardMins = row.hard_avg_minutes ?? row.Hard ?? row.details?.Hard?.avgMinutes ?? null

      const easyCount = row.easy_count ?? row.details?.Easy?.solveCount ?? 1
      const medCount = row.medium_count ?? row.details?.Medium?.solveCount ?? 1
      const hardCount = row.hard_count ?? row.details?.Hard?.solveCount ?? 1

      return {
        date: row.date,
        x,
        easy: easyMins != null ? { mins: Number(easyMins), y: getY(Number(easyMins)), count: easyCount } : null,
        medium: medMins != null ? { mins: Number(medMins), y: getY(Number(medMins)), count: medCount } : null,
        hard: hardMins != null ? { mins: Number(hardMins), y: getY(Number(hardMins)), count: hardCount } : null,
      }
    })
  }, [trendRows, graphWidth, graphPadding.left])

  // Build SVG path strings for each difficulty
  const easyLinePath = useMemo(() => {
    const valid = multiLinePoints.filter((p) => p.easy !== null)
    if (valid.length === 0) return ''
    if (valid.length === 1) return `M ${valid[0].x - 16} ${valid[0].easy.y} L ${valid[0].x + 16} ${valid[0].easy.y}`
    return `M ${valid[0].x} ${valid[0].easy.y} ` + valid.slice(1).map((p) => `L ${p.x} ${p.easy.y}`).join(' ')
  }, [multiLinePoints])

  const mediumLinePath = useMemo(() => {
    const valid = multiLinePoints.filter((p) => p.medium !== null)
    if (valid.length === 0) return ''
    if (valid.length === 1) return `M ${valid[0].x - 16} ${valid[0].medium.y} L ${valid[0].x + 16} ${valid[0].medium.y}`
    return `M ${valid[0].x} ${valid[0].medium.y} ` + valid.slice(1).map((p) => `L ${p.x} ${p.medium.y}`).join(' ')
  }, [multiLinePoints])

  const hardLinePath = useMemo(() => {
    const valid = multiLinePoints.filter((p) => p.hard !== null)
    if (valid.length === 0) return ''
    if (valid.length === 1) return `M ${valid[0].x - 16} ${valid[0].hard.y} L ${valid[0].x + 16} ${valid[0].hard.y}`
    return `M ${valid[0].x} ${valid[0].hard.y} ` + valid.slice(1).map((p) => `L ${p.x} ${p.hard.y}`).join(' ')
  }, [multiLinePoints])

  const formatMinsDisplay = (val) => {
    if (val == null) return '—'
    if (typeof val === 'object') {
      const mins = val.avgMinutes ?? val.minutes ?? val.mins
      if (mins == null) return '—'
      return `${mins}m`
    }
    return `${val}m`
  }

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      {/* 1. Header with Live Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <span>Interactive Visual Arena & Velocity Curves</span>
          </h3>
          <p className="text-xs font-mono text-muted mt-0.5">
            Real-time multi-line solve time tracking, difficulty ratios, and spaced retention stats.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted bg-[#12121A] px-3 py-1.5 rounded-xl border border-hairline">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time Analytics Engine</span>
        </div>
      </div>

      {/* 2. Top Rich Stat Badges Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Stat 1: Total Practice Time */}
        <div className="p-3.5 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase text-muted flex items-center gap-1">
            <Clock className="w-3 h-3 text-accent" />
            <span>Practice Time</span>
          </span>
          <span className="text-lg font-display font-bold text-white">
            {stats.totalPracticeMinutes ? `${Math.floor(stats.totalPracticeMinutes / 60)}h ${stats.totalPracticeMinutes % 60}m` : '0m'}
          </span>
          <span className="text-[10px] font-mono text-muted">Focused execution</span>
        </div>

        {/* Stat 2: Accuracy Rate */}
        <div className="p-3.5 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase text-muted flex items-center gap-1">
            <Target className="w-3 h-3 text-emerald-400" />
            <span>Solve Accuracy</span>
          </span>
          <span className="text-lg font-display font-bold text-emerald-400">
            {stats.accuracyRate != null ? `${stats.accuracyRate}%` : '100%'}
          </span>
          <span className="text-[10px] font-mono text-muted">{stats.uniqueSolved || 0} unique solved</span>
        </div>

        {/* Stat 3: Speed Adherence */}
        <div className="p-3.5 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase text-muted flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Speed Adherence</span>
          </span>
          <span className="text-lg font-display font-bold text-amber-400">
            {stats.speedAdherenceRate != null ? `${stats.speedAdherenceRate}%` : '100%'}
          </span>
          <span className="text-[10px] font-mono text-muted">Within target limits</span>
        </div>

        {/* Stat 4: Avg Easy Time */}
        <div className="p-3.5 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Avg Easy</span>
          </span>
          <span className="text-lg font-display font-bold text-white">
            {formatMinsDisplay(averages.Easy?.avgMinutes ?? stats.easyAvgMinutes ?? averages.Easy)}
          </span>
          <span className="text-[10px] font-mono text-muted">Target: 15m</span>
        </div>

        {/* Stat 5: Avg Medium Time */}
        <div className="p-3.5 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase text-amber-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Avg Medium</span>
          </span>
          <span className="text-lg font-display font-bold text-white">
            {formatMinsDisplay(averages.Medium?.avgMinutes ?? stats.mediumAvgMinutes ?? averages.Medium)}
          </span>
          <span className="text-[10px] font-mono text-muted">Target: 30m</span>
        </div>

        {/* Stat 6: Avg Hard Time */}
        <div className="p-3.5 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase text-rose-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Avg Hard</span>
          </span>
          <span className="text-lg font-display font-bold text-white">
            {formatMinsDisplay(averages.Hard?.avgMinutes ?? stats.hardAvgMinutes ?? averages.Hard)}
          </span>
          <span className="text-[10px] font-mono text-muted">Target: 45m</span>
        </div>
      </div>

      {/* 3. MULTI-LINE GRAPH: Average Time to Solve Easy, Medium & Hard Separately */}
      <div className="p-6 rounded-3xl border border-hairline bg-[#0D0D14] flex flex-col justify-between gap-5 relative overflow-hidden shadow-lg">
        {/* Header & Line Visibility Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline/60 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <h4 className="text-sm font-display font-bold text-white">
              Average Solve Time by Difficulty Over Time (3-Line Graph)
            </h4>
            <button
              onClick={() => setActiveInfoModal('timeGraph')}
              className="p-1 rounded-full text-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Graph explanation"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle pills for 3 separate lines */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted mr-1 hidden sm:inline">Lines:</span>
            <button
              onClick={() => setVisibleDiffLines((prev) => ({ ...prev, Easy: !prev.Easy }))}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                visibleDiffLines.Easy
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'bg-white/5 text-muted/50 border border-transparent'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Easy</span>
            </button>

            <button
              onClick={() => setVisibleDiffLines((prev) => ({ ...prev, Medium: !prev.Medium }))}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                visibleDiffLines.Medium
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                  : 'bg-white/5 text-muted/50 border border-transparent'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Medium</span>
            </button>

            <button
              onClick={() => setVisibleDiffLines((prev) => ({ ...prev, Hard: !prev.Hard }))}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                visibleDiffLines.Hard
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                  : 'bg-white/5 text-muted/50 border border-transparent'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Hard</span>
            </button>
          </div>
        </div>

        {/* SVG Multi-Line Canvas */}
        <div className="relative w-full h-56 flex items-center justify-center">
          <svg viewBox="0 0 620 220" className="w-full h-full overflow-visible">
            {/* Horizontal Grid & Target Benchmark Lines */}
            {/* 60m */}
            <line x1={graphPadding.left} y1={getY(60)} x2={620 - graphPadding.right} y2={getY(60)} stroke="rgba(255,255,255,0.05)" />
            <text x={graphPadding.left - 8} y={getY(60) + 3} textAnchor="end" fill="#71717A" fontSize="9" fontFamily="var(--font-mono)">60m</text>

            {/* 45m Target Benchmark (Hard Target) */}
            <line x1={graphPadding.left} y1={getY(45)} x2={620 - graphPadding.right} y2={getY(45)} stroke="rgba(244,63,94,0.25)" strokeDasharray="3 3" />
            <text x={graphPadding.left - 8} y={getY(45) + 3} textAnchor="end" fill="#F43F5E" fontSize="9" fontFamily="var(--font-mono)">45m</text>
            <text x={620 - graphPadding.right} y={getY(45) - 3} textAnchor="end" fill="rgba(244,63,94,0.6)" fontSize="8" fontFamily="var(--font-mono)">Hard Target</text>

            {/* 30m Target Benchmark (Medium Target) */}
            <line x1={graphPadding.left} y1={getY(30)} x2={620 - graphPadding.right} y2={getY(30)} stroke="rgba(245,158,11,0.25)" strokeDasharray="3 3" />
            <text x={graphPadding.left - 8} y={getY(30) + 3} textAnchor="end" fill="#F59E0B" fontSize="9" fontFamily="var(--font-mono)">30m</text>
            <text x={620 - graphPadding.right} y={getY(30) - 3} textAnchor="end" fill="rgba(245,158,11,0.6)" fontSize="8" fontFamily="var(--font-mono)">Medium Target</text>

            {/* 15m Target Benchmark (Easy Target) */}
            <line x1={graphPadding.left} y1={getY(15)} x2={620 - graphPadding.right} y2={getY(15)} stroke="rgba(16,185,129,0.25)" strokeDasharray="3 3" />
            <text x={graphPadding.left - 8} y={getY(15) + 3} textAnchor="end" fill="#10B981" fontSize="9" fontFamily="var(--font-mono)">15m</text>
            <text x={620 - graphPadding.right} y={getY(15) - 3} textAnchor="end" fill="rgba(16,185,129,0.6)" fontSize="8" fontFamily="var(--font-mono)">Easy Target</text>

            {/* 0m Baseline */}
            <line x1={graphPadding.left} y1={getY(0)} x2={620 - graphPadding.right} y2={getY(0)} stroke="rgba(255,255,255,0.15)" />
            <text x={graphPadding.left - 8} y={getY(0) + 3} textAnchor="end" fill="#71717A" fontSize="9" fontFamily="var(--font-mono)">0m</text>

            {/* Render 3 Continuous Connected Lines */}
            {visibleDiffLines.Easy && easyLinePath && (
              <path
                d={easyLinePath}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )}

            {visibleDiffLines.Medium && mediumLinePath && (
              <path
                d={mediumLinePath}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )}

            {visibleDiffLines.Hard && hardLinePath && (
              <path
                d={hardLinePath}
                fill="none"
                stroke="#F43F5E"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )}

            {/* Render Interactive Data Points with Stable Hitboxes */}
            {multiLinePoints.map((pt, pIdx) => {
              return (
                <g key={pIdx}>
                  {/* Date label on X axis */}
                  <text
                    x={pt.x}
                    y={getY(0) + 16}
                    textAnchor="middle"
                    fill="#A1A1AA"
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                  >
                    {pt.date.slice(5)}
                  </text>

                  {/* Easy Point */}
                  {visibleDiffLines.Easy && pt.easy && (
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setActiveTooltip({
                          date: pt.date,
                          difficulty: 'Easy',
                          mins: pt.easy.mins,
                          count: pt.easy.count,
                          target: 15,
                        })
                      }
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <circle cx={pt.x} cy={pt.easy.y} r="14" fill="transparent" />
                      <circle cx={pt.x} cy={pt.easy.y} r="9" fill="rgba(16,185,129,0.25)" />
                      <circle
                        cx={pt.x}
                        cy={pt.easy.y}
                        r="5"
                        fill="#10B981"
                        stroke="#08080C"
                        strokeWidth="2"
                        className="transition-transform hover:scale-125"
                      />
                    </g>
                  )}

                  {/* Medium Point */}
                  {visibleDiffLines.Medium && pt.medium && (
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setActiveTooltip({
                          date: pt.date,
                          difficulty: 'Medium',
                          mins: pt.medium.mins,
                          count: pt.medium.count,
                          target: 30,
                        })
                      }
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <circle cx={pt.x} cy={pt.medium.y} r="14" fill="transparent" />
                      <circle cx={pt.x} cy={pt.medium.y} r="9" fill="rgba(245,158,11,0.25)" />
                      <circle
                        cx={pt.x}
                        cy={pt.medium.y}
                        r="5"
                        fill="#F59E0B"
                        stroke="#08080C"
                        strokeWidth="2"
                        className="transition-transform hover:scale-125"
                      />
                    </g>
                  )}

                  {/* Hard Point */}
                  {visibleDiffLines.Hard && pt.hard && (
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setActiveTooltip({
                          date: pt.date,
                          difficulty: 'Hard',
                          mins: pt.hard.mins,
                          count: pt.hard.count,
                          target: 45,
                        })
                      }
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <circle cx={pt.x} cy={pt.hard.y} r="14" fill="transparent" />
                      <circle cx={pt.x} cy={pt.hard.y} r="9" fill="rgba(244,63,94,0.25)" />
                      <circle
                        cx={pt.x}
                        cy={pt.hard.y}
                        r="5"
                        fill="#F43F5E"
                        stroke="#08080C"
                        strokeWidth="2"
                        className="transition-transform hover:scale-125"
                      />
                    </g>
                  )}
                </g>
              )
            })}
          </svg>

          {multiLinePoints.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <Clock className="w-8 h-8 text-muted/30 mb-1.5" />
              <span className="text-xs font-mono text-muted">No solve time trajectory recorded yet</span>
              <span className="text-[10px] font-mono text-muted/60 mt-0.5">Solve timed questions in Practice Arena to plot your curves</span>
            </div>
          )}
        </div>

        {/* Dynamic Tooltip & Guidance Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-muted pt-2 border-t border-hairline/60 gap-2">
          {activeTooltip ? (
            <div className="flex items-center gap-2 text-white">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  activeTooltip.difficulty === 'Easy'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : activeTooltip.difficulty === 'Medium'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {activeTooltip.difficulty}
              </span>
              <span className="font-semibold">{activeTooltip.mins} mins avg</span>
              <span className="text-muted">({activeTooltip.count} solved on {activeTooltip.date})</span>
              <span className="text-muted">·</span>
              <span className={activeTooltip.mins <= activeTooltip.target ? 'text-emerald-400' : 'text-rose-400'}>
                {activeTooltip.mins <= activeTooltip.target
                  ? `⚡ ${activeTooltip.target - activeTooltip.mins}m under target`
                  : `⚠️ ${activeTooltip.mins - activeTooltip.target}m over target`}
              </span>
            </div>
          ) : (
            <span className="text-muted">
              Hover over points to inspect average time per problem vs target benchmarks
            </span>
          )}

          <div className="flex items-center gap-4 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Easy Target: 15m</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Medium Target: 30m</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Hard Target: 45m</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. SECOND ROW: XP VELOCITY TRAJECTORY + RADIAL DIFFICULTY RATIO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Solves & XP Trajectory Curve */}
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

              <line x1="20" y1="30" x2="490" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="20" y1="80" x2="490" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="20" y1="130" x2="490" y2="130" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="20" y1="150" x2="490" y2="150" stroke="rgba(255,255,255,0.1)" />

              {areaD && (
                <path d={areaD} fill="url(#areaGradient)" className="transition-all duration-700" />
              )}

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

              {linePoints.map((pt, idx) => {
                const isHovered = activeTooltip?.day === pt.day
                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setActiveTooltip(pt)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" pointerEvents="all" />

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

          <div className="flex items-center justify-between text-xs font-mono text-muted pt-1 border-t border-hairline/60">
            {activeTooltip?.day ? (
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

        {/* Difficulty Distribution Radial Arena */}
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
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
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

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-display font-bold text-white tracking-tight">
                  {stats.uniqueSolved || 0}
                </span>
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
                  Solved
                </span>
              </div>
            </div>

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

      {/* 5. THIRD ROW: 7-DAY RHYTHM + SOLVE INTEGRITY + TOPIC COVERAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Rhythm */}
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

        {/* Solve Integrity */}
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

        {/* Core Topic Mastery */}
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

      {/* Info Modal */}
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
                    {activeInfoModal === 'timeGraph' && 'Solve Time Multi-Line Graph'}
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
                {activeInfoModal === 'timeGraph' && (
                  <p>
                    Plots your average solve times for Easy, Medium, and Hard problems across dates.
                    Target benchmarks are 15 minutes for Easy, 30 minutes for Medium, and 45 minutes for Hard.
                    Staying below these target lines unlocks bonus speed XP without triggering overtime deductions.
                  </p>
                )}
                {activeInfoModal === 'trajectory' && (
                  <p>
                    Tracks your daily problem solves and cumulative XP points. Points are awarded based on difficulty (Easy: +50, Medium: +65, Hard: +80) plus bonuses for first-try solves and timely spaced revisions.
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
