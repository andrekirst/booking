import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import LandingPage from '../LandingPage';
import { ApiProvider } from '@/contexts/ApiContext';
import * as jwtUtils from '@/lib/auth/jwt';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock JWT utils
jest.mock('@/lib/auth/jwt', () => ({
  isAuthenticated: jest.fn(),
}));

// Mock the child components
jest.mock('../HeroSection', () => {
  return function MockHeroSection({ onLoginClick }: { onLoginClick: () => void }) {
    return (
      <div data-testid="hero-section">
        <button onClick={onLoginClick}>Mock Login Button</button>
      </div>
    );
  };
});

jest.mock('../FeatureHighlights', () => {
  return function MockFeatureHighlights() {
    return <div data-testid="feature-highlights">Mock Features</div>;
  };
});

jest.mock('../LoginCard', () => {
  return function MockLoginCard({ 
    isVisible, 
    onClose, 
    onLoginSuccess 
  }: { 
    isVisible: boolean; 
    onClose: () => void; 
    onLoginSuccess: () => void;
  }) {
    if (!isVisible) return null;
    return (
      <div data-testid="login-card">
        <button onClick={onClose}>Close</button>
        <button onClick={onLoginSuccess}>Login Success</button>
      </div>
    );
  };
});

const mockPush = jest.fn();
const mockIsAuthenticated = jwtUtils.isAuthenticated as jest.MockedFunction<typeof jwtUtils.isAuthenticated>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ApiProvider>{children}</ApiProvider>
);

describe('LandingPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockIsAuthenticated.mockClear();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as unknown as ReturnType<typeof useRouter>);
  });

  it('redirects authenticated users to bookings', async () => {
    mockIsAuthenticated.mockReturnValue(true);

    render(
      <TestWrapper>
        <LandingPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/bookings');
    });
  });

  it('shows loading state while checking authentication', () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(
      <TestWrapper>
        <LandingPage />
      </TestWrapper>
    );

    expect(screen.getByText('Wird geladen...')).toBeInTheDocument();
  });

  it('renders landing page for non-authenticated users', async () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(
      <TestWrapper>
        <LandingPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('feature-highlights')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('renders footer with correct content', async () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(
      <TestWrapper>
        <LandingPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Garten Buchungssystem')).toBeInTheDocument();
      expect(screen.getByText(/Ihr persönliches Buchungssystem/)).toBeInTheDocument();
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
      expect(screen.getByText('Kontakt & Hilfe')).toBeInTheDocument();
    });
  });

  it('shows and hides login modal correctly', async () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(
      <TestWrapper>
        <LandingPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    // Initially login card should not be visible
    expect(screen.queryByTestId('login-card')).not.toBeInTheDocument();

    // Click login button to show modal
    const loginButton = screen.getByText('Mock Login Button');
    loginButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('login-card')).toBeInTheDocument();
    });

    // Close the modal
    const closeButton = screen.getByText('Close');
    closeButton.click();

    await waitFor(() => {
      expect(screen.queryByTestId('login-card')).not.toBeInTheDocument();
    });
  });

  it('handles successful login and redirects', async () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(
      <TestWrapper>
        <LandingPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    // Show login modal
    const loginButton = screen.getByText('Mock Login Button');
    loginButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('login-card')).toBeInTheDocument();
    });

    // Trigger successful login
    const successButton = screen.getByText('Login Success');
    successButton.click();

    // Should hide modal and redirect
    await waitFor(() => {
      expect(screen.queryByTestId('login-card')).not.toBeInTheDocument();
    });
    
    expect(mockPush).toHaveBeenCalledWith('/bookings');
  });

  it('renders footer links correctly', async () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(
      <TestWrapper>
        <LandingPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Registrieren/ })).toHaveAttribute('href', '/register');
    });
  });

  it('displays current year in copyright', async () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(
      <TestWrapper>
        <LandingPage />
      </TestWrapper>
    );

    const currentYear = new Date().getFullYear();
    await waitFor(() => {
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });
  });
});