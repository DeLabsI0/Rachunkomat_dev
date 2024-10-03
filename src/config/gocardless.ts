export const GOCARDLESS_CONFIG = {
  apiUrl: 'https://bankaccountdata.gocardless.com',
  SECRET_ID: process.env.GOCARDLESS_SECRET_ID,
  SECRET_KEY: process.env.GOCARDLESS_SECRET_KEY,
  TEST_MODE: process.env.GOCARDLESS_TEST_MODE === 'true',
};