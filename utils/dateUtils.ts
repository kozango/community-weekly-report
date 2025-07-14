
/**
 * Parses a date string in "YYYY/M/D, HH:mm" format.
 * @param dateString The date string to parse.
 * @returns A Date object, or null if parsing fails.
 */
export const parseDate = (dateString: string): Date | null => {
  try {
    // The format "2025/7/8, 13:15" is directly parsable by the Date constructor in most modern browsers.
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch (e) {
    return null;
  }
};

/**
 * Formats a Date object into "YYYY-MM-DD" for input[type=date].
 * @param date The Date object.
 * @returns The formatted string.
 */
export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Formats a date range into a user-friendly Japanese string.
 * Example: "2023年10月26日(木) 〜 2023年11月1日(水)"
 * @param start The start date.
 * @param end The end date.
 * @returns The formatted string.
 */
export const formatJapaneseDateRange = (start: Date, end: Date): string => {
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const format = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日(${weekday})`;
  };
  return `${format(start)} 〜 ${format(end)}`;
};
