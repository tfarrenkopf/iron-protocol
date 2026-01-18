import { z } from 'zod';

// List of offensive words/patterns to block (lowercase for comparison)
// This is a baseline list - can be expanded as needed
const OFFENSIVE_PATTERNS = [
  // Slurs and hate speech
  /n[i1!]gg[ae3]r?s?/i,
  /f[a4@]gg?[o0]t?s?/i,
  /r[e3]t[a4@]rd/i,
  /sp[i1!]c/i,
  /ch[i1!]nk/i,
  /k[i1!]k[e3]/i,
  /w[e3]tb[a4@]ck/i,
  /tr[a4@]nn[yi1!]/i,
  /d[yi1!]k[e3]/i,
  // Profanity
  /f+u+c+k+/i,
  /sh[i1!]+t+/i,
  /c+u+n+t+/i,
  /b[i1!]tch/i,
  /a+ss+h[o0]+l[e3]+/i,
  /d[i1!]+c+k+/i,
  /p[e3]n[i1!]s/i,
  /c[o0]+c+k+/i,
  /p[uo0]ss+[yi1!]/i,
  /wh[o0]r[e3]/i,
  /sl[u0]t/i,
  // Nazi/hate symbols
  /n[a4@]z[i1!]/i,
  /h[i1!]tl[e3]r/i,
  /h[e3][i1!]l/i,
  /88/,
  /1488/,
  /kkk+/i,
  // Sexual
  /r[a4@]p[e3]/i,
  /p[e3]d[o0]/i,
  // Violence
  /k[i1!]ll.*y[o0]u/i,
  /d[i1!][e3].*[^a-z]/i,
];

// SQL injection and XSS patterns
const INJECTION_PATTERNS = [
  // SQL injection
  /('|"|;|--|\/\*|\*\/|union|select|insert|update|delete|drop|exec|execute)/i,
  /(or|and)\s+\d+\s*=\s*\d+/i,
  /\b(or|and)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?/i,
  // XSS
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /data:/i,
  /&#/,
  /%3c/i,
  /%3e/i,
];

export function containsOffensiveContent(input: string): { isOffensive: boolean; reason?: string } {
  const normalizedInput = input.toLowerCase().trim();
  
  for (const pattern of OFFENSIVE_PATTERNS) {
    if (pattern.test(normalizedInput)) {
      return { isOffensive: true, reason: 'Contains inappropriate language' };
    }
  }
  
  return { isOffensive: false };
}

export function containsInjectionAttempt(input: string): { isInjection: boolean; reason?: string } {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { isInjection: true, reason: 'Contains invalid characters' };
    }
  }
  
  return { isInjection: false };
}

export function validateDisplayName(input: string): { isValid: boolean; error?: string } {
  // Check for empty or whitespace only
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: true }; // Empty is valid (optional field)
  }
  
  // Length validation
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Display name must be at least 3 characters' };
  }
  
  if (trimmed.length > 15) {
    return { isValid: false, error: 'Display name must be 15 characters or less' };
  }
  
  // Character validation (alphanumeric, underscore, dash only)
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Only letters, numbers, underscores and dashes allowed' };
  }
  
  // Check for injection attempts
  const injectionCheck = containsInjectionAttempt(trimmed);
  if (injectionCheck.isInjection) {
    return { isValid: false, error: injectionCheck.reason };
  }
  
  // Check for offensive content
  const offensiveCheck = containsOffensiveContent(trimmed);
  if (offensiveCheck.isOffensive) {
    return { isValid: false, error: 'This name is not allowed. Please choose another.' };
  }
  
  return { isValid: true };
}

// Zod schema that uses the validation function
export const displayNameSchema = z.string()
  .transform(val => val.trim())
  .refine(
    (val) => {
      if (!val) return true; // Empty is valid (optional)
      return val.length >= 3;
    },
    { message: 'Display name must be at least 3 characters' }
  )
  .refine(
    (val) => {
      if (!val) return true;
      return val.length <= 15;
    },
    { message: 'Display name must be 15 characters or less' }
  )
  .refine(
    (val) => {
      if (!val) return true;
      return /^[a-zA-Z0-9_-]+$/.test(val);
    },
    { message: 'Only letters, numbers, underscores and dashes allowed' }
  )
  .refine(
    (val) => {
      if (!val) return true;
      return !containsInjectionAttempt(val).isInjection;
    },
    { message: 'Contains invalid characters' }
  )
  .refine(
    (val) => {
      if (!val) return true;
      return !containsOffensiveContent(val).isOffensive;
    },
    { message: 'This name is not allowed. Please choose another.' }
  );
