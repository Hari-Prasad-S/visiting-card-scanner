/**
 * Email validation and extraction utilities
 */

// Standard RFC 5322 compatible regex for practical email matching
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Validates whether string is a properly formatted email address
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.trim().length === 0) return false;
  const trimmed = email.trim();
  // Reset regex index
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(trimmed);
}

/**
 * Extracts all valid email addresses found in a text string
 */
export function extractEmailsFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.match(EMAIL_REGEX);
  if (!matches) return [];

  const unique = Array.from(new Set(matches.map(e => e.trim().toLowerCase())));
  return unique.filter(isValidEmail);
}

