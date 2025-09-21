/**
 * Email Templates for OTP and other transactional emails
 * Professional, responsive email templates for PeerPrep
 */

/**
 * Generate HTML template for registration OTP email
 */
export function generateRegistrationOTPTemplate(otp, username) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your PeerPrep Account</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: #4CAF50; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-box { background: white; border: 2px solid #4CAF50; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 8px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        .warning { color: #e74c3c; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to PeerPrep!</h1>
        </div>
        <div class="content">
            <h2>Hello ${username},</h2>
            <p>Thank you for registering with PeerPrep! To complete your account verification, please use the following One-Time Password (OTP):</p>
            
            <div class="otp-box">
                <p><strong>Your verification code is:</strong></p>
                <div class="otp-code">${otp}</div>
            </div>

            <p><strong>Important:</strong></p>
            <ul>
                <li>This code will expire in <strong>5 minutes</strong></li>
                <li>Use this code only once to verify your account</li>
                <li>Do not share this code with anyone</li>
            </ul>

            <p>If you didn't request this verification, please ignore this email or contact our support team.</p>

            <div class="footer">
                <p>Best regards,<br>The PeerPrep Team</p>
                <p class="warning">This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate text template for registration OTP email
 */
export function generateRegistrationOTPTextTemplate(otp, username) {
  return `
Welcome to PeerPrep!

Hello ${username},

Thank you for registering with PeerPrep! To complete your account verification, please use the following One-Time Password (OTP):

Your verification code: ${otp}

Important:
- This code will expire in 5 minutes
- Use this code only once to verify your account
- Do not share this code with anyone

If you didn't request this verification, please ignore this email or contact our support team.

Best regards,
The PeerPrep Team

This is an automated email. Please do not reply to this message.
`;
}

/**
 * Generate HTML template for generic OTP email
 */
export function generateGenericOTPTemplate(
  otp,
  purpose,
  username,
  expiryMinutes
) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your PeerPrep ${purpose} Code</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: #2196F3; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-box { background: white; border: 2px solid #2196F3; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #2196F3; letter-spacing: 8px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        .warning { color: #e74c3c; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PeerPrep ${purpose}</h1>
        </div>
        <div class="content">
            <h2>Hello ${username},</h2>
            <p>You have requested a ${purpose} code. Please use the following One-Time Password (OTP):</p>
            
            <div class="otp-box">
                <p><strong>Your ${purpose} code is:</strong></p>
                <div class="otp-code">${otp}</div>
            </div>

            <p><strong>Important:</strong></p>
            <ul>
                <li>This code will expire in <strong>${expiryMinutes} minutes</strong></li>
                <li>Use this code only once</li>
                <li>Do not share this code with anyone</li>
            </ul>

            <p>If you didn't request this code, please ignore this email or contact our support team.</p>

            <div class="footer">
                <p>Best regards,<br>The PeerPrep Team</p>
                <p class="warning">This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate text template for generic OTP email
 *
 */
export function generateGenericOTPTextTemplate(
  otp,
  purpose,
  username,
  expiryMinutes
) {
  return `
PeerPrep ${purpose}

Hello ${username},

You have requested a ${purpose} code. Please use the following One-Time Password (OTP):

Your ${purpose} code: ${otp}

Important:
- This code will expire in ${expiryMinutes} minutes
- Use this code only once
- Do not share this code with anyone

If you didn't request this code, please ignore this email or contact our support team.

Best regards,
The PeerPrep Team

This is an automated email. Please do not reply to this message.
`;
}
