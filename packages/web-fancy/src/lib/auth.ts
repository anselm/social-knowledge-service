/**
 * Authentication utilities for making authenticated requests
 * This will send auth credentials to the server only when needed
 */

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '';
  const fullURL = baseURL + url;
  
  // Get auth data from localStorage
  const authDataStr = localStorage.getItem('authData');
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };
  
  // If we have auth data, include it in the request
  if (authDataStr) {
    try {
      const authData = JSON.parse(authDataStr);
      
      if (authData.type === 'siwe' && authData.address) {
        // For SIWE, we could include the address
        headers['X-Auth-Type'] = 'siwe';
        headers['X-Auth-Address'] = authData.address;
      } else if (authData.type === 'magic' && authData.didToken) {
        // For Magic, include the DID token
        headers['X-Auth-Type'] = 'magic';
        headers['X-Auth-Token'] = authData.didToken;
      }
    } catch (e) {
      console.error('Failed to parse auth data:', e);
    }
  }
  
  // Also check for a stored auth token (from server)
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const r = await fetch(fullURL, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });
  
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(`${url} => ${r.status}: ${errorText}`);
  }
  
  return r.json();
}

export async function getJSON<T>(url: string): Promise<T> {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '';
  const fullURL = baseURL + url;
  
  // Get auth data from localStorage
  const authDataStr = localStorage.getItem('authData');
  const headers: Record<string, string> = {};
  
  // If we have auth data, include it in the request
  if (authDataStr) {
    try {
      const authData = JSON.parse(authDataStr);
      
      if (authData.type === 'siwe' && authData.address) {
        headers['X-Auth-Type'] = 'siwe';
        headers['X-Auth-Address'] = authData.address;
      } else if (authData.type === 'magic' && authData.didToken) {
        headers['X-Auth-Type'] = 'magic';
        headers['X-Auth-Token'] = authData.didToken;
      }
    } catch (e) {
      console.error('Failed to parse auth data:', e);
    }
  }
  
  // Also check for a stored auth token (from server)
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const r = await fetch(fullURL, {
    method: "GET",
    headers,
    credentials: "include",
  });
  
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(`${url} => ${r.status}: ${errorText}`);
  }
  
  return r.json();
}
