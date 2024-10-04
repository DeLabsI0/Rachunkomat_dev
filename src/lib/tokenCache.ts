let cachedToken: string | null = null;
let tokenExpiration: number | null = null;

export function getToken(): string | null {
  const now = Date.now();
  console.log(`[${new Date().toISOString()}] Checking token cache. Current time: ${now}, Token expiration: ${tokenExpiration}`);
  
  if (cachedToken && tokenExpiration && now < tokenExpiration) {
    const remainingTime = (tokenExpiration - now) / 1000;
    console.log(`[${new Date().toISOString()}] Returning cached token (expires in ${remainingTime.toFixed(2)} seconds)`);
    return cachedToken;
  }
  
  if (cachedToken) {
    console.log(`[${new Date().toISOString()}] Cached token expired (${tokenExpiration ? 'expired ' + ((now - tokenExpiration) / 1000).toFixed(2) + ' seconds ago' : 'no expiration set'})`);
  } else {
    console.log(`[${new Date().toISOString()}] No cached token available`);
  }
  
  cachedToken = null;
  tokenExpiration = null;
  return null;
}

export function setToken(token: string, expiresIn: number): void {
  cachedToken = token;
  tokenExpiration = Date.now() + expiresIn * 1000; // Convert expiresIn to milliseconds
  const expiresAt = new Date(tokenExpiration).toISOString();
  console.log(`[${new Date().toISOString()}] Token cached (expires in ${expiresIn} seconds, at ${expiresAt})`);
}