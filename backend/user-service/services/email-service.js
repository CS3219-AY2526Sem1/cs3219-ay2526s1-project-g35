import nodemailer from "nodemailer";
import {
  generateRegistrationOTPTemplate,
  generateRegistrationOTPTextTemplate,
  generateGenericOTPTemplate,
  generateGenericOTPTextTemplate,
} from "../templates/email-templates.js";

/**
 * Email Service for sending OTP and other transactional emails
 * Configured for Mailtrap SMTP sandbox
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.emailConfig = {
      enabled: process.env.EMAIL_ENABLED === "true",
      provider: process.env.EMAIL_PROVIDER,
      fromEmail: process.env.EMAIL_FROM,
      fromName: process.env.EMAIL_FROM_NAME,

      // Mailtrap configuration
      mailtrap: {
        host: process.env.MAILTRAP_HOST,
        port: parseInt(process.env.MAILTRAP_PORT),
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },

      // SMTP configuration (for production)
      smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on configuration
   */
  initializeTransporter() {
    console.log("Initializing email service...");
    console.log("Email config:", {
      enabled: this.emailConfig.enabled,
      provider: this.emailConfig.provider,
      fromEmail: this.emailConfig.fromEmail,
      fromName: this.emailConfig.fromName,
      host: this.emailConfig.mailtrap?.host,
      port: this.emailConfig.mailtrap?.port,
      hasUser: !!this.emailConfig.mailtrap?.user,
      hasPass: !!this.emailConfig.mailtrap?.pass,
    });

    if (!this.emailConfig.enabled) {
      console.log("Email service is disabled");
      return;
    }

    try {
      let transporterConfig;

      switch (this.emailConfig.provider) {
        case "mailtrap":
          transporterConfig = {
            host: this.emailConfig.mailtrap.host,
            port: this.emailConfig.mailtrap.port,
            auth: {
              user: this.emailConfig.mailtrap.user,
              pass: this.emailConfig.mailtrap.pass,
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 5000, // 5 seconds
            socketTimeout: 10000, // 10 seconds
          };
          break;

        case "smtp":
          transporterConfig = {
            host: this.emailConfig.smtp.host,
            port: this.emailConfig.smtp.port,
            secure: this.emailConfig.smtp.secure,
            auth: {
              user: this.emailConfig.smtp.user,
              pass: this.emailConfig.smtp.pass,
            },
          };
          break;

        default:
          console.warn(`Unknown email provider: ${this.emailConfig.provider}`);
          return;
      }

      this.transporter = nodemailer.createTransport(transporterConfig);
      this.isConfigured = true;

      console.log(
        `Email transporter created successfully for provider: ${this.emailConfig.provider}`
      );

      // Verify configuration
      this.verifyConnection();
    } catch (error) {
      console.error("Failed to initialize email transporter:", error);
      this.isConfigured = false;
    }
  }

  /**
   * Verify email service connection
   */
  async verifyConnection() {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log("Email service connected successfully");
      return true;
    } catch (error) {
      console.error("Email service connection failed:", error);
      this.isConfigured = false;
      return false;
    }
  }

  /**
   * Send OTP email for registration verification
   * @param {string} email - Recipient email
   * @param {string} otp - OTP code
   * @param {Object} options - Additional options (username, etc.)
   * @returns {Object} Send result
   */
  async sendRegistrationOTP(email, otp, options = {}) {
    const { username = "User" } = options;

    const emailData = {
      to: email,
      subject: "Verify Your PeerPrep Account - OTP Code",
      html: generateRegistrationOTPTemplate(otp, username),
      text: generateRegistrationOTPTextTemplate(otp, username),
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send generic OTP email
   * @param {string} email - Recipient email
   * @param {string} otp - OTP code
   * @param {string} purpose - Purpose of OTP
   * @param {Object} options - Additional options
   * @returns {Object} Send result
   */
  async sendOTP(email, otp, purpose = "verification", options = {}) {
    const { username = "User", expiryMinutes = 5 } = options;

    const emailData = {
      to: email,
      subject: `Your PeerPrep ${purpose} Code`,
      html: generateGenericOTPTemplate(otp, purpose, username, expiryMinutes),
      text: generateGenericOTPTextTemplate(
        otp,
        purpose,
        username,
        expiryMinutes
      ),
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Core email sending function
   * @param {Object} emailData - Email data (to, subject, html, text)
   * @returns {Object} Send result
   */
  async sendEmail(emailData) {
    const result = {
      success: false,
      error: null,
    };

    // Check if email service is properly configured
    if (!this.emailConfig.enabled || !this.isConfigured || !this.transporter) {
      const error = "Email service is not properly configured";
      console.error(error);
      result.error = error;
      return result;
    }

    try {
      const mailOptions = {
        from: `"${this.emailConfig.fromName}" <${this.emailConfig.fromEmail}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      };

      console.log(
        `Attempting to send email to ${emailData.to} via ${this.emailConfig.provider}`
      );

      // Add timeout protection (15 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Email sending timeout after 15 seconds")),
          15000
        );
      });

      const info = await Promise.race([
        this.transporter.sendMail(mailOptions),
        timeoutPromise,
      ]);

      result.success = true;

      console.log(
        `Email sent successfully to ${emailData.to}. Message ID: ${info.messageId}`
      );
    } catch (error) {
      console.error("Failed to send email:", error);
      result.error = error.message;

      // Log additional error details for debugging
      if (error.code) {
        console.error("Error code:", error.code);
      }
      if (error.response) {
        console.error("SMTP response:", error.response);
      }
    }

    return result;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      enabled: this.emailConfig.enabled,
      configured: this.isConfigured,
      provider: this.emailConfig.provider,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
export { EmailService };
