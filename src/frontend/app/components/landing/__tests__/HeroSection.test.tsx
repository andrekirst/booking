import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HeroSection from '../HeroSection';

describe('HeroSection', () => {
  const mockOnLoginClick = jest.fn();

  beforeEach(() => {
    mockOnLoginClick.mockClear();
  });

  it('renders hero content correctly', () => {
    render(<HeroSection onLoginClick={mockOnLoginClick} />);
    
    expect(screen.getByText(/Willkommen im/)).toBeInTheDocument();
    expect(screen.getByText(/Garten/)).toBeInTheDocument();
    expect(screen.getByText(/Ihr persönliches Buchungssystem/)).toBeInTheDocument();
  });

  it('renders call-to-action buttons', () => {
    render(<HeroSection onLoginClick={mockOnLoginClick} />);
    
    expect(screen.getByRole('button', { name: /Jetzt anmelden/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mehr erfahren/ })).toBeInTheDocument();
  });

  it('calls onLoginClick when login button is clicked', () => {
    render(<HeroSection onLoginClick={mockOnLoginClick} />);
    
    const loginButton = screen.getByRole('button', { name: /Jetzt anmelden/ });
    fireEvent.click(loginButton);
    
    expect(mockOnLoginClick).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(<HeroSection onLoginClick={mockOnLoginClick} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    // Buttons without explicit type attribute are implicitly type="button" in JSX
    buttons.forEach(button => {
      expect(button.tagName).toBe('BUTTON');
    });
  });

  it('renders scroll indicator', () => {
    render(<HeroSection onLoginClick={mockOnLoginClick} />);
    
    const scrollIndicator = document.querySelector('.animate-bounce svg');
    expect(scrollIndicator).toBeInTheDocument();
  });
});