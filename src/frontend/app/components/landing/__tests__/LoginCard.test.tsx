import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginCard from '../LoginCard';
import { ApiProvider } from '@/contexts/ApiContext';

// Mock the API client
const mockApiClient = {
  login: jest.fn(),
};

jest.mock('@/contexts/ApiContext', () => ({
  ...jest.requireActual('@/contexts/ApiContext'),
  useApi: () => ({ apiClient: mockApiClient }),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockedLink';
  return MockLink;
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ApiProvider>{children}</ApiProvider>
);

describe('LoginCard', () => {
  const mockOnClose = jest.fn();
  const mockOnLoginSuccess = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnLoginSuccess.mockClear();
    mockApiClient.login.mockClear();
  });

  it('renders login form when visible', () => {
    render(
      <TestWrapper>
        <LoginCard 
          isVisible={true} 
          onClose={mockOnClose} 
          onLoginSuccess={mockOnLoginSuccess} 
        />
      </TestWrapper>
    );
    
    expect(screen.getByRole('heading', { name: 'Anmelden' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-Mail-Adresse')).toBeInTheDocument();
    expect(screen.getByLabelText('Passwort')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Anmelden/ })).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(
      <TestWrapper>
        <LoginCard 
          isVisible={false} 
          onClose={mockOnClose} 
          onLoginSuccess={mockOnLoginSuccess} 
        />
      </TestWrapper>
    );
    
    expect(screen.queryByRole('heading', { name: 'Anmelden' })).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <TestWrapper>
        <LoginCard 
          isVisible={true} 
          onClose={mockOnClose} 
          onLoginSuccess={mockOnLoginSuccess} 
        />
      </TestWrapper>
    );
    
    const closeButton = screen.getByLabelText('Schließen');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <TestWrapper>
        <LoginCard 
          isVisible={true} 
          onClose={mockOnClose} 
          onLoginSuccess={mockOnLoginSuccess} 
        />
      </TestWrapper>
    );
    
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
    fireEvent.click(backdrop!);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles form submission successfully', async () => {
    mockApiClient.login.mockResolvedValue({ token: 'fake-token' });
    
    render(
      <TestWrapper>
        <LoginCard 
          isVisible={true} 
          onClose={mockOnClose} 
          onLoginSuccess={mockOnLoginSuccess} 
        />
      </TestWrapper>
    );
    
    const emailInput = screen.getByLabelText('E-Mail-Adresse');
    const passwordInput = screen.getByLabelText('Passwort');
    const submitButton = screen.getByRole('button', { name: /Anmelden/ });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    expect(mockApiClient.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    
    await waitFor(() => {
      expect(screen.getByText('Anmeldung erfolgreich')).toBeInTheDocument();
    });
    
    // Wait for the success callback
    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1);
    }, { timeout: 1500 });
  });

  it('handles login error', async () => {
    mockApiClient.login.mockRejectedValue(new Error('Invalid credentials'));
    
    render(
      <TestWrapper>
        <LoginCard 
          isVisible={true} 
          onClose={mockOnClose} 
          onLoginSuccess={mockOnLoginSuccess} 
        />
      </TestWrapper>
    );
    
    const emailInput = screen.getByLabelText('E-Mail-Adresse');
    const passwordInput = screen.getByLabelText('Passwort');
    const submitButton = screen.getByRole('button', { name: /Anmelden/ });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/)).toBeInTheDocument();
    });
    
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });

  it('shows loading state during login', async () => {
    mockApiClient.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <TestWrapper>
        <LoginCard 
          isVisible={true} 
          onClose={mockOnClose} 
          onLoginSuccess={mockOnLoginSuccess} 
        />
      </TestWrapper>
    );
    
    const emailInput = screen.getByLabelText('E-Mail-Adresse');
    const passwordInput = screen.getByLabelText('Passwort');
    const submitButton = screen.getByRole('button', { name: /Anmelden/ });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Wird angemeldet...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('renders registration link', () => {
    render(
      <TestWrapper>
        <LoginCard 
          isVisible={true} 
          onClose={mockOnClose} 
          onLoginSuccess={mockOnLoginSuccess} 
        />
      </TestWrapper>
    );
    
    expect(screen.getByText('Noch kein Konto?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Jetzt registrieren/ })).toHaveAttribute('href', '/register');
  });
});