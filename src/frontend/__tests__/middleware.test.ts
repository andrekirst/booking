/**
 * @jest-environment node
 */

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(),
    redirect: jest.fn(),
  },
}));

// Import after mocking
import { middleware } from '../middleware';
import { NextResponse, NextRequest } from 'next/server';

describe('Middleware Route Protection', () => {
  // Helper function um NextRequest mit URL und optionalen Headers/Cookies zu erstellen
  const createMockRequest = (
    url: string, 
    options: {
      cookies?: { [key: string]: string };
      headers?: { [key: string]: string };
    } = {}
  ): NextRequest => {
    const request = {
      nextUrl: new URL(url, 'http://localhost:3000'),
      url,
      cookies: {
        get: jest.fn((name: string) => {
          const cookieValue = options.cookies?.[name];
          return cookieValue ? { value: cookieValue } : undefined;
        }),
      },
      headers: {
        get: jest.fn((name: string) => options.headers?.[name] || null),
      },
    } as unknown as NextRequest;

    return request;
  };

  // Helper function um Redirect-URL aus Mock-Aufruf zu extrahieren
  const getRedirectUrl = (mockCall: any): string => {
    // NextResponse.redirect wird mit URL-Objekt aufgerufen
    const urlArg = mockCall[0];
    return urlArg.toString();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (NextResponse.next as jest.Mock).mockReturnValue({ type: 'next' });
    (NextResponse.redirect as jest.Mock).mockImplementation((url) => ({ type: 'redirect', url }));
  });

  describe('Geschützte Routes ohne Authentifizierung', () => {
    test('sollte /bookings zu /login?redirect=%2Fbookings weiterleiten', () => {
      const request = createMockRequest('http://localhost:3000/bookings');
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      expect(redirectUrl).toBe('http://localhost:3000/login?redirect=%2Fbookings');
    });

    test('sollte /admin zu /login?redirect=%2Fadmin weiterleiten', () => {
      const request = createMockRequest('http://localhost:3000/admin');
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      expect(redirectUrl).toBe('http://localhost:3000/login?redirect=%2Fadmin');
    });

    test('sollte /profile zu /login?redirect=%2Fprofile weiterleiten', () => {
      const request = createMockRequest('http://localhost:3000/profile');
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      expect(redirectUrl).toBe('http://localhost:3000/login?redirect=%2Fprofile');
    });

    test('sollte verschachtelte geschützte Routes weiterleiten (/bookings/123)', () => {
      const request = createMockRequest('http://localhost:3000/bookings/123');
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      expect(redirectUrl).toBe('http://localhost:3000/login?redirect=%2Fbookings%2F123');
    });

    test('sollte verschachtelte Admin-Routes weiterleiten (/admin/users)', () => {
      const request = createMockRequest('http://localhost:3000/admin/users');
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      expect(redirectUrl).toBe('http://localhost:3000/login?redirect=%2Fadmin%2Fusers');
    });

    test('sollte nur Pathname ohne Query-Parameter in Redirect-URL verwenden', () => {
      const request = createMockRequest('http://localhost:3000/bookings?start=2024-01-01&end=2024-01-05');
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      // Middleware verwendet nur pathname, nicht die komplette URL mit Query-Parametern
      expect(redirectUrl).toBe('http://localhost:3000/login?redirect=%2Fbookings');
    });
  });

  describe('Geschützte Routes mit Authentifizierung', () => {
    test('sollte Zugriff auf /bookings mit gültigem Cookie-Token erlauben', () => {
      const request = createMockRequest('http://localhost:3000/bookings', {
        cookies: { auth_token: 'valid-jwt-token-123' }
      });
      
      middleware(request);
      
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte Zugriff auf /admin mit gültigem Authorization Header erlauben', () => {
      const request = createMockRequest('http://localhost:3000/admin', {
        headers: { authorization: 'Bearer valid-jwt-token-456' }
      });
      
      middleware(request);
      
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte Zugriff auf /profile mit Cookie-Token erlauben', () => {
      const request = createMockRequest('http://localhost:3000/profile', {
        cookies: { auth_token: 'user-profile-token' }
      });
      
      middleware(request);
      
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte verschachtelte Routes mit Token erlauben (/bookings/new)', () => {
      const request = createMockRequest('http://localhost:3000/bookings/new', {
        cookies: { auth_token: 'create-booking-token' }
      });
      
      middleware(request);
      
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte Cookie-Token Vorrang vor Authorization Header geben bei beiden vorhanden', () => {
      const request = createMockRequest('http://localhost:3000/admin', {
        cookies: { auth_token: 'cookie-token' },
        headers: { authorization: 'Bearer header-token' }
      });
      
      middleware(request);
      
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      
      // Cookie wird verwendet, da es Vorrang hat (|| Operator)
      expect(request.cookies.get).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('Öffentliche Routes', () => {
    test('sollte Homepage (/) immer erlauben', () => {
      const request = createMockRequest('http://localhost:3000/');
      
      middleware(request);
      
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte /login ohne Token erlauben', () => {
      const request = createMockRequest('http://localhost:3000/login');
      
      middleware(request);
      
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte /register ohne Token erlauben', () => {
      const request = createMockRequest('http://localhost:3000/register');
      
      middleware(request);
      
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte /verify-email ohne Token erlauben', () => {
      const request = createMockRequest('http://localhost:3000/verify-email');
      
      middleware(request);
      
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte /api-test ohne Token erlauben', () => {
      const request = createMockRequest('http://localhost:3000/api-test');
      
      middleware(request);
      
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte öffentliche Routes mit Query-Parametern erlauben', () => {
      const request = createMockRequest('http://localhost:3000/verify-email?token=abc123&user=456');
      
      middleware(request);
      
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });
  });

  describe('Bereits authentifizierte Benutzer', () => {
    test('sollte authentifizierten Benutzer von /login zu /bookings weiterleiten', () => {
      const request = createMockRequest('http://localhost:3000/login', {
        cookies: { auth_token: 'authenticated-user-token' }
      });
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      expect(redirectUrl).toBe('http://localhost:3000/bookings');
    });

    test('sollte authentifizierten Benutzer von /register zu /bookings weiterleiten', () => {
      const request = createMockRequest('http://localhost:3000/register', {
        cookies: { auth_token: 'authenticated-user-token' }
      });
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      expect(redirectUrl).toBe('http://localhost:3000/bookings');
    });

    test('sollte authentifizierten Benutzer mit Authorization Header von /login weiterleiten', () => {
      const request = createMockRequest('http://localhost:3000/login', {
        headers: { authorization: 'Bearer valid-auth-token' }
      });
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      expect(redirectUrl).toBe('http://localhost:3000/bookings');
    });

    test('sollte /verify-email trotz Token erlauben (nicht zu Bookings weiterleiten)', () => {
      const request = createMockRequest('http://localhost:3000/verify-email', {
        cookies: { auth_token: 'authenticated-user-token' }
      });
      
      middleware(request);
      
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    test('sollte leeren Token als unauthentifiziert behandeln', () => {
      const request = createMockRequest('http://localhost:3000/bookings', {
        cookies: { auth_token: '' }
      });
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      expect(redirectUrl).toBe('http://localhost:3000/login?redirect=%2Fbookings');
    });

    test('sollte null Token als unauthentifiziert behandeln', () => {
      const request = createMockRequest('http://localhost:3000/admin', {
        cookies: { auth_token: null as any }
      });
      
      // Mock get() to return undefined for null token
      (request.cookies.get as jest.Mock).mockReturnValue(undefined);
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      expect(redirectUrl).toBe('http://localhost:3000/login?redirect=%2Fadmin');
    });

    test('sollte undefined Authorization Header korrekt behandeln', () => {
      const request = createMockRequest('http://localhost:3000/profile', {
        headers: { authorization: undefined as any }
      });
      
      // Mock headers.get() to return null for undefined header
      (request.headers.get as jest.Mock).mockReturnValue(null);
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      expect(redirectUrl).toBe('http://localhost:3000/login?redirect=%2Fprofile');
    });

    test('sollte Authorization Header ohne "Bearer " Prefix als gültigen Token behandeln', () => {
      const request = createMockRequest('http://localhost:3000/bookings', {
        headers: { authorization: 'InvalidFormat token123' }
      });
      
      middleware(request);
      
      // Da replace() nur "Bearer " ersetzt und "InvalidFormat token123" nicht ändert,
      // wird es als gültiger Token behandelt
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte nur "Bearer " ohne Token als leer behandeln', () => {
      const request = createMockRequest('http://localhost:3000/admin', {
        headers: { authorization: 'Bearer ' }
      });
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      expect(redirectUrl).toBe('http://localhost:3000/login?redirect=%2Fadmin');
    });

    test('sollte nicht-existierende geschützte Routes weiterleiten', () => {
      const request = createMockRequest('http://localhost:3000/bookings/non-existent-page');
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      expect(redirectUrl).toBe('http://localhost:3000/login?redirect=%2Fbookings%2Fnon-existent-page');
    });

    test('sollte Case-Sensitivity korrekt behandeln', () => {
      const request = createMockRequest('http://localhost:3000/BOOKINGS');
      
      middleware(request);
      
      // /BOOKINGS ist nicht in protectedRoutes (/bookings), also sollte es durchgelassen werden
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte Pfade mit ähnlichen Namen korrekt unterscheiden', () => {
      const request = createMockRequest('http://localhost:3000/booking-helper');
      
      middleware(request);
      
      // /booking-helper startet nicht mit /bookings, also sollte es durchgelassen werden
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte mehrfache Slashes in URL korrekt behandeln', () => {
      const request = createMockRequest('http://localhost:3000//bookings//123');
      
      middleware(request);
      
      // //bookings//123 startet nicht mit /bookings, daher wird es durchgelassen
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });
  });

  describe('Token-Extraktion', () => {
    test('sollte Token aus Cookie extrahieren wenn vorhanden', () => {
      const request = createMockRequest('http://localhost:3000/bookings', {
        cookies: { auth_token: 'cookie-token-value' }
      });
      
      middleware(request);
      
      expect(request.cookies.get).toHaveBeenCalledWith('auth_token');
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte Token aus Authorization Header extrahieren wenn Cookie fehlt', () => {
      const request = createMockRequest('http://localhost:3000/bookings', {
        headers: { authorization: 'Bearer header-token-value' }
      });
      
      // Mock Cookie als leer
      (request.cookies.get as jest.Mock).mockReturnValue(undefined);
      
      middleware(request);
      
      expect(request.cookies.get).toHaveBeenCalledWith('auth_token');
      expect(request.headers.get).toHaveBeenCalledWith('authorization');
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte Cookie-Token bevorzugen wenn beide vorhanden', () => {
      const request = createMockRequest('http://localhost:3000/bookings', {
        cookies: { auth_token: 'cookie-token' },
        headers: { authorization: 'Bearer header-token' }
      });
      
      middleware(request);
      
      // Cookie wird zuerst geprüft und verwendet, Header wird ignoriert
      expect(request.cookies.get).toHaveBeenCalledWith('auth_token');
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });

    test('sollte Authorization Header verwenden wenn Cookie leer ist', () => {
      const request = createMockRequest('http://localhost:3000/bookings', {
        cookies: { auth_token: '' }, // Leerer Cookie
        headers: { authorization: 'Bearer fallback-header-token' }
      });
      
      // Mock Cookie als undefined (leer)
      (request.cookies.get as jest.Mock).mockReturnValue({ value: '' });
      
      middleware(request);
      
      expect(request.cookies.get).toHaveBeenCalledWith('auth_token');
      expect(request.headers.get).toHaveBeenCalledWith('authorization');
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
    });
  });

  describe('URL-Konstruktion', () => {
    test('sollte korrekte Login-URL mit Redirect-Parameter erstellen', () => {
      const request = createMockRequest('http://localhost:3000/bookings');
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      
      const url = new URL(redirectUrl);
      expect(url.pathname).toBe('/login');
      expect(url.searchParams.get('redirect')).toBe('/bookings');
    });

    test('sollte korrekte Bookings-URL für authentifizierte Redirects erstellen', () => {
      const request = createMockRequest('http://localhost:3000/login', {
        cookies: { auth_token: 'valid-token' }
      });
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      
      const url = new URL(redirectUrl);
      expect(url.pathname).toBe('/bookings');
      expect(url.searchParams.toString()).toBe(''); // Keine Query-Parameter
    });

    test('sollte Base-URL aus Request korrekt verwenden', () => {
      const request = createMockRequest('https://booking.example.com/admin');
      
      middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = getRedirectUrl((NextResponse.redirect as jest.Mock).mock.calls[0]);
      
      expect(redirectUrl).toBe('https://booking.example.com/login?redirect=%2Fadmin');
    });
  });

  describe('Route-Matching-Logik', () => {
    test('sollte startsWith korrekt für geschützte Routes verwenden', () => {
      // Test dass /bookings/anything als geschützt erkannt wird
      const testCases = [
        '/bookings',
        '/bookings/',
        '/bookings/new',
        '/bookings/123',
        '/bookings/123/edit',
        '/bookings/user/profile',
      ];

      testCases.forEach(path => {
        const request = createMockRequest(`http://localhost:3000${path}`);
        middleware(request);
        
        expect(NextResponse.redirect).toHaveBeenCalled();
        
        // Mock zurücksetzen für nächsten Test
        jest.clearAllMocks();
        (NextResponse.redirect as jest.Mock).mockImplementation((url) => ({ type: 'redirect', url }));
      });
    });

    test('sollte exakte Übereinstimmung für öffentliche Routes verwenden', () => {
      // Test dass nur exakte öffentliche Routes erlaubt sind
      const allowedCases = [
        '/',
        '/login',
        '/register',
        '/verify-email',
        '/api-test'
      ];

      const deniedCases = [
        '/login/forgot',
        '/register/success',
        '/verify-email/resend'
      ];

      // Erlaubte Cases
      allowedCases.forEach(path => {
        const request = createMockRequest(`http://localhost:3000${path}`);
        middleware(request);
        
        expect(NextResponse.redirect).not.toHaveBeenCalled();
        expect(NextResponse.next).toHaveBeenCalledTimes(1);
        
        jest.clearAllMocks();
        (NextResponse.next as jest.Mock).mockReturnValue({ type: 'next' });
      });

      // Nicht-erlaubte Cases (werden als normale Routes behandelt, nicht geschützt)
      deniedCases.forEach(path => {
        const request = createMockRequest(`http://localhost:3000${path}`);
        middleware(request);
        
        // Diese sind weder geschützt noch öffentlich, also werden sie durchgelassen
        expect(NextResponse.redirect).not.toHaveBeenCalled();
        expect(NextResponse.next).toHaveBeenCalledTimes(1);
        
        jest.clearAllMocks();
        (NextResponse.next as jest.Mock).mockReturnValue({ type: 'next' });
      });
    });
  });
});