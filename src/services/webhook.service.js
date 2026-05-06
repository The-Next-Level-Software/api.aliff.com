import axios from "axios";

/**
 * WebhookService
 * Provides methods to send webhooks to external services
 */
class WebhookService {
  /**
   * Send a POST webhook
   * @param {string} url - Target webhook URL
   * @param {Object} payload - JSON payload to send
   * @param {Object} headers - Optional HTTP headers
   * @param {number} timeout - Request timeout in ms (default: 5000)
   */
  static async sendPost(url, payload = {}, headers = {}, timeout = 5000) {
    try {
      const response = await axios.post(url, payload, { headers, timeout });
      return {
        success: true,
        status: response.status,
        data: response.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        status: err.response?.status || 500,
        data: err.response?.data || null,
      };
    }
  }

  /**
   * Send a GET webhook
   * @param {string} url - Target webhook URL
   * @param {Object} params - Query parameters
   * @param {Object} headers - Optional HTTP headers
   * @param {number} timeout - Request timeout in ms (default: 5000)
   */
  static async sendGet(url, params = {}, headers = {}, timeout = 5000) {
    try {
      const response = await axios.get(url, { params, headers, timeout });
      return {
        success: true,
        status: response.status,
        data: response.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        status: err.response?.status || 500,
        data: err.response?.data || null,
      };
    }
  }

  /**
   * Generic webhook sender
   * @param {string} url
   * @param {string} method - 'POST' | 'GET' | 'PUT' | 'DELETE'
   * @param {Object} payload
   * @param {Object} headers
   * @param {number} timeout
   */
  static async send(url, method = "POST", payload = {}, headers = {}, timeout = 5000) {
    try {
      const response = await axios({
        url,
        method: method.toLowerCase(),
        data: payload,
        headers,
        timeout,
      });

      return {
        success: true,
        status: response.status,
        data: response.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        status: err.response?.status || 500,
        data: err.response?.data || null,
      };
    }
  }
}

export const webhookService = WebhookService;
