import Cookies from 'js-cookie';

/**
 * Gets the authentication token from cookies
 * Tries both direct token and array format for backward compatibility
 * @returns {string|null} The authentication token or null if not found
 */
export function getAuthToken() {
  // Try to get the token from the direct cookie first
  let token = Cookies.get('sb-mnvxxmmrlvjgpnhditxc-auth-token');
  
  // If not found, try the array format cookie
  if (!token) {
    const arrayToken = Cookies.get('sb-mnvxxmmrlvjgpnhditxc-auth-token-array');
    if (arrayToken) {
      try {
        // Parse the JSON array and get the first element
        const tokenArray = JSON.parse(arrayToken);
        if (Array.isArray(tokenArray) && tokenArray.length > 0) {
          token = tokenArray[0];
        }
      } catch (e) {
        console.error("Error parsing token array:", e);
      }
    }
  }
  
  return token || null;
}

/**
 * Creates headers with authentication token for fetch requests
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} Headers object with Authorization and Content-Type
 */
export function getAuthHeaders(additionalHeaders = {}) {
  const token = getAuthToken();
  
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
}