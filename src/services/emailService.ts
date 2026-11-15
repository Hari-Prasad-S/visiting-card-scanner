import { isValidEmail } from '../utils/emailValidator';

declare const require: any;

// Safe require for Expo Linking to support pure Node unit testing environments
let Linking: any = null;
try {
  Linking = require('expo-linking');
} catch {
  Linking = null;
}

export interface EmailGreetingOptions {
  email: string;
  clientName: string;
  senderCompany?: string;
  customSubject?: string;
  customBody?: string;
}

/**
 * Builds standard email subject
 */
export function buildEmailSubject(clientName: string): string {
  const name = clientName ? clientName.trim() : 'Valued Client';
  return `Welcome, ${name}!`;
}

/**
 * Builds standard personalized email body
 */
export function buildEmailBody(clientName: string, senderCompany: string = 'Our Company'): string {
  const name = clientName ? clientName.trim() : 'there';
  return `Dear ${name},\n\nIt was a pleasure connecting with you.\n\nThank you for sharing your contact details. We look forward to building a professional relationship.\n\nBest regards,\n${senderCompany}`;
}

/**
 * Opens device's default email client with pre-filled recipient, subject and body
 */
export async function openEmailDraft(options: EmailGreetingOptions): Promise<{ success: boolean; error?: string }> {
  const { email, clientName, senderCompany, customSubject, customBody } = options;

  if (!email || !isValidEmail(email)) {
    return { success: false, error: 'Valid email address is required for email fallback.' };
  }

  const subject = customSubject || buildEmailSubject(clientName);
  const body = customBody || buildEmailBody(clientName, senderCompany);

  const mailtoUrl = `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  try {
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (!canOpen) {
      return { success: false, error: 'No email application configured on this device.' };
    }
    await Linking.openURL(mailtoUrl);
    return { success: true };
  } catch (err: any) {
    console.error('Error opening email client:', err);
    return {
      success: false,
      error: err?.message || 'Failed to open email application.',
    };
  }
}

