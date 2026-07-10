export const getCodingActivity = async (req, res) => {
  try {
    const leetcodeUsername = "Manash_22";
    const gfgUsername = "swainlfei";

    // -----------------------------
    // LeetCode
    // -----------------------------

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

    const lcData = await lcResponse.json();

    const lcCalendar = JSON.parse(
      lcData.data.matchedUser.userCalendar
        .submissionCalendar
    );

    // -----------------------------
    // GFG
    // -----------------------------

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

    const gfgData = await gfgResponse.json();

    const merged = new Map();

    // -----------------------------
    // Add LeetCode
    // -----------------------------

    Object.entries(lcCalendar).forEach(
      ([timestamp, count]) => {
        const date = new Date(
          Number(timestamp) * 1000
        )
          .toISOString()
          .split("T")[0];

        merged.set(date, {
          leetcode: Number(count),
          gfg: 0,
          datavidhya: 0,
        });
      }
    );

    // -----------------------------
    // Add GFG
    // -----------------------------

    Object.entries(gfgData.result || {}).forEach(
      ([date, count]) => {
        if (!merged.has(date)) {
          merged.set(date, {
            leetcode: 0,
            gfg: Number(count),
            datavidhya: 0,
          });
        } else {
          merged.get(date).gfg = Number(count);
        }
      }
    );

    // -----------------------------
    // Add Datavidhya
    // -----------------------------

    let dvSubmissions = [];
    try {
      const dvResponse = await fetch(
        "https://datavidhya.com/api/v1/user/profile/cmql0m2t1017eckdjrzzxl3px/"
      );
      if (dvResponse.ok) {
        const dvData = await dvResponse.json();
        dvSubmissions = dvData?.data?.allSubmissions || [];
      }
    } catch (err) {
      console.error("Datavidhya fetch error:", err);
    }

    dvSubmissions.forEach((sub) => {
      if (!sub.createdAt) return;
      const date = sub.createdAt.split("T")[0];
      if (!merged.has(date)) {
        merged.set(date, {
          leetcode: 0,
          gfg: 0,
          datavidhya: 1,
        });
      } else {
        const entry = merged.get(date);
        entry.datavidhya = (entry.datavidhya || 0) + 1;
      }
    });

    const heatmapData = Array.from(
      merged.entries()
    ).map(([date, values]) => ({
      date,
      count:
        (values.leetcode || 0) +
        (values.gfg || 0) +
        (values.datavidhya || 0),
    }));

    return res.status(200).json({
      success: true,
      heatmapData,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDatavidhyaStats = async (req, res) => {
  try {
    const userId = req.params.userId || "cmql0m2t1017eckdjrzzxl3px";
    const response = await fetch(
      `https://datavidhya.com/api/v1/user/profile/${userId}/`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch Datavidhya stats");
    }

    const data = await response.json();
    const qns = data?.data?.userStats?.solvedByDiff;

    if (!qns) {
      return res.status(404).json({
        success: false,
        message: "No solved stats available",
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        easy: qns.easy || 0,
        medium: qns.medium || 0,
        hard: qns.hard || 0,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};