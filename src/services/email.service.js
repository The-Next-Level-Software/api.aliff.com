import fs from "fs";
import nodemailer from "nodemailer";
import path from "path";

import appConfig from "../config/index.js";
// import constants from '../constants/constant.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: appConfig.email.host,
      port: appConfig.email.port,
      secure: appConfig.email.secure,
      auth: {
        user: appConfig.email.user,
        pass: appConfig.email.pass,
      },
    });
  }

  /**
   * Load HTML template from /templates folder
   */
  loadTemplate(templateName) {
    const filePath = path.resolve(`src/templates/${templateName}.html`);
    return fs.readFileSync(filePath, "utf8");
  }

  /**
   * Replace variables in template like {{name}}, {{projectName}}
   */
  parseTemplate(template, variables = {}) {
    let html = template;

    const mergedVars = {
      // ...constants,
      ...variables,
      year: new Date().getFullYear(),
    };

    for (const key in mergedVars) {
      html = html.replace(new RegExp(`{{${key}}}`, "g"), mergedVars[key]);
    }

    return html;
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, text = null, html = null, attachments = []) {
    const mailOptions = {
      from: `${appConfig.email.fromName} <${appConfig.email.fromEmail}>`,
      to,
      subject,
      text,
      html,
      attachments,
    };

    return this.transporter.sendMail(mailOptions);
  }

  /**
   * Send template email
   */
  async sendTemplate(templateName, to, subject, variables = {}) {
    const template = this.loadTemplate(templateName);
    const html = this.parseTemplate(template, variables);

    return this.sendEmail(to, subject, null, html);
  }

  // -------------------------
  // Email Types
  // -------------------------

  async sendWelcomeEmail(to, name) {
    return this.sendTemplate("welcome", to, "Welcome to Our Platform 🎉", {
      name,
    });
  }

  async sendOTPEmail(to, otp) {
    return this.sendTemplate("otp", to, "Your OTP Code", { otp });
  }

  async sendPasswordResetEmail(to, link) {
    return this.sendTemplate("password-reset", to, "Password Reset Request", {
      resetLink: link,
    });
  }

  async sendVerificationEmail(to, verificationLink) {
    return this.sendTemplate("email-verification", to, "Verify Your Email", { verificationLink });
  }

  async sendGenericEmail(to, subject, message) {
    return this.sendTemplate("generic", to, subject, { message });
  }

  /**
   * Verify SMTP Connection
   */
  async verifyConnection() {
    return this.transporter.verify();
  }
}

export const emailService = new EmailService();
