/** Escape HTML special characters before embedding user input in email templates */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/** Strip all HTML tags — use for plain-text email parts */
export function stripHtml(str: unknown): string {
  if (str === null || str === undefined) return ''
  return String(str).replace(/<[^>]*>/g, '')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: unknown): boolean {
  return typeof email === 'string' && EMAIL_RE.test(email.trim())
}

export function isValidPhone(phone: unknown): boolean {
  if (typeof phone !== 'string') return false
  const clean = phone.replace(/[\s\-\(\)]/g, '')
  return /^(\+233|0|233)[0-9]{9}$/.test(clean)
}

/** Clamp a string to maxLen characters */
export function clamp(str: unknown, maxLen: number): string {
  const s = String(str ?? '').trim()
  return s.length > maxLen ? s.slice(0, maxLen) : s
}
