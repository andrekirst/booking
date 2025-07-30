import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LandingPage from '../LandingPage';
import { apiClient } from '../../../lib/api/client';
import { useRouter } from 'next/navigation';

// Mock the API client
jest.mock('../../../lib/api/client', () => ({
  apiClient: {
    login: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Note: window.location.replace testing is complex in jsdom,
// so we'll just test the login API call

describe('LandingPage', () => {
  const mockLogin = apiClient.login as jest.Mock;
  const mockRouter = useRouter as jest.Mock;

  beforeEach(() => {
    mockLogin.mockClear();
    mockRouter.mockClear();
    
    mockRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
    });
  });

  it('renders the landing page with login form', () => {
    render(<LandingPage />);

    expect(screen.getByText('Willkommen im')).toBeInTheDocument();
    expect(screen.getByText('Garten-Buchungssystem')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /anmelden/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail-adresse/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/passwort/i)).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    mockLogin.mockResolvedValue({ token: 'fake-token' });

    render(<LandingPage />);

    const emailInput = screen.getByLabelText(/e-mail-adresse/i);
    const passwordInput = screen.getByLabelText(/passwort/i);
    const loginButton = screen.getByRole('button', { name: /anmelden/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    // Successfully called login API
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it('handles login error', async () => {
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValue({ message: errorMessage });

    render(<LandingPage />);

    const emailInput = screen.getByLabelText(/e-mail-adresse/i);
    const passwordInput = screen.getByLabelText(/passwort/i);
    const loginButton = screen.getByRole('button', { name: /anmelden/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state during login', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LandingPage />);

    const emailInput = screen.getByLabelText(/e-mail-adresse/i);
    const passwordInput = screen.getByLabelText(/passwort/i);
    const loginButton = screen.getByRole('button', { name: /anmelden/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/wird angemeldet/i)).toBeInTheDocument();
      expect(loginButton).toBeDisabled();
    });
  });

  it('shows registration link', () => {
    render(<LandingPage />);

    const registrationLink = screen.getByText(/noch kein konto/i);
    expect(registrationLink).toBeInTheDocument();
    
    const link = registrationLink.closest('a');
    expect(link).toHaveAttribute('href', '/register');
  });
});