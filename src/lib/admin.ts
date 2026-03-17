// Admin access control — emails come from environment, not source code.
// NEXT_PUBLIC_ADMIN_EMAILS is used client-side (Navigation, page guards).
// ADMIN_EMAILS is used server-side (API routes). Keep both in sync in .env.
const envEmails =
  process.env.NEXT_PUBLIC_ADMIN_EMAILS ??
  process.env.ADMIN_EMAILS ??
  ''

export const ADMIN_EMAILS: string[] = envEmails
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export function isAdminUser(email: string | undefined | null): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export function requireAdmin(email: string | undefined | null): boolean {
  if (!isAdminUser(email)) {
    throw new Error('Access denied: Admin privileges required')
  }
  return true
}
