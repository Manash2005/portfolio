import { motion, AnimatePresence } from 'motion/react'
import { SiLeetcode, SiGeeksforgeeks } from 'react-icons/si'
import { FaGithub } from 'react-icons/fa'

const TABS = [
  { key: 'all',      label: 'All' },
  { key: 'github',   label: 'GitHub',   Icon: FaGithub },
  { key: 'leetcode', label: 'LeetCode', Icon: SiLeetcode },
  { key: 'gfg',      label: 'GFG',      Icon: SiGeeksforgeeks },
]

export default function SourceTabs({
  activeTab,
  onTabChange,
  leetcodeSummary,
  gfgSummary,
  githubTotal,
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Segmented control bar */}
      <div className="flex items-center self-start p-1 rounded-full border border-hairline bg-[#0E0E14]/80 backdrop-blur-md">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const Icon = tab.Icon

          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono transition-colors focus-visible:outline-none"
              style={{
                color: isActive ? '#08080C' : 'var(--color-muted)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="activity-tab-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'var(--color-accent)' }}
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              {Icon && (
                <span className="relative z-10 text-[13px] opacity-90">
                  <Icon />
                </span>
              )}
              <span className="relative z-10 font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Quiet one-line summary */}
      <div className="h-6 flex items-center">
        <AnimatePresence mode="wait">
          {activeTab === 'leetcode' && (
            <motion.div
              key="lc-summary"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-xs font-mono"
              style={{ color: 'var(--color-muted)' }}
            >
              <span>
                <strong style={{ color: 'var(--color-text)' }}>{leetcodeSummary?.total || 124}</strong> solved:
                {' '}
                <span style={{ color: '#88E5BE' }}>{leetcodeSummary?.easy || 75} Easy</span> ·{' '}
                <span style={{ color: '#FFB84D' }}>{leetcodeSummary?.medium || 43} Med</span> ·{' '}
                <span style={{ color: '#FF6B6B' }}>{leetcodeSummary?.hard || 6} Hard</span>
              </span>
              <span>·</span>
              <a
                href="https://leetcode.com/u/Manash_22/"
                target="_blank"
                rel="noreferrer"
                className="hover:underline transition-colors"
                style={{ color: 'var(--color-accent)' }}
              >
                Profile ↗
              </a>
            </motion.div>
          )}

          {activeTab === 'gfg' && (
            <motion.div
              key="gfg-summary"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-xs font-mono"
              style={{ color: 'var(--color-muted)' }}
            >
              <span>
                <strong style={{ color: 'var(--color-text)' }}>{gfgSummary?.total || 175}</strong> solved:
                {' '}
                <span style={{ color: '#88E5BE' }}>{gfgSummary?.easy || 76} Easy</span> ·{' '}
                <span style={{ color: '#FFB84D' }}>{gfgSummary?.medium || 49} Med</span> ·{' '}
                <span style={{ color: '#FF6B6B' }}>{gfgSummary?.hard || 2} Hard</span>
              </span>
              <span>·</span>
              <a
                href="https://www.geeksforgeeks.org/user/swainlfei/"
                target="_blank"
                rel="noreferrer"
                className="hover:underline transition-colors"
                style={{ color: 'var(--color-accent)' }}
              >
                Profile ↗
              </a>
            </motion.div>
          )}

          {activeTab === 'github' && (
            <motion.div
              key="gh-summary"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-xs font-mono"
              style={{ color: 'var(--color-muted)' }}
            >
              <span>
                <strong style={{ color: 'var(--color-text)' }}>{githubTotal}</strong> contributions in the last year
              </span>
              <span>·</span>
              <a
                href="https://github.com/Manash2005"
                target="_blank"
                rel="noreferrer"
                className="hover:underline transition-colors"
                style={{ color: 'var(--color-accent)' }}
              >
                @Manash2005 ↗
              </a>
            </motion.div>
          )}

          {activeTab === 'all' && (
            <motion.div
              key="all-summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-mono"
              style={{ color: 'var(--color-muted)' }}
            >
              Merged rolling 12-month activity across GitHub, LeetCode & GFG
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
