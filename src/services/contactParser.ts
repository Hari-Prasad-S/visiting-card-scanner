import { ExtractedContact } from '../types';
import { extractEmailsFromText } from '../utils/emailValidator';
import { normalizePhoneNumber } from '../utils/phoneValidator';

// Common designations seen on business cards
const DESIGNATION_KEYWORDS = [
  'manager', 'director', 'engineer', 'architect', 'consultant',
  'founder', 'co-founder', 'ceo', 'cto', 'cfo', 'coo', 'cmo',
  'vice president', 'vp', 'president', 'lead', 'partner',
  'executive', 'associate', 'developer', 'analyst', 'head',
  'officer', 'specialist', 'advisor', 'designer', 'supervisor',
  'coordinator', 'representative', 'administrator', 'scientist'
];

// Keywords indicating company or organizational entities
const COMPANY_KEYWORDS = [
  'pvt ltd', 'private limited', 'ltd', 'limited', 'inc', 'incorporated',
  'technologies', 'solutions', 'enterprises', 'industries', 'services',
  'corp', 'corporation', 'group', 'systems', 'consulting', 'llc', 'llp',
  'ventures', 'holdings', 'agency', 'studio', 'labs', 'associates'
];

// Clutter words that should never be treated as names or company
const CLUTTER_WORDS = [
  'visiting card', 'business card', 'identity card', 'contact details',
  'call us', 'email us', 'website', 'address', 'office', 'phone',
  'mobile', 'fax', 'toll free', 'scan here'
];

/**
 * Converts ALL CAPS or all lowercase string to Title Case (e.g. "JOHN MATHEW" -> "John Mathew")
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Parses raw text obtained from visiting card OCR into structured contact fields
 */
export function parseVisitingCard(rawText: string): ExtractedContact {
  if (!rawText) {
    return {
      full_name: '',
      designation: '',
      company_name: '',
      phone_number: '',
      whatsapp_number: '',
      email: '',
      website: '',
      address: '',
      raw_text: '',
    };
  }

  const rawLines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  let fullName = '';
  let designation = '';
  let companyName = '';
  let phoneNumber = '';
  let whatsappNumber = '';
  let email = '';
  let website = '';
  const addressLines: string[] = [];

  // 1. Extract email using regex
  const emails = extractEmailsFromText(rawText);
  if (emails.length > 0) {
    email = emails[0];
  }

  // 2. Extract website
  // First check explicit website/web label
  for (const line of rawLines) {
    const webLabelMatch = line.match(/(?:website|web|site|url)[:\s]+([^\s]+)/i);
    if (webLabelMatch) {
      website = webLabelMatch[1].replace(/^[<(\[]+|[>)\].,;]+$/g, '').trim();
      break;
    }
  }

  // If not found by label, look for www. or http:// or standalone domain not matching email
  if (!website) {
    const webRegex = /(?:https?:\/\/|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;
    const webMatches = rawText.match(webRegex);
    if (webMatches) {
      for (const match of webMatches) {
        const cleaned = match.replace(/^[<(\[]+|[>)\].,;]+$/g, '').trim();
        if (!cleaned.includes('@')) {
          website = cleaned;
          break;
        }
      }
    }
  }

  // 3. Process lines for labels and field matching
  const candidateNameLines: string[] = [];
  const candidateCompanyLines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const lowerLine = line.toLowerCase();

    // Check if line contains clutter
    if (CLUTTER_WORDS.some(w => lowerLine === w)) {
      continue;
    }

    // Explicit WhatsApp label check
    if (lowerLine.includes('whatsapp') || lowerLine.includes('wa.me') || lowerLine.startsWith('wa:')) {
      const digitsMatch = line.match(/(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/);
      if (digitsMatch) {
        const norm = normalizePhoneNumber(digitsMatch[0]);
        if (norm.isValid) {
          whatsappNumber = norm.e164;
          if (!phoneNumber) phoneNumber = norm.e164;
        }
      }
      continue;
    }

    // Explicit Mobile / Phone label check
    if (/^(mob|mobile|cell|m:|contact|ph|phone|tel)[:\s]/i.test(line) || lowerLine.includes('mobile:') || lowerLine.includes('mob:')) {
      const digitsMatch = line.match(/(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/);
      if (digitsMatch) {
        const norm = normalizePhoneNumber(digitsMatch[0]);
        if (norm.isValid) {
          if (!phoneNumber) {
            phoneNumber = norm.e164;
          }
        }
      }
      continue;
    }

    // Designation detection
    if (!designation && DESIGNATION_KEYWORDS.some(k => lowerLine.includes(k))) {
      // Don't treat if it has phone/email/web
      if (!line.includes('@') && !line.includes('www.') && !/\d{5,}/.test(line)) {
        designation = line;
        continue;
      }
    }

    // Company detection by keywords
    if (!companyName && COMPANY_KEYWORDS.some(k => lowerLine.includes(k))) {
      if (!line.includes('@') && !/\d{6,}/.test(line)) {
        companyName = line;
        continue;
      }
    }

    // Address detection cues
    if (
      /(street|road|st\.|rd\.|avenue|ave|floor|block|sector|plot|building|bldg|nagar|pin\s*code|zip)/i.test(line) ||
      /\b\d{6}\b/.test(line) // 6-digit postal code
    ) {
      if (!line.includes('@') && !line.includes('www.')) {
        addressLines.push(line);
        continue;
      }
    }

    // If line has numbers that look like phone without explicit label
    if (!phoneNumber) {
      const phoneMatch = line.match(/(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/);
      if (phoneMatch) {
        const norm = normalizePhoneNumber(phoneMatch[0]);
        if (norm.isValid && norm.isMobile) {
          phoneNumber = norm.e164;
          continue;
        }
      }
    }

    // Lines that are clean text without numbers or special symbols
    const cleanAlphaOnly = line.replace(/[^a-zA-Z\s]/g, '').trim();
    if (
      cleanAlphaOnly.length >= 3 &&
      !line.includes('@') &&
      !line.includes('www.') &&
      !/\d{3,}/.test(line)
    ) {
      // Candidate for name or company
      const words = cleanAlphaOnly.split(/\s+/).filter(Boolean);
      if (words.length >= 1 && words.length <= 4) {
        candidateNameLines.push(line);
      } else if (words.length > 4) {
        candidateCompanyLines.push(line);
      }
    }
  }

  // Name resolution: Pick the first prominent candidate that is not designation or company
  for (const cand of candidateNameLines) {
    if (cand === designation || cand === companyName) continue;
    if (DESIGNATION_KEYWORDS.some(k => cand.toLowerCase().includes(k))) continue;
    if (COMPANY_KEYWORDS.some(k => cand.toLowerCase().includes(k))) continue;
    fullName = toTitleCase(cand);
    break;
  }

  // If company name not found yet, inspect candidates
  if (!companyName) {
    for (const cand of candidateNameLines) {
      if (cand !== fullName && cand !== designation) {
        companyName = cand;
        break;
      }
    }
    if (!companyName && candidateCompanyLines.length > 0) {
      companyName = candidateCompanyLines[0];
    }
  }

  // If designation was in all caps, clean it up
  if (designation && designation === designation.toUpperCase()) {
    designation = toTitleCase(designation);
  }

  return {
    full_name: fullName.trim(),
    designation: designation.trim(),
    company_name: companyName.trim(),
    phone_number: phoneNumber.trim(),
    whatsapp_number: whatsappNumber.trim() || (phoneNumber ? phoneNumber.trim() : ''),
    email: email.trim(),
    website: website.trim(),
    address: addressLines.join(', ').trim(),
    raw_text: rawText,
  };
}

