export class StringUtils {
  /**
   * Generate a username from a name string
   * @param {string} name - Full name of the user
   * @returns {string} - Generated username
   */
  static generateUsername(name) {
    if (!name || typeof name !== "string") return `user${Date.now()}`;

    // Take first and last name if available
    const parts = name.trim().toLowerCase().split(" ");
    const base = parts.length > 1 ? parts[0] + parts[parts.length - 1] : parts[0];

    // Add random number to reduce collisions
    const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit number

    return `${base}${randomNum}`;
  }

  /** Capitalize first letter */
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /** Convert camelCase → snake_case */
  static toSnake(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /** Convert camelCase → kebab-case */
  static toKebab(str) {
    return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  }

  /** Truncate string with ... */
  static truncate(str, length) {
    return str.length > length ? str.substring(0, length) + "..." : str;
  }

  /** Check if string is empty/blank */
  static isEmpty(str) {
    return !str || str.trim().length === 0;
  }

  /** Reverse full string */
  static reverse(str) {
    return str.split("").reverse().join("");
  }

  /** Repeat a string n times */
  static repeat(str, times) {
    return str.repeat(times);
  }

  /** Pad string on both sides */
  static pad(str, length, char = " ") {
    return str.padStart(length, char).padEnd(length, char);
  }

  /** Convert to slug */
  static slugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-");
  }

  /** Example: "hello-world" → "Hello World" */
  static deslugify(str) {
    return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** Count substring occurrences */
  static countOccurrences(str, subStr) {
    const regex = new RegExp(subStr, "g");
    const matches = str.match(regex);
    return matches ? matches.length : 0;
  }

  /** Extract emails */
  static extractEmails(str) {
    const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return str.match(regex) || [];
  }

  /** Extract URLs */
  static extractUrls(str) {
    const regex = /(https?:\/\/[^\s]+)/g;
    return str.match(regex) || [];
  }

  /** Convert to Title Case */
  static titleCase(str) {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /** Convert to camelCase */
  static camelCase(str) {
    return str
      .toLowerCase()
      .split(" ")
      .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
      .join("");
  }

  /** Reverse word order */
  static reverseWords(str) {
    return str.split(" ").reverse().join(" ");
  }

  /** Remove vowels */
  static removeVowels(str) {
    return str.replace(/[aeiouAEIOU]/g, "");
  }

  /** Count words */
  static wordCount(str) {
    return str.trim().split(/\s+/).length;
  }

  /** Check palindrome */
  static isPalindrome(str) {
    const cleaned = str.replace(/[\W_]/g, "").toLowerCase();
    return cleaned === cleaned.split("").reverse().join("");
  }

  /** Highlight substring */
  static highlight(str, subStr, highlightChar = "*") {
    const regex = new RegExp(`(${subStr})`, "gi");
    return str.replace(regex, `${highlightChar}$1${highlightChar}`);
  }

  /** Format bytes into KB/MB/GB */
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  /** Escape HTML */
  static escapeHtml(str) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
  }

  /** Unescape HTML */
  static unescapeHtml(str) {
    const map = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#039;": "'",
    };
    return str.replace(/&(amp|lt|gt|quot|#039);/g, (m) => map[m]);
  }

  /** Pad number with zeros */
  static padNumber(num, length) {
    return num.toString().padStart(length, "0");
  }

  /** Format currency */
  static currency(num, locale = "en-US", currency = "USD") {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(num);
  }

  /** Remove all HTML tags */
  static stripHtml(str) {
    return str.replace(/<\/?[^>]+(>|$)/g, "");
  }

  /** Normalize extra spaces */
  static normalizeWhitespace(str) {
    return str.replace(/\s+/g, " ").trim();
  }

  /** Generate slug */
  static generateSlug(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /** Extract numbers */
  static extractNumbers(str) {
    const regex = /\d+/g;
    return str.match(regex) || [];
  }

  /** Mask string: abc123 → a***23 */
  static mask(str, visibleStart = 1, visibleEnd = 1, maskChar = "*") {
    const length = str.length;
    if (length <= visibleStart + visibleEnd) return str;

    const masked = maskChar.repeat(length - visibleStart - visibleEnd);
    return str.slice(0, visibleStart) + masked + str.slice(length - visibleEnd);
  }

  /** Shuffle characters */
  static shuffle(str) {
    const arr = str.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join("");
  }

  /** Bad work checker */
  static badWordChecker(str) {
    //
  }
}
