import {
  Trophy,
  Flame,
  Zap,
  Shield,
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  Sliders,
} from 'lucide-react'

export default function GamificationView({
  profile = {},
  onTogglePenalties,
}) {
  const levelInfo = profile.levelInfo || {
    level: 'Novice',
    currentXp: 0,
    progressPercent: 0,
    nextLevel: 'Apprentice',
    nextLevelXp: 200,
  }

  const achievements = profile.achievements || []

  return (
    <div className="w-full flex flex-col gap-8 text-left">
      {/* 1. Level & Progression Hero */}
      <div className="p-6 sm:p-8 rounded-3xl border border-hairline bg-[#0E0E14] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/20 text-accent font-semibold uppercase">
                Rank Level
              </span>
              <span className="text-xs font-mono text-muted">
                {profile.total_xp || 0} Total XP
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
              {levelInfo.level}
            </h2>
            <span className="text-xs font-mono text-muted">
              {levelInfo.nextLevel
                ? `${levelInfo.nextLevelXp - levelInfo.currentXp} XP until ${levelInfo.nextLevel}`
                : 'Maximum Rank Achieved!'}
            </span>
          </div>
        </div>

        {/* Streaks Banner */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-hairline w-full md:w-auto">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
              <Flame className="w-6 h-6 fill-amber-400" />
            </span>
            <div>
              <span className="text-xs font-mono text-muted block">Current Streak</span>
              <span className="text-2xl font-display font-bold text-white">
                {profile.current_streak || 0} <span className="text-xs font-mono font-normal text-muted">days</span>
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-hairline mx-2" />

          <div>
            <span className="text-xs font-mono text-muted block">Best Record</span>
            <span className="text-xl font-display font-bold text-accent">
              {profile.longest_streak || 0} <span className="text-xs font-mono font-normal text-muted">days</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. XP Progress Bar */}
      <div className="p-5 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-white font-medium flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span>Progress to Next Rank</span>
          </span>
          <span className="text-accent font-bold">{levelInfo.progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, levelInfo.progressPercent)}%` }}
          />
        </div>
      </div>

      {/* 3. Achievements Catalog */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-lg font-display font-bold text-white">Verified Achievements</h3>
            <span className="text-xs font-mono text-muted">
              {profile.unlockedAchievementsCount || 0} of {achievements.length} unlocked
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const isUnlocked = ach.is_unlocked === 1

            return (
              <div
                key={ach.id}
                className={`p-5 rounded-2xl border transition-colors flex flex-col justify-between gap-4 ${
                  isUnlocked
                    ? 'border-accent/40 bg-accent/[0.03]'
                    : 'border-hairline bg-[#0E0E14] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isUnlocked
                          ? 'bg-accent/20 text-accent border border-accent/30'
                          : 'bg-white/5 text-muted border border-hairline'
                      }`}
                    >
                      {isUnlocked ? <Award className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-display font-bold text-white">
                        {ach.title}
                      </h4>
                      <span className="text-[10px] font-mono text-muted uppercase">
                        {ach.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      isUnlocked
                        ? 'bg-accent/20 text-accent'
                        : 'bg-white/5 text-muted'
                    }`}
                  >
                    +{ach.xp_reward} XP
                  </span>
                </div>

                <p className="text-xs font-mono text-muted leading-relaxed">
                  {ach.description}
                </p>

                {isUnlocked && ach.unlocked_at && (
                  <div className="pt-2 border-t border-hairline flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Unlocked {ach.unlocked_at.split(' ')[0]}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. Fair Penalties Configuration Card */}
      <div className="p-6 rounded-2xl border border-hairline bg-[#0E0E14] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-3 rounded-xl bg-white/5 text-muted shrink-0">
            <Sliders className="w-5 h-5 text-accent" />
          </span>
          <div>
            <h4 className="text-sm font-display font-bold text-white">
              Fair Penalties & Streak Rules
            </h4>
            <p className="text-xs font-mono text-muted max-w-xl mt-0.5">
              Permanent XP is NEVER lost for honest failed attempts. When enabled, missing a day uses 1 streak freeze. When disabled, practice stress-free.
            </p>
          </div>
        </div>

        <button
          onClick={() => onTogglePenalties(!profile.penalties_enabled)}
          className={`px-4 py-2 rounded-full text-xs font-mono font-medium border transition-colors cursor-pointer shrink-0 ${
            profile.penalties_enabled
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-white/5 text-muted border-hairline hover:text-white'
          }`}
        >
          {profile.penalties_enabled ? 'Penalties: Active' : 'Penalties: Relaxed'}
        </button>
      </div>
    </div>
  )
}
