// ============================================
// SETTINGS - Edit these whenever you want!
// ============================================

// Whitelisted sender emails — add or remove as needed
const whitelist = [
  'sender1@example.com',
  'sender2@example.com'
];

// Keywords to look for in email subject lines
const keywords = [
  'job', 'interview', 'visa', 'immigration',
  'application status', 'offer', 'urgent',
  'chat', 'call', 'status', 'employer', 'connect'
];

// ============================================
// TIME CHECK
// Active hours in IST (24-hour format)
// Alarm only fires within this window
// ============================================

const activeStartHour = 1;   // 1:30 AM IST
const activeStartMin = 30;
const activeEndHour = 11;    // 11:00 AM IST
const activeEndMin = 0;

const now = new Date();
const istOffset = 5.5 * 60; // IST = UTC + 5:30
const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
const istMinutes = (utcMinutes + istOffset) % 1440;
const istHour = Math.floor(istMinutes / 60);
const istMin = Math.floor(istMinutes % 60);

const activeStart = activeStartHour * 60 + activeStartMin;
const activeEnd = activeEndHour * 60 + activeEndMin;
const currentTime = istHour * 60 + istMin;
const isActiveHours = currentTime >= activeStart && currentTime <= activeEnd;

if (!isActiveHours) {
  return [];
}

// ============================================
// FILTER LOGIC
// Three checks per email:
//   1. Is the sender in the whitelist?
//   2. Is the sender from a .nz domain?
//   3. Does the subject contain any keyword?
// If ANY check passes → email is important
// ============================================

const emails = $input.all();
const results = [];

for (const email of emails) {
  // Extract sender email address from formats like '"Name" <email@domain.com>'
  const fromRaw = (email.json.From || email.json.from || '').toLowerCase();
  const emailMatch = fromRaw.match(/<(.+?)>/) || [null, fromRaw];
  const senderEmail = emailMatch[1].trim();
  const senderDomain = senderEmail.split('@')[1] || '';

  // Get subject line
  const subject = (email.json.Subject || email.json.subject || '').toLowerCase();

  // Run the three checks
  const isWhitelisted = whitelist.some(w => senderEmail.includes(w));
  const isNzDomain = senderDomain.endsWith('.nz');
  const hasKeyword = keywords.some(k => subject.includes(k));
  const isImportant = isWhitelisted || isNzDomain || hasKeyword;

  if (isImportant) {
    // Build a reason string so the alert tells you WHY it was flagged
    const reasons = [];
    if (isWhitelisted) reasons.push('Whitelisted sender');
    if (isNzDomain) reasons.push('.nz domain');
    if (hasKeyword) reasons.push('Keyword in subject');

    results.push({
      json: {
        Subject: email.json.Subject || email.json.subject || 'No subject',
        From: email.json.From || email.json.from || 'Unknown',
        snippet: email.json.snippet || '',
        reason: reasons.join(' + ')
      }
    });
  }
}

return results;
