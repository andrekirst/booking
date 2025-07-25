import { UserInfo } from '../types/auth';

/**
 * Parses a JWT token and extracts user information
 * @param token JWT token string
 * @returns UserInfo object or null if invalid
 */
export function parseJwtToken(token: string | null): UserInfo | null {
  if (!token) {
    return null;
  }

  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(tokenParts[1]));

    // Extract user info from JWT payload
    const name = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 
                 payload['name'] || 
                 payload['sub'] || 
                 'Unbekannt';
    
    const email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
                  payload['email'] || 
                  '';
    
    const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
                 payload['role'] || 
                 'Member';
    
    const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || 
                   payload['sub'] || 
                   payload['userId'] || 
                   0;

    return {
      name,
      email,
      role,
      userId: typeof userId === 'string' ? parseInt(userId, 10) : userId,
      isAdmin: role === 'Administrator'
    };
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
}

/**
 * Gets user info from localStorage token
 * @returns UserInfo object or null if not authenticated
 */
export function getCurrentUser(): UserInfo | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('auth_token');
  return parseJwtToken(token);
}

/**
 * Checks if current user is authenticated
 * @returns boolean
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Checks if current user is an administrator
 * @returns boolean
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.isAdmin ?? false;
}