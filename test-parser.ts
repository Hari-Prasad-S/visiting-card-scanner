import { parseVisitingCard } from './src/services/contactParser';
import { normalizePhoneNumber } from './src/utils/phoneValidator';
import { isValidEmail } from './src/utils/emailValidator';
import { buildWhatsAppGreeting } from './src/services/whatsappService';
import { buildEmailSubject, buildEmailBody } from './src/services/emailService';

console.log('==================================================');
console.log('AI VISITING CARD SCANNER - VERIFICATION TEST SUITE');
console.log('==================================================\n');

// 1. Exact prompt test card
console.log('TEST 1: Exact Card from Specification');
const sampleVisitingCard = `
JOHN MATHEW
Senior Business Manager
ABC Technologies Pvt Ltd
Mobile: +91 9876543210
Email: john@abc.com
Website: www.abc.com
`;

const result = parseVisitingCard(sampleVisitingCard);
console.log('Parsed Contact Result:', JSON.stringify(result, null, 2));

if (
  result.full_name === 'John Mathew' &&
  result.designation === 'Senior Business Manager' &&
  result.company_name === 'ABC Technologies Pvt Ltd' &&
  result.phone_number === '+919876543210' &&
  result.email === 'john@abc.com' &&
  result.website === 'www.abc.com'
) {
  console.log('>>> TEST 1 PASSED: All fields accurately parsed! \u2705');
} else {
  throw new Error('>>> TEST 1 FAILED! Check extracted fields above.');
}

// 2. Phone normalization & international E.164
console.log('\nTEST 2: Phone Normalization & WhatsApp Compatibility');
const phone1 = normalizePhoneNumber('+91 98765 43210');
const phone2 = normalizePhoneNumber('9876543210'); // Indian 10-digit without country code

console.log(`Input "+91 98765 43210" -> E.164: ${phone1.e164}, WhatsApp digits: ${phone1.digitsOnly}`);
console.log(`Input "9876543210"       -> E.164: ${phone2.e164}, WhatsApp digits: ${phone2.digitsOnly}`);

if (
  phone1.e164 === '+919876543210' &&
  phone1.digitsOnly === '919876543210' &&
  phone2.e164 === '+919876543210' &&
  phone2.digitsOnly === '919876543210'
) {
  console.log('>>> TEST 2 PASSED: International phone normalization verified! \u2705');
} else {
  throw new Error('>>> TEST 2 FAILED!');
}

// 3. WhatsApp click-to-chat greeting generation
console.log('\nTEST 3: WhatsApp Click-to-Chat Greeting Generation');
const waGreeting = buildWhatsAppGreeting(result.full_name, 'Zenith Innovations');
console.log('Generated WhatsApp Greeting:\n' + waGreeting);

const expectedWaUrl = `https://wa.me/${phone1.digitsOnly}?text=${encodeURIComponent(waGreeting)}`;
console.log('\nGenerated wa.me URL:', expectedWaUrl);

if (
  waGreeting.includes('Hi John Mathew') &&
  waGreeting.includes('Zenith Innovations') &&
  expectedWaUrl.startsWith('https://wa.me/919876543210')
) {
  console.log('>>> TEST 3 PASSED: WhatsApp URL & greeting verified! \u2705');
} else {
  throw new Error('>>> TEST 3 FAILED!');
}

// 4. Email fallback generation
console.log('\nTEST 4: Email Fallback Generation');
const emailSubj = buildEmailSubject(result.full_name);
const emailBody = buildEmailBody(result.full_name, 'Zenith Innovations');
console.log('Email Subject:', emailSubj);
console.log('Email Body:\n' + emailBody);

if (emailSubj === 'Welcome, John Mathew!' && emailBody.includes('Dear John Mathew')) {
  console.log('>>> TEST 4 PASSED: Email fallback generation verified! \u2705');
} else {
  throw new Error('>>> TEST 4 FAILED!');
}

console.log('\n==================================================');
console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! \u2705\u2705\u2705');
console.log('==================================================');
