import moment from "moment";

export class DateUtils {
  /** Convert any date to ISO format */
  static formatDate(date) {
    return moment(date).toISOString();
  }

  /** Add minutes to a date */
  static addMinutes(date, minutes) {
    return moment(date).add(minutes, "minutes").toDate();
  }

  /** Add hours */
  static addHours(date, hours) {
    return moment(date).add(hours, "hours").toDate();
  }

  /** Add days */
  static addDays(date, days) {
    return moment(date).add(days, "days").toDate();
  }

  /** Check if a time is expired */
  static isExpired(time) {
    return moment().isAfter(moment(time));
  }

  /** Check if a date is today */
  static isToday(date) {
    return moment(date).isSame(moment(), "day");
  }

  /** Check if two dates fall on the same day */
  static isSameDay(date1, date2) {
    return moment(date1).isSame(moment(date2), "day");
  }

  /** Convert date to readable form (e.g. "12 Feb 2025") */
  static toReadable(date) {
    return moment(date).format("DD MMM YYYY");
  }

  /** Convert to readable date-time */
  static toReadableDateTime(date) {
    return moment(date).format("DD MMM YYYY, h:mm A");
  }

  /** Get difference in minutes */
  static diffInMinutes(start, end) {
    return moment(end).diff(moment(start), "minutes");
  }

  /** Get difference in hours */
  static diffInHours(start, end) {
    return moment(end).diff(moment(start), "hours");
  }

  /** Get difference in days */
  static diffInDays(start, end) {
    return moment(end).diff(moment(start), "days");
  }

  /** Convert time to "x minutes ago" */
  static timeAgo(date) {
    return moment(date).fromNow();
  }

  /** Get current timestamp in MS */
  static now() {
    return moment().valueOf();
  }

  /** Validate if date string is valid */
  static isValidDate(date) {
    return moment(date).isValid();
  }

  /** Start of day (00:00) */
  static startOfDay(date = new Date()) {
    return moment(date).startOf("day").toDate();
  }

  /** End of day (23:59:59) */
  static endOfDay(date = new Date()) {
    return moment(date).endOf("day").toDate();
  }
}
