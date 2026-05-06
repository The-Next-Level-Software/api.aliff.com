import fetch from "node-fetch";

import appConfig from "../config/index.js";

/**
 * OneSignal Notification Service
 */
export class NotificationService {
  /**
   * Send a push notification via OneSignal
   * @param {Array<string>} playerIds - OneSignal device IDs
   * @param {string} heading - Notification title
   * @param {string} content - Notification body
   * @param {object} data - Optional additional data payload
   */
  static async sendPush(playerIds, heading, content, data = {}) {
    try {
      if (!Array.isArray(playerIds) || playerIds.length === 0) {
        throw new Error("Player IDs are required");
      }

      const body = {
        app_id: appConfig.oneSignal.appId,
        include_player_ids: playerIds,
        headings: { en: heading },
        contents: { en: content },
        data,
      };

      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${appConfig.oneSignal.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error("OneSignal error:", result);
        return null;
      }

      return result;
    } catch (error) {
      console.error("OneSignal notification failed:", error);
      return null;
    }
  }

  /**
   * Send notification to a single player ID
   * @param {string} playerId
   * @param {string} heading
   * @param {string} content
   * @param {object} data
   */
  static async sendToPlayer(playerId, heading, content, data = {}) {
    return this.sendPush([playerId], heading, content, data);
  }

  /**
   * Test OneSignal connection
   */
  static async testConnection() {
    try {
      const result = await this.sendPush([], "Test", "This is a test notification");
      return !!result;
    } catch {
      return false;
    }
  }
}
