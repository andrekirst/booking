import { Page, BrowserContext } from '@playwright/test';

/**
 * Authentication Fixtures for E2E Tests
 * Provides helper methods to mock authentication states and API responses
 */
export class AuthFixtures {
  constructor(
    private page: Page,
    private context: BrowserContext
  ) {}

  /**
   * Clear all authentication state (cookies, localStorage, sessionStorage)
   */
  async clearAuthState() {
    // Clear localStorage
    await this.page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      localStorage.clear();
    });

    // Clear sessionStorage
    await this.page.evaluate(() => {
      sessionStorage.clear();
    });

    // Clear auth cookies
    await this.context.clearCookies();
  }

  /**
   * Set authentication token in localStorage
   */
  async setTokenInLocalStorage(token: string) {
    await this.page.evaluate((token) => {
      localStorage.setItem('auth_token', token);
    }, token);
  }

  /**
   * Set authentication cookie
   */
  async setAuthCookie(token: string) {
    await this.context.addCookies([{
      name: 'auth_token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }]);
  }

  /**
   * Set both localStorage token and cookie for authenticated user
   */
  async setAuthenticatedUser(email: string, role: 'Administrator' | 'Member' = 'Member') {
    const mockToken = this.generateMockJWT(email, role);
    const userInfo = {
      name: email.split('@')[0],
      email: email,
      role: role,
      userId: role === 'Administrator' ? 1 : 2,
      isAdmin: role === 'Administrator'
    };

    // Set token in localStorage
    await this.page.evaluate((data) => {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_info', JSON.stringify(data.userInfo));
    }, { token: mockToken, userInfo });

    // Set auth cookie
    await this.setAuthCookie(mockToken);

    // Mock token validation API
    await this.mockTokenValidation(mockToken, userInfo);
  }

  /**
   * Set expired token to test token expiration
   */
  async setExpiredToken() {
    const expiredToken = this.generateExpiredMockJWT();
    
    await this.setTokenInLocalStorage(expiredToken);
    await this.setAuthCookie(expiredToken);
    
    // Mock API to return 401 for expired token
    await this.context.route('**/api/**', route => {
      const authHeader = route.request().headers()['authorization'];
      if (authHeader && authHeader.includes(expiredToken)) {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Token expired' })
        });
      } else {
        route.continue();
      }
    });
  }

  /**
   * Mock successful login API response
   */
  async mockLoginSuccess(email: string = 'user@family.com', role: 'Administrator' | 'Member' = 'Member') {
    const mockToken = this.generateMockJWT(email, role);
    const userInfo = {
      name: email.split('@')[0],
      email: email,
      role: role,
      userId: role === 'Administrator' ? 1 : 2,
      isAdmin: role === 'Administrator'
    };

    await this.context.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: mockToken,
          user: userInfo,
          expiresIn: 3600
        })
      });
    });

    // Also mock token validation
    await this.mockTokenValidation(mockToken, userInfo);
  }

  /**
   * Mock admin login success
   */
  async mockAdminLoginSuccess() {
    await this.mockLoginSuccess('admin@booking.com', 'Administrator');
  }

  /**
   * Mock login failure
   */
  async mockLoginFailure(errorMessage: string = 'Invalid credentials') {
    await this.context.route('**/api/auth/login', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: errorMessage,
          message: errorMessage
        })
      });
    });
  }

  /**
   * Mock token validation API
   */
  async mockTokenValidation(token: string, userInfo: any) {
    await this.context.route('**/api/auth/validate', route => {
      const authHeader = route.request().headers()['authorization'];
      
      if (authHeader && authHeader.includes(token)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            user: userInfo
          })
        });
      } else {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: false,
            error: 'Invalid token'
          })
        });
      }
    });
  }

  /**
   * Mock logout API
   */
  async mockLogout() {
    await this.context.route('**/api/auth/logout', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Logged out successfully'
        })
      });
    });
  }

  /**
   * Mock API server error
   */
  async mockServerError(status: number = 500) {
    await this.context.route('**/api/auth/**', route => {
      route.fulfill({
        status: status,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
          message: 'Ein Fehler ist aufgetreten'
        })
      });
    });
  }

  /**
   * Mock network timeout
   */
  async mockNetworkTimeout() {
    await this.context.route('**/api/auth/**', route => {
      // Simulate timeout by never responding
      // Playwright will eventually timeout based on test configuration
    });
  }

  /**
   * Mock rate limiting
   */
  async mockRateLimit() {
    await this.context.route('**/api/auth/login', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Too many requests',
          message: 'Zu viele Anmeldeversuche. Bitte warten Sie.'
        })
      });
    });
  }

  /**
   * Generate mock JWT token
   */
  private generateMockJWT(email: string, role: string): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      email: email,
      role: role,
      name: email.split('@')[0],
      userId: role === 'Administrator' ? 1 : 2,
      isAdmin: role === 'Administrator',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000)
    }));
    const signature = btoa('mock-signature');
    
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Generate expired mock JWT token
   */
  private generateExpiredMockJWT(): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      email: 'expired@user.com',
      role: 'Member',
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
      iat: Math.floor(Date.now() / 1000) - 7200
    }));
    const signature = btoa('mock-signature-expired');
    
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Get current authentication state from page
   */
  async getAuthState() {
    return await this.page.evaluate(() => {
      return {
        localStorage: {
          auth_token: localStorage.getItem('auth_token'),
          user_info: localStorage.getItem('user_info')
        },
        sessionStorage: {
          auth_token: sessionStorage.getItem('auth_token')
        }
      };
    });
  }

  /**
   * Verify authentication state is cleared
   */
  async verifyAuthStateCleared() {
    const authState = await this.getAuthState();
    const cookies = await this.context.cookies();
    const authCookie = cookies.find(c => c.name === 'auth_token');
    
    return {
      localStorageCleared: !authState.localStorage.auth_token,
      sessionStorageCleared: !authState.sessionStorage.auth_token,
      cookiesCleared: !authCookie
    };
  }

  /**
   * Mock protected API endpoints
   */
  async mockProtectedEndpoints() {
    // Mock bookings API
    await this.context.route('**/api/bookings**', route => {
      const authHeader = route.request().headers()['authorization'];
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '1',
              title: 'Test Booking',
              startDate: '2025-08-01',
              endDate: '2025-08-03',
              status: 'Confirmed'
            }
          ])
        });
      }
    });

    // Mock admin API
    await this.context.route('**/api/admin**', route => {
      const authHeader = route.request().headers()['authorization'];
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      } else {
        // Check if token indicates admin role
        const token = authHeader.replace('Bearer ', '');
        const isAdmin = token.includes('Administrator');
        
        if (!isAdmin) {
          route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Forbidden' })
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              message: 'Admin access granted',
              data: { adminInfo: 'test' }
            })
          });
        }
      }
    });
  }

  /**
   * Simulate slow network for performance testing
   */
  async mockSlowNetwork(delayMs: number = 2000) {
    await this.context.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      route.continue();
    });
  }

  /**
   * Setup for concurrent authentication testing
   */
  async setupConcurrentAuth() {
    let requestCount = 0;
    
    await this.context.route('**/api/auth/login', route => {
      requestCount++;
      
      // Simulate handling multiple concurrent requests
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: this.generateMockJWT('user@family.com', 'Member'),
            requestNumber: requestCount
          })
        });
      }, Math.random() * 1000); // Random delay up to 1 second
    });
  }

  /**
   * Mock cross-origin authentication for security testing
   */
  async mockCrossOriginAuth() {
    await this.context.route('**/api/auth/**', route => {
      const origin = route.request().headers()['origin'];
      
      if (origin && !origin.includes('localhost')) {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Cross-origin request blocked'
          })
        });
      } else {
        route.continue();
      }
    });
  }

  /**
   * Setup comprehensive auth mocking for full test suite
   */
  async setupComprehensiveAuthMocking() {
    await this.mockProtectedEndpoints();
    await this.mockTokenValidation('', {});
    await this.mockLogout();
    
    // Default to successful login if not otherwise mocked
    await this.mockLoginSuccess();
  }
}