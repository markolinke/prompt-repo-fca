/**
 * Utility functions for JWT token operations.
 */

interface JWTPayload {
    sub?: string;
    email?: string;
    exp?: number;
    iat?: number;
    type?: string;
}

/**
 * Decode JWT token without verification (client-side only).
 * Returns null if token is invalid or malformed.
 */
export function decodeJWT(token: string): JWTPayload | null {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        
        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
}

/**
 * Check if token is expired or will expire soon.
 * @param token JWT token string
 * @param bufferSeconds Buffer time in seconds before expiration (default: 60)
 */
export function isTokenExpired(token: string, bufferSeconds: number = 60): boolean {
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return true;
    
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const bufferTime = bufferSeconds * 1000;
    const now = Date.now();
    
    return now >= (expirationTime - bufferTime);
}

/**
 * Get token expiration time in milliseconds
 */
export function getTokenExpirationTime(token: string): number | null {
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return null;
    
    return payload.exp * 1000;
}

