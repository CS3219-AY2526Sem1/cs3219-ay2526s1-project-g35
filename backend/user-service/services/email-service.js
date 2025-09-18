import nodemailer from 'nodemailer';
import {
  generateRegistrationOTPTemplate,
  generateRegistrationOTPTextTemplate,
  generateGenericOTPTemplate,
  generateGenericOTPTextTemplate
} from '../templates/email-templates.js';

/**
 * Email Service for sending OTP and other transactional emails
 * Currently configured as a stub/mock service with Mailtrap support
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.emailConfig = {
      enabled: process.env.EMAIL_ENABLED === 'true' || false,
      provider: process.env.EMAIL_PROVIDER || 'mailtrap', // 'mailtrap', 'gmail', 'smtp'
      fromEmail: process.env.EMAIL_FROM || 'noreply@peerprep.com',
      fromName: process.env.EMAIL_FROM_NAME || 'PeerPrep Team',
      
      // Mailtrap configuration
      mailtrap: {
        host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
        port: parseInt(process.env.MAILTRAP_PORT) || 2525,
        user: process.env.MAILTRAP_USER || '',
        pass: process.env.MAILTRAP_PASS || '',
      },
      
      // SMTP configuration (for production)
      smtp: {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || false,
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      }
    };

    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on configuration
   */
  initializeTransporter() {
    if (!this.emailConfig.enabled) {
      console.log('Email service is disabled - emails will be logged only');
      return;
    }

    try {
      let transporterConfig;

      switch (this.emailConfig.provider) {
        case 'mailtrap':
          transporterConfig = {
            host: this.emailConfig.mailtrap.host,
            port: this.emailConfig.mailtrap.port,
            auth: {
              user: this.emailConfig.mailtrap.user,
              pass: this.emailConfig.mailtrap.pass,
            },
          };
          break;

        case 'smtp':
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

      this.transporter = nodemailer.createTransporter(transporterConfig);
      this.isConfigured = true;
      
      // Verify configuration
      this.verifyConnection();
      
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
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
      console.log('Email service connected successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
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
    const { username = 'User' } = options;
    
    const emailData = {
      to: email,
      subject: 'Verify Your PeerPrep Account - OTP Code',
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
  async sendOTP(email, otp, purpose = 'verification', options = {}) {
    const { username = 'User', expiryMinutes = 5 } = options;
    
    const emailData = {
      to: email,
      subject: `Your PeerPrep ${purpose} Code`,
      html: generateGenericOTPTemplate(otp, purpose, username, expiryMinutes),
      text: generateGenericOTPTextTemplate(otp, purpose, username, expiryMinutes),
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
      error: null
    };

    // If email is disabled or not configured, log the email instead
    if (!this.emailConfig.enabled || !this.isConfigured || !this.transporter) {
      console.log('📧 EMAIL MOCK SERVICE - Email would be sent:');
      console.log(`To: ${emailData.to}`);
      console.log(`Subject: ${emailData.subject}`);
      console.log(`Body: ${emailData.text}`);
      console.log('---');
      
      result.success = true;
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

      const info = await this.transporter.sendMail(mailOptions);
      
      result.success = true;
      
      console.log(`Email sent successfully to ${emailData.to}`);
      
    } catch (error) {
      console.error('Failed to send email:', error);
      result.error = error.message;
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