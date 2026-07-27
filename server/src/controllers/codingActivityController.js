export const getCodingActivity = async (req, res) => {
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
  // GFG
  // -----------------------------
  try {
    const gfgUsername = "swainlfei";
    const year = new Date().getFullYear();
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
          year: String(year),
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
  } catch (error) {
    console.error("GFG submissions fetch failed:", error);
  }

  const heatmapData = Array.from(merged.entries()).map(([date, values]) => ({
    date,
    count: (values.leetcode || 0) + (values.gfg || 0),
  }));

  return res.status(200).json({
    success: true,
    heatmapData,
  });
};

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