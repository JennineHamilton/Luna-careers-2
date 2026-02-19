/**
 * Utility functions for formatting data in the Luna Careers platform
 */

/**
 * Format account type from code to readable text
 * @param accountType - The account type code
 * @returns Formatted account type string
 */
export function formatAccountType(accountType: string): string {
  const typeMap: Record<string, string> = {
    personal: 'Personal',
    organization: 'Organization',
    platformAdmin: 'Platform Admin',
    hybrid: 'Hybrid',
  };

  return typeMap[accountType] || accountType;
}

/**
 * Format user role from code to readable text
 * @param userRole - The user role code
 * @returns Formatted user role string
 */
export function formatUserRole(userRole: string): string {
  const roleMap: Record<string, string> = {
    org_admin: 'Organization Admin',
    org_member: 'Organization Member',
    candidate: 'Candidate',
    platform_admin: 'Platform Admin',
    team_member: 'Team Member',
  };

  return roleMap[userRole] || userRole;
}

/**
 * Format date and time to readable format
 * @param date - The date to format (Date object or ISO string)
 * @param includeTime - Whether to include time in the output
 * @returns Formatted date string (e.g., "19 Jan, 2026 (10:00pm)")
 */
export function formatDateTime(date: Date | string, includeTime: boolean = true): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  if (!includeTime) {
    return `${day} ${month}, ${year}`;
  }

  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  const timeStr = `${hours}:${minutesStr}${ampm}`;

  return `${day} ${month}, ${year} (${timeStr})`;
}

/**
 * Get user initials from name
 * @param name - Full name
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

