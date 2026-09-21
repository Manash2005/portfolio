let activityCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

export const getCodingActivity = async (req, res) => {
  res.set("Cache-Control", "public, max-age=3600");

  const now = Date.now();
  if (activityCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return res.status(200).json({
      success: true,
      heatmapData: activityCache,
      cached: true,
    });
  }

  const merged = new Map();

  // -----------------------------
  // LeetCode
  // -----------------------------
  try {
    const leetcodeUsername = "Manash_22";
    const lcResponse = await fetch(
      "https://leetcode.com/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query userProfileCalendar($username: String!) {
              matchedUser(username: $username) {
                userCalendar {
                  submissionCalendar
                }
              }
            }
          `,
          variables: {
            username: leetcodeUsername,
          },
        }),
      }
    );

    if (lcResponse.ok) {
      const lcData = await lcResponse.json();
      const calendarString =
        lcData?.data?.matchedUser?.userCalendar?.submissionCalendar;
      if (calendarString) {
        const lcCalendar = JSON.parse(calendarString);
        Object.entries(lcCalendar).forEach(([timestamp, count]) => {
          const date = new Date(Number(timestamp) * 1000)
            .toISOString()
            .split("T")[0];
          merged.set(date, {
            leetcode: Number(count),
            gfg: 0,
          });
        });
      }
    }
  } catch (error) {
    console.error("Leetcode calendar fetch failed:", error);
  }

  // -----------------------------
  // GFG (fetch current and previous year)
  // -----------------------------
  try {
    const gfgUsername = "swainlfei";
    const currentYear = new Date().getFullYear();
    const yearsToFetch = [currentYear - 1, currentYear];

    for (const yr of yearsToFetch) {
      try {
        const gfgResponse = await fetch(
          "https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              handle: gfgUsername,
              requestType: "getYearwiseUserSubmissions",
              year: String(yr),
              month: "",
            }),
          }
        );

        if (gfgResponse.ok) {
          const gfgData = await gfgResponse.json();
          Object.entries(gfgData.result || {}).forEach(([date, count]) => {
            if (!merged.has(date)) {
              merged.set(date, {
                leetcode: 0,
                gfg: Number(count),
              });
            } else {
              merged.get(date).gfg = Number(count);
            }
          });
        }
      } catch (err) {
        console.error(`GFG year ${yr} fetch failed:`, err);
      }
    }
  } catch (error) {
    console.error("GFG submissions fetch failed:", error);
  }

  const heatmapData = Array.from(merged.entries()).map(([date, values]) => ({
    date,
    count: (values.leetcode || 0) + (values.gfg || 0),
    leetcode: values.leetcode || 0,
    gfg: values.gfg || 0,
  }))

  // Update in-memory cache
  activityCache = heatmapData
  cacheTimestamp = Date.now()

  return res.status(200).json({
    success: true,
    heatmapData,
  })
}

// ── NEW: LeetCode calendar proxy (server-to-server, no CORS) ──────────────
export const getLeetcodeCalendar = async (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600')
  try {
    const username = req.params.username || 'Manash_22'
    const lcResponse = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query userProfileCalendar($username: String!) {
          matchedUser(username: $username) {
            userCalendar { submissionCalendar }
          }
        }`,
        variables: { username },
      }),
    })
    if (!lcResponse.ok) throw new Error(`LC GraphQL ${lcResponse.status}`)
    const lcData = await lcResponse.json()
    const calStr = lcData?.data?.matchedUser?.userCalendar?.submissionCalendar
    if (!calStr) return res.status(200).json({ success: true, calendar: {} })
    const cal = JSON.parse(calStr)
    // Convert Unix timestamps to YYYY-MM-DD
    const calendar = {}
    Object.entries(cal).forEach(([ts, count]) => {
      const date = new Date(Number(ts) * 1000).toISOString().split('T')[0]
      calendar[date] = Number(count)
    })
    return res.status(200).json({ success: true, calendar })
  } catch (err) {
    console.error('getLeetcodeCalendar error:', err)
    return res.status(200).json({ success: false, calendar: {} })
  }
}

// ── NEW: GFG calendar proxy (server-to-server, no CORS) ───────────────────
export const getGfgCalendar = async (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600')
  try {
    const username = req.params.username || 'swainlfei'
    const currentYear = new Date().getFullYear()
    const calendar = {}
    for (const yr of [currentYear - 1, currentYear]) {
      try {
        const gfgRes = await fetch(
          'https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              handle: username,
              requestType: 'getYearwiseUserSubmissions',
              year: String(yr),
              month: '',
            }),
          }
        )
        if (gfgRes.ok) {
          const gfgData = await gfgRes.json()
          Object.entries(gfgData.result || {}).forEach(([date, count]) => {
            calendar[date] = Number(count)
          })
        }
      } catch (err) {
        console.error(`GFG year ${yr} error:`, err)
      }
    }
    return res.status(200).json({ success: true, calendar })
  } catch (err) {
    console.error('getGfgCalendar error:', err)
    return res.status(200).json({ success: false, calendar: {} })
  }
}

export const getGithubStats = async (req, res) => {
  try {
    const username = req.params.username || "Manash2005";
    const response = await fetch(`https://api.github.com/users/${username}`);
    
    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      stats: {
        repos: data.public_repos || 0,
        followers: data.followers || 0,
        following: data.following || 0,
      },
    });
  } catch (error) {
    console.error("getGithubStats error:", error);
    // Graceful fallback to avoid frontend 500 crashes
    return res.status(200).json({
      success: true,
      stats: {
        repos: 17,
        followers: 1,
        following: 1,
      },
      fallback: true,
    });
  }
};

export const getGithubHeatmap = async (req, res) => {
  try {
    const username = req.params.username || "Manash2005";
    const response = await fetch(`https://github.com/users/${username}/contributions`);
    
    if (!response.ok) {
      throw new Error(`GitHub contributions page returned status ${response.status}`);
    }
    
    const html = await response.text();
    
    const tags = html.match(/<td[^>]*class="[^"]*ContributionCalendar-day[^"]*"[^>]*>/g) || [];
    
    const heatmapData = tags.map((tag) => {
      const dateMatch = tag.match(/data-date="([^"]+)"/);
      const levelMatch = tag.match(/data-level="([^"]+)"/);
      
      if (dateMatch && levelMatch) {
        const level = parseInt(levelMatch[1], 10);
        let count = 0;
        if (level === 1) count = 2;
        else if (level === 2) count = 4;
        else if (level === 3) count = 7;
        else if (level === 4) count = 12;
        
        return {
          date: dateMatch[1],
          count,
        };
      }
      return null;
    }).filter(Boolean);
    
    return res.status(200).json({
      success: true,
      heatmapData,
    });
  } catch (error) {
    console.error("getGithubHeatmap error:", error);
    
    // Generate empty 365-day calendar fallback
    const heatmapData = [];
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 365);
    const curr = new Date(start);
    while (curr <= end) {
      heatmapData.push({
        date: curr.toISOString().split("T")[0],
        count: 0,
      });
      curr.setDate(curr.getDate() + 1);
    }
    
    return res.status(200).json({
      success: true,
      heatmapData,
      fallback: true,
    });
  }
};