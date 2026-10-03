const PERSONAL = ['gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com',
  'yahoo.com', 'yahoo.co.uk', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com'];
const KNOWN = ['thamestech.ac.uk', 'mancunian.ac.uk', 'northlinebank.co.uk', 'buildright.co.uk', 'cityprojectacademy.co.uk'];

export function checkEmail(email: string): { ok: boolean; verified: boolean; error?: string } {
  const domain = email.split('@')[1]?.toLowerCase().trim() ?? '';
  if (!domain || !domain.includes('.')) return { ok: false, verified: false, error: 'Enter a valid email' };
  if (PERSONAL.includes(domain)) return { ok: false, verified: false, error: 'Use your training provider, uni or employer email' };
  return { ok: true, verified: KNOWN.includes(domain) || domain.endsWith('.ac.uk') };
}
