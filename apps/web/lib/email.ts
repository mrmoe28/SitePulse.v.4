// Mock email service for development - no external dependencies required
// In production, replace with actual email service like Resend, SendGrid, etc.

export interface EmailVerificationData {
  email: string;
  firstName: string;
  verificationToken: string;
  verificationUrl: string;
}

export async function sendVerificationEmail({
  email,
  firstName,
  verificationUrl
}: Omit<EmailVerificationData, 'verificationToken'>) {
  try {
    // Development mode - just log the email
    console.log(`[EMAIL] [DEV] Verification email for ${firstName} (${email})`);
console.log(`[LINK] Verification URL: ${verificationUrl}`);
    console.log('✅ In development mode, user registration is auto-verified');

    return { success: true, messageId: 'dev-mode-verification' };
  } catch (error) {
    console.error('Email service error:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function sendPasswordResetEmail({
  email,
  firstName,
  resetUrl
}: {
  email: string;
  firstName: string;
  resetUrl: string;
}) {
  try {
    // Development mode - just log the email
    console.log(`[EMAIL] [DEV] Password reset email for ${firstName} (${email})`);
console.log(`[LINK] Reset URL: ${resetUrl}`);

    return { success: true, messageId: 'dev-mode-reset' };
  } catch (error) {
    console.error('Email service error:', error);
    throw new Error('Failed to send password reset email');
  }
}

export async function sendPasswordChangedEmail({
  email,
  firstName
}: {
  email: string;
  firstName: string;
}) {
  try {
    // Development mode - just log the email
    console.log(`[EMAIL] [DEV] Password changed notification for ${firstName} (${email})`);
    console.log('✅ Your password has been successfully changed');

    return { success: true, messageId: 'dev-mode-password-changed' };
  } catch (error) {
    console.error('Email service error:', error);
    throw new Error('Failed to send password changed email');
  }
} 