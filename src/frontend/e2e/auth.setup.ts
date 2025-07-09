import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page, request }) => {
  // Try to login with seeded admin user (created by DbSeeder)
  const loginResponse = await request.post('http://localhost:5000/api/auth/login', {
    data: {
      email: 'admin@booking.com',
      password: 'admin123'
    }
  });

  // If admin user doesn't exist, this setup will fail
  // The seeded user should exist from DbSeeder
  expect(loginResponse.ok()).toBeTruthy();
  
  const loginData = await loginResponse.json();
  expect(loginData.token).toBeTruthy();

  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  // Also save the token for API tests
  process.env.TEST_AUTH_TOKEN = loginData.token;
});