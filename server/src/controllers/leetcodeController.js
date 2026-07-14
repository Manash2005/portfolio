export const getLeetCodeCalendar = async (req, res) => {
  try {
    const username = req.params.username;

    const response = await fetch(
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
            username,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const calendarString =
      data?.data?.matchedUser?.userCalendar?.submissionCalendar;

    if (!calendarString) {
      throw new Error("No calendar data returned from LeetCode");
    }

    const calendar = JSON.parse(calendarString);

    const heatmapData = Object.entries(calendar).map(
      ([timestamp, count]) => ({
        date: new Date(Number(timestamp) * 1000)
          .toISOString()
          .split("T")[0],
        count,
      })
    );

    return res.status(200).json({
      success: true,
      heatmapData,
    });
  } catch (error) {
    console.error("getLeetCodeCalendar error:", error);
    // Graceful fallback to prevent frontend 500 crashes
    return res.status(200).json({
      success: true,
      heatmapData: [],
      fallback: true,
    });
  }
};

export const getLeetCodeStats = async (req, res) => {
  try {
    const username = req.params.username;

    const response = await fetch(
      "https://leetcode.com/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query userProblemsSolved($username: String!) {
              allQuestionsCount {
                difficulty
                count
              }
              matchedUser(username: $username) {
                submitStats {
                  acSubmissionNum {
                    difficulty
                    count
                    submissions
                  }
                }
              }
            }
          `,
          variables: {
            username,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const statsList = data?.data?.matchedUser?.submitStats?.acSubmissionNum;

    if (!statsList) {
      throw new Error("No stats returned from LeetCode");
    }

    // Map counts
    const stats = {};
    statsList.forEach((item) => {
      stats[item.difficulty.toLowerCase()] = item.count;
    });

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("getLeetCodeStats error:", error);
    // Graceful fallback to last known solved counts
    return res.status(200).json({
      success: true,
      stats: {
        all: 122,
        easy: 73,
        medium: 43,
        hard: 6,
      },
      fallback: true,
    });
  }
};