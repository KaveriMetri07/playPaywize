import moment from "moment-timezone";

export const getDateRange = (filter, timezone = "Asia/Kolkata") => {
  let start, end;

  const now = moment().tz(timezone);

  switch (filter) {
    case "today":
      start = now.clone().startOf("day");
      end = now.clone();
      break;

    case "yesterday":
      start = now.clone().subtract(1, "day").startOf("day");
      end = now.clone().startOf("day");
      break;

    case "last7":
      start = now.clone().subtract(7, "days").startOf("day");
      end = now.clone();
      break;

    case "last30":
      start = now.clone().subtract(30, "days").startOf("day");
      end = now.clone();
      break;

    default:
      return null;
  }

  return {
    start: start.toDate(),
    end: end.toDate(),
  };
};
