interface TokenData {
  access: string;
  expiresAt: number;
}

let cachedToken: TokenData | null = null;

export function setToken(access: string, expiresIn: number) {
  cachedToken = {
    access,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

export function getToken(): string | null {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.access;
  }
  return null;
}