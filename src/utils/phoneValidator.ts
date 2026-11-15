/**
 * Phone number validation, extraction, and international normalization utilities
 */

export interface NormalizedPhone {
  raw: string;
  e164: string;           // E.g. "+919876543210"
  digitsOnly: string;     // E.g. "919876543210" (for wa.me links)
  isValid: boolean;
  isMobile: boolean;
}

// Regex to capture various international and national phone formats
const PHONE_REGEX = /(?:(?:\+|00)(\d{1,4})[\s.-]?)?(?:\(?(\d{2,5})\)?[\s.-]?)?(\d{3,5})[\s.-]?(\d{3,5})(?:[\s.-]?(\d{1,4}))?/g;

/**
 * Cleans phone string by removing alphabets, spaces, hyphens, brackets
 */
export function cleanPhoneDigits(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Normalizes phone number into international E.164 and WhatsApp-compatible format.
 * Defaults to country code "91" (India) if 10-digit number without country code is detected.
 */
export function normalizePhoneNumber(
  rawPhone: string,
  defaultCountryCode: string = '91'
): NormalizedPhone {
  const trimmed = rawPhone.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!digitsOnly || digitsOnly.length < 7 || digitsOnly.length > 15) {
    return {
      raw: rawPhone,
      e164: trimmed,
      digitsOnly: digitsOnly,
      isValid: false,
      isMobile: false,
    };
  }

  let finalDigits = digitsOnly;
  let finalE164 = '';

  if (trimmed.startsWith('+')) {
    finalDigits = digitsOnly;
    finalE164 = `+${digitsOnly}`;
  } else if (trimmed.startsWith('00')) {
    finalDigits = digitsOnly.substring(2);
    finalE164 = `+${finalDigits}`;
  } else if (digitsOnly.length === 10) {
    // Typical 10-digit mobile number, attach default country code
    finalDigits = `${defaultCountryCode}${digitsOnly}`;
    finalE164 = `+${defaultCountryCode}${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    // E.g. "09876543210" -> strip leading 0, prepend country code
    const withoutZero = digitsOnly.substring(1);
    finalDigits = `${defaultCountryCode}${withoutZero}`;
    finalE164 = `+${defaultCountryCode}${withoutZero}`;
  } else {
    finalDigits = digitsOnly;
    finalE164 = `+${digitsOnly}`;
  }

  // Check if it looks like a mobile number (at least 10 digits total)
  const isMobile = finalDigits.length >= 10;

  return {
    raw: rawPhone,
    e164: finalE164,
    digitsOnly: finalDigits,
    isValid: finalDigits.length >= 8 && finalDigits.length <= 15,
    isMobile,
  };
}

/**
 * Validates whether string is a plausible phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const norm = normalizePhoneNumber(phone);
  return norm.isValid;
}

/**
 * Extracts all phone numbers from a block of raw text
 */
export function extractPhonesFromText(text: string): string[] {
  const found: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    // Look for phone cues or standard digit patterns
    const matches = line.match(PHONE_REGEX);
    if (matches) {
      for (const m of matches) {
        const digits = m.replace(/\D/g, '');
        // Must contain between 8 and 15 digits to avoid picking up zip codes or serials
        if (digits.length >= 8 && digits.length <= 15) {
          const cleaned = m.trim();
          if (!found.includes(cleaned)) {
            found.push(cleaned);
          }
        }
      }
    }
  }

  return found;
}

