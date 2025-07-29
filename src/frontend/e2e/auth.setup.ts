import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { AuthFixtures } from './fixtures/auth';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page, context, request }) => {
  const authFixtures = new AuthFixtures(page, context);
  
  try {
    // Try to login with seeded admin user (created by DbSeeder)
    const loginResponse = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'admin@booking.com',
        password: 'admin123'
      }
    });

    // If admin user exists and backend is running
    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      expect(loginData.token).toBeTruthy();

      // Save authentication state
      await page.context().storageState({ path: authFile });
      
      // Also save the token for API tests
      process.env.TEST_AUTH_TOKEN = loginData.token;
      
      console.log('✅ Real backend authentication successful');
    } else {
      throw new Error('Backend not available or user not found');
    }
  } catch (error) {
    console.log('⚠️ Backend not available, setting up mock authentication');
    
    // Fallback to mock authentication for auth flow tests
    await authFixtures.setAuthenticatedUser('admin@booking.com', 'Administrator');
    
    // Create mock auth file for tests that depend on it
    await page.context().storageState({ path: authFile });
    
    // Set mock token for API tests
    process.env.TEST_AUTH_TOKEN = 'mock-jwt-token-admin';
    
    console.log('✅ Mock authentication setup completed');
  }
});