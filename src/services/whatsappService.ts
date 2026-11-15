import { normalizePhoneNumber } from '../utils/phoneValidator';

declare const require: any;

// Safe require for Expo Linking to support pure Node unit testing environments
let Linking: any = null;
try {
  Linking = require('expo-linking');
} catch {
  Linking = null;
}

export interface WhatsAppGreetingOptions {
  phoneNumber: string;
  clientName: string;
  senderCompany?: string;
  customMessage?: string;
}

/**
 * Generates the standardized personalized greeting for WhatsApp
 */
export function buildWhatsAppGreeting(clientName: string, senderCompany: string = 'Our Company'): string {
  const name = clientName ? clientName.trim() : 'there';
  return `Hi ${name},\n\nIt was a pleasure connecting with you.\n\nThank you for sharing your contact details. We look forward to staying connected and exploring opportunities to work together.\n\nBest regards,\n${senderCompany}`;
}

/**
 * Prepares and opens WhatsApp or WhatsApp Business with pre-filled greeting.
 * Manager explicitly approves by reviewing in app and pressing Send inside WhatsApp.
 */
export async function openWhatsAppChat(options: WhatsAppGreetingOptions): Promise<{ success: boolean; error?: string }> {
  const { phoneNumber, clientName, senderCompany, customMessage } = options;

  if (!phoneNumber) {
    return { success: false, error: 'No phone number available for WhatsApp.' };
  }

  const normalized = normalizePhoneNumber(phoneNumber);
  if (!normalized.isValid || !normalized.digitsOnly) {
    return { success: false, error: 'Invalid phone number format for WhatsApp.' };
  }

  const message = customMessage || buildWhatsAppGreeting(clientName, senderCompany);
  const encodedMessage = encodeURIComponent(message);
  const targetDigits = normalized.digitsOnly;

  // Primary URL using standard Click-to-Chat (Universal link)
  const clickToChatUrl = `https://wa.me/${targetDigits}?text=${encodedMessage}`;
  // Direct deep link that prioritizes native WhatsApp / WhatsApp Business app
  const appDeepLink = `whatsapp://send?phone=${targetDigits}&text=${encodedMessage}`;

  try {
    const canOpenApp = await Linking.canOpenURL(appDeepLink);
    if (canOpenApp) {
      await Linking.openURL(appDeepLink);
      return { success: true };
    } else {
      // Fallback to Click-to-Chat web intent which Android redirects to WhatsApp Business
      await Linking.openURL(clickToChatUrl);
      return { success: true };
    }
  } catch (err: any) {
    console.error('Error opening WhatsApp:', err);
    // If opening deep link fails, try clickToChatUrl
    try {
      await Linking.openURL(clickToChatUrl);
      return { success: true };
    } catch (fallbackErr: any) {
      return {
        success: false,
        error: 'WhatsApp Business or WhatsApp is not installed on this device.',
      };
    }
  }
}

