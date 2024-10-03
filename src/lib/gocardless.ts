import { GOCARDLESS_CONFIG } from '@/config/gocardless';
import { getToken, setToken } from './tokenCache';

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

interface GoCardlessRequestOptions {
  method: string;
  path: string;
  body?: any;
  accessToken: string;
}

export async function goCardlessRequest({
  method,
  path,
  body,
  accessToken,
}: GoCardlessRequestOptions) {
  console.log(`Making GoCardless API request: ${method} ${path}`);
  console.log(`Using access token: ${accessToken.substring(0, 10)}...`);
  try {
    const response = await fetch(`https://bankaccountdata.gocardless.com${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    const data = await response.json();

    // Print full JSON response
    console.log('Full GoCardless API response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('GoCardless API error:', data);
      throw new Error(data.detail || data.summary || 'GoCardless API request failed');
    }

    console.log('GoCardless API request successful');
    return data;
  } catch (error) {
    console.error('Error in goCardlessRequest:', error);
    throw error;
  }
}