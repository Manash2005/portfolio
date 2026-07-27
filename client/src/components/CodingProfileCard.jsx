import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

const PLATFORM_THEMES = {
  LeetCode: {
    text: "text-[#FFA116]",
    borderHover: "hover:border-[#FFA116]/40",
    shadowHover: "hover:shadow-[0_0_30px_rgba(255,161,22,0.2)]",
    bgAccent: "bg-[#FFA116]/5",
  },
  GeeksforGeeks: {
    text: "text-[#2F8D46]",
    borderHover: "hover:border-[#2F8D46]/40",
    shadowHover: "hover:shadow-[0_0_30px_rgba(47,141,70,0.2)]",
    bgAccent: "bg-[#2F8D46]/5",
  },
  GitHub: {
    text: "text-white",
    borderHover: "hover:border-white/20",
    shadowHover: "hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]",
    bgAccent: "bg-white/5",
  },
  DataVidhya: {
    text: "text-[#0080FF]",
    borderHover: "hover:border-[#0080FF]/40",
    shadowHover: "hover:shadow-[0_0_30px_rgba(0,128,255,0.2)]",
    bgAccent: "bg-[#0080FF]/5",
  },
};

function CodingProfileCard({
  logo,
  icon,
  platform,
  easy,
  medium,
  hard,
  profileUrl,
}) {
  const theme = PLATFORM_THEMES[platform] || {
    text: "text-foreground",
    borderHover: "hover:border-foreground/40",
    shadowHover: "hover:shadow-[0_0_30px_rgba(194,61,41,0.2)]",
    bgAccent: "bg-foreground/5",
  };

  const isGitHub = platform.toLowerCase() === "github";
  const total = isGitHub ? easy : easy + medium + hard;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      viewport={{ once: true }}
      className={`w-full bg-neutral-950/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 transition-all duration-300 my-4 ${theme.borderHover} ${theme.shadowHover}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${theme.bgAccent} border border-white/5 flex items-center justify-center w-12 h-12 text-white`}>
            {logo ? (
              <img
                src={logo}
                alt={platform}
                className="w-8 h-8 object-contain rounded-md"
              />
            ) : (
              icon
            )}
          </div>
          <div>
            <h3 className="text-white font-bold text-lg font-mono tracking-wide">
              {platform}
            </h3>
            <p className="text-secondary text-xs">
              {isGitHub ? "Developer Profile" : "Coding Profile"}
            </p>
          </div>
        </div>

        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-secondary hover:text-white hover:bg-white/10 transition-all"
            title={`View ${platform} Profile`}
          >
            <ArrowUpRight className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Stats Summary */}
      <div className="mt-6 flex items-baseline justify-between border-b border-white/5 pb-4">
        <div>
          <p className="text-secondary text-xs font-mono uppercase tracking-wider">
            {isGitHub ? "Public Repositories" : "Problems Solved"}
          </p>
          <h4 className="text-3xl font-extrabold text-white mt-1 font-mono">
            {total}
          </h4>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold ${theme.bgAccent} ${theme.text} border border-white/5`}>
          Rank Verified
        </div>
      </div>

      {/* Difficulty Progress Bars / GitHub Stats */}
      <div className="space-y-3 mt-4">
        {isGitHub ? (
          <>
            {/* Repositories */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-white/60 font-medium">Public Repos</span>
                <span className="text-white/85">{easy}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-white/40 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((easy / 30) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Followers */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-amber-400 font-medium">Followers</span>
                <span className="text-white/85">{medium}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((medium / 20) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Following */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-emerald-400 font-medium">Following</span>
                <span className="text-white/85">{hard}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((hard / 20) * 100, 100)}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Easy */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-emerald-400 font-medium">Easy</span>
                <span className="text-white/80">{easy}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: total > 0 ? `${(easy / total) * 100}%` : "0%" }}
                />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-amber-400 font-medium">Medium</span>
                <span className="text-white/80">{medium}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: total > 0 ? `${(medium / total) * 100}%` : "0%" }}
                />
              </div>
            </div>

            {/* Hard */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-rose-400 font-medium">Hard</span>
                <span className="text-white/80">{hard}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: total > 0 ? `${(hard / total) * 100}%` : "0%" }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default CodingProfileCard;