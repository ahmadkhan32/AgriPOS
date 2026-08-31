/**
 * Super Admin identification.
 * Super Admin is NOT a business user — identified only by email env var.
 */

export function isSuperAdmin(user) {
  if (!user) return false
  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
  if (!superAdminEmail) return false
  return user.email?.toLowerCase() === superAdminEmail.toLowerCase()
}
