// Admin access control — emails come from environment, not source code.
// Set ADMIN_EMAILS in .env.local as a comma-separated list:
//   ADMIN_EMAILS=admin@yourstore.com,another@yourstore.com
const envEmails = process.env.ADMIN_EMAILS ?? ''

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
