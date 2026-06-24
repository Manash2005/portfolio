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
          });
        } else {
          merged.get(date).gfg = Number(count);
        }
      }
    );

    const heatmapData = Array.from(
      merged.entries()
    ).map(([date, values]) => ({
      date,
      leetcode: values.leetcode,
      gfg: values.gfg,
      total:
        values.leetcode +
        values.gfg,
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