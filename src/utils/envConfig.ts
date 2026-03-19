import dotenv from 'dotenv';

dotenv.config();

export const env = {
  BASE_URL: process.env.BASE_URL || 'https://teststore.automationtesting.co.uk',
  HEADLESS: process.env.HEADLESS !== 'false',
  BROWSER: process.env.BROWSER || 'chromium',
  ENVIRONMENT: process.env.ENVIRONMENT || 'dev',
};