import { GOCARDLESS_CONFIG } from '@/config/gocardless';
import { getToken, setToken } from '@/lib/tokenCache';

export async function getAccessToken() {
  const cachedToken = getToken();
  if (cachedToken) {
    console.log('Using cached GoCardless access token');
    return cachedToken;
  }

  console.log('Fetching new GoCardless access token');
  try {
    const tokenResponse = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      body: JSON.stringify({
        secret_id: GOCARDLESS_CONFIG.SECRET_ID,
        secret_key: GOCARDLESS_CONFIG.SECRET_KEY,
      }),
      cache: 'no-store',
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.detail || 'Failed to obtain access token');
    }

    console.log('New GoCardless access token obtained');
    setToken(tokenData.access, tokenData.access_expires);
    return tokenData.access;
  } catch (error) {
    console.error('Error obtaining GoCardless access token:', error);
    throw error;
  }
}