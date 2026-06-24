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

    const data = await response.json();

    const calendarString =
      data?.data?.matchedUser?.userCalendar?.submissionCalendar;

    if (!calendarString) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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

    res.status(200).json({
      success: true,
      heatmapData,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};