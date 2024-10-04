import { GOCARDLESS_CONFIG } from '@/config/gocardless';
import { getToken, setToken } from '@/lib/tokenCache';

let tokenRequestInProgress: Promise<string> | null = null;

export async function getAccessToken() {
  console.log(`[${new Date().toISOString()}] getAccessToken called`);

  const cachedToken = getToken();
  if (cachedToken) {
    console.log(`[${new Date().toISOString()}] Using cached GoCardless access token`);
    return cachedToken;
  }

  if (tokenRequestInProgress) {
    console.log(`[${new Date().toISOString()}] Token request already in progress, waiting...`);
    return tokenRequestInProgress;
  }

  console.log(`[${new Date().toISOString()}] Initiating new token request`);
  tokenRequestInProgress = fetchNewToken();

  try {
    const token = await tokenRequestInProgress;
    return token;
  } finally {
    tokenRequestInProgress = null;
  }
}

async function fetchNewToken(): Promise<string> {
  try {
    console.log(`[${new Date().toISOString()}] Making request to GoCardless token endpoint`);
    const tokenResponse = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Expires': '0',
      },
      body: JSON.stringify({
        secret_id: GOCARDLESS_CONFIG.SECRET_ID,
        secret_key: GOCARDLESS_CONFIG.SECRET_KEY,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log(`[${new Date().toISOString()}] GoCardless token response:`, JSON.stringify(tokenData, null, 2));

    if (!tokenResponse.ok) {
      throw new Error(tokenData.detail || 'Failed to obtain access token');
    }

    console.log(`[${new Date().toISOString()}] New GoCardless access token obtained`);
    
    if (tokenData.access && tokenData.access_expires) {
      setToken(tokenData.access, tokenData.access_expires);
      return tokenData.access;
    } else {
      throw new Error('Unexpected token response format');
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error obtaining GoCardless access token:`, error);
    throw error;
  }
}