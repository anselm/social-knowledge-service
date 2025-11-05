/**
 * Authentication utilities for making authenticated requests
 * This will send auth credentials to the server only when needed
 */

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '';
  const fullURL = baseURL + url;
  
  // Get auth state from localStorage  
  const authStateStr = localStorage.getItem('auth_state');
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };
  
  // If we have auth state, include it in the Authorization header
  if (authStateStr) {
    try {
      const authState = JSON.parse(authStateStr);
      
      if (authState.type === 'siwe' && authState.message && authState.signature && authState.nonce) {
        // For SIWE, include the full auth proof in Authorization header
        const siweAuth = {
          type: 'siwe',
          message: authState.message,
          signature: authState.signature,
          nonce: authState.nonce
        };
        headers['Authorization'] = `Auth ${JSON.stringify(siweAuth)}`;
        console.log('Including SIWE auth in request:', siweAuth);
      } else if (authState.type === 'magic' && authState.didToken) {
        // For Magic, include the DID token in Authorization header
        headers['Authorization'] = `Bearer ${authState.didToken}`;
        console.log('Including Magic auth in request');
      } else {
        console.log('Auth state exists but missing required fields:', authState);
      }
    } catch (e) {
      console.error('Failed to parse auth state:', e);
    }
  } else {
    console.log('No auth state found in localStorage');
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
  
  // Get auth state from localStorage
  const authStateStr = localStorage.getItem('auth_state');
  const headers: Record<string, string> = {};
  
  // If we have auth state, include it in the Authorization header
  if (authStateStr) {
    try {
      const authState = JSON.parse(authStateStr);
      
      if (authState.type === 'siwe' && authState.message && authState.signature && authState.nonce) {
        // For SIWE, include the full auth proof in Authorization header  
        const siweAuth = {
          type: 'siwe',
          message: authState.message,
          signature: authState.signature,
          nonce: authState.nonce
        };
        headers['Authorization'] = `Auth ${JSON.stringify(siweAuth)}`;
      } else if (authState.type === 'magic' && authState.didToken) {
        // For Magic, include the DID token in Authorization header
        headers['Authorization'] = `Bearer ${authState.didToken}`;
      }
    } catch (e) {
      console.error('Failed to parse auth state:', e);
    }
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
