import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page, request }) => {
  // First, ensure we have a test user
  const registerResponse = await request.post('http://localhost:5000/auth/register', {
    data: {
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User'
    }
  });

  // Registration might fail if user already exists, that's okay
  if (registerResponse.ok()) {
    console.log('Test user created successfully');
  }

  // Now login
  const loginResponse = await request.post('http://localhost:5000/auth/login', {
    data: {
      email: 'test@example.com',
      password: 'Test123!'
    }
  });

  expect(loginResponse.ok()).toBeTruthy();
  
  const loginData = await loginResponse.json();
  expect(loginData.token).toBeTruthy();

  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  // Also save the token for API tests
  process.env.TEST_AUTH_TOKEN = loginData.token;
});