/**
 * Role Detection Utility
 * Detects user roles based on environment variables
 */

export type SystemRole = 'admin' | 'support' | null;

/**
 * Detect user role based on email address
 */
export function detectUserRole(userEmail: string): SystemRole {
  if (!userEmail) return null;

  const adminEmail = process.env.ADMIN_USER_EMAIL;
  const supportEmails = process.env.SUPPORT_USER_EMAILS?.split(',').map(email => email.trim()) || [];

  if (userEmail === adminEmail) return 'admin';
  if (supportEmails.includes(userEmail)) return 'support';

  return null;
}

/**
 * Check if user has a specific role
 */
export function hasRole(userEmail: string, role: SystemRole): boolean {
  const userRole = detectUserRole(userEmail);
  // Admin users have access to all roles
  if (userRole === 'admin') return true;
  return userRole === role;
}

/**
 * Check if user has any role
 */
export function hasAnyRole(userEmail: string): boolean {
  return detectUserRole(userEmail) !== null;
}

/**
 * Get role permissions
 */
export function getRolePermissions(role: SystemRole) {
  const permissions = {
    admin: {
      canReviewEntities: true,
      canManageSystem: true,
      canViewAuditLogs: true,
      canAccessAdminDashboard: true,
      canApproveEntities: true,
      canRejectEntities: true,
      canMergeEntities: true,
      canFlagEntities: true,
      // Admin has access to all other role permissions
      canViewUserData: true,
      canResetPasswords: true,
      canDisableAccounts: true,
      canAccessSupportDashboard: true,
      canViewUserAccounts: true,
      canManageSupportTickets: true
    },
    support: {
      canViewUserData: true,
      canResetPasswords: true,
      canDisableAccounts: true,
      canAccessSupportDashboard: true,
      canViewUserAccounts: true,
      canManageSupportTickets: true
    }
  };

  return role ? permissions[role] : {};
}

/**
 * Get dashboard route for role
 */
export function getDashboardRoute(role: SystemRole): string | null {
  const routes = {
    admin: '/dashboard/admin',
    support: '/dashboard/support'
  };

  return role ? routes[role] : null;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: SystemRole): string {
  const names = {
    admin: 'Administrator',
    support: 'Support'
  };

  return role ? names[role] : 'User';
}

/**
 * Get role description
 */
export function getRoleDescription(role: SystemRole): string {
  const descriptions = {
    admin: 'Full system access with entity review and management capabilities',
    support: 'User assistance and account management capabilities'
  };

  return role ? descriptions[role] : 'Standard user access';
}
