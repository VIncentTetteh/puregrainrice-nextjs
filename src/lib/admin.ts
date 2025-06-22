// Admin configuration and utilities
export const ADMIN_EMAILS = [
  'puregrainrice@gmail.com',
  'vincentchrisbone@gmail.com',
  // Add more admin emails here
]

export function isAdminUser(email: string | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export function requireAdmin(email: string | undefined): boolean {
  if (!isAdminUser(email)) {
    throw new Error('Access denied: Admin privileges required')
  }
  return true
}
