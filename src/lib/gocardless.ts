import { GOCARDLESS_CONFIG } from '@/config/gocardless';

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
  const url = new URL(path, GOCARDLESS_CONFIG.apiUrl);
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'GoCardless-Version': '2015-07-06',
  };

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 404) {
    console.warn(`Resource not found: ${path}`);
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    return null;
  }

  if (!response.ok) {
    console.error('GoCardless API error:', data);
    if (response.status === 429) {
      throw new Error(`Rate limit exceeded. ${data.detail || ''}`);
    }
    throw new Error(data.detail || 'GoCardless API request failed');
  }

  return data;
}