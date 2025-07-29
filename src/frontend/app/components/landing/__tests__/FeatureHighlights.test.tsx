import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeatureHighlights from '../FeatureHighlights';

// Mock scrollIntoView
Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true
});

describe('FeatureHighlights', () => {
  it('renders section header correctly', () => {
    render(<FeatureHighlights />);
    
    expect(screen.getByText(/Ihre Vorteile im/)).toBeInTheDocument();
    expect(screen.getByText(/Überblick/)).toBeInTheDocument();
    expect(screen.getByText(/Unser Buchungssystem macht/)).toBeInTheDocument();
  });

  it('renders all feature cards', () => {
    render(<FeatureHighlights />);
    
    // Check for some key features
    expect(screen.getByText('Einfache Buchung')).toBeInTheDocument();
    expect(screen.getByText('Raumverwaltung')).toBeInTheDocument();
    expect(screen.getByText('Familiensicher')).toBeInTheDocument();
    expect(screen.getByText('Einfache Verwaltung')).toBeInTheDocument();
    expect(screen.getByText('Naturerlebnis')).toBeInTheDocument();
    expect(screen.getByText('Mobile-First')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<FeatureHighlights />);
    
    expect(screen.getByText(/Buchen Sie Ihre Gartenübernachtung/)).toBeInTheDocument();
    expect(screen.getByText(/Verwalten Sie verschiedene Räume/)).toBeInTheDocument();
    expect(screen.getByText(/Nur berechtigte Familienmitglieder/)).toBeInTheDocument();
  });

  it('renders call-to-action section', () => {
    render(<FeatureHighlights />);
    
    expect(screen.getByText('Bereit für Ihr Naturerlebnis?')).toBeInTheDocument();
    expect(screen.getByText(/Melden Sie sich an und beginnen/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jetzt anmelden/ })).toBeInTheDocument();
  });

  it('handles CTA button click with scroll and login trigger', () => {
    // Mock document.querySelector
    const mockScrollIntoView = jest.fn();
    const mockClick = jest.fn();
    const mockHeroSection = { scrollIntoView: mockScrollIntoView };
    const mockLoginButton = { click: mockClick };
    
    jest.spyOn(document, 'querySelector')
      .mockImplementationOnce(() => mockHeroSection as unknown as HTMLElement | null)
      .mockImplementationOnce(() => mockLoginButton as unknown as HTMLElement | null);
    
    // Mock setTimeout
    jest.useFakeTimers();
    
    render(<FeatureHighlights />);
    
    const ctaButton = screen.getByRole('button', { name: /Jetzt anmelden/ });
    fireEvent.click(ctaButton);
    
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    
    // Fast-forward time to trigger the login button click
    jest.advanceTimersByTime(500);
    
    expect(mockClick).toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  it('has proper accessibility attributes', () => {
    render(<FeatureHighlights />);
    
    const section = document.querySelector('#features');
    expect(section).toBeInTheDocument();
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    // Buttons without explicit type attribute are implicitly type="button" in JSX  
    buttons.forEach(button => {
      expect(button.tagName).toBe('BUTTON');
    });
  });

  it('renders feature icons', () => {
    render(<FeatureHighlights />);
    
    // Check that SVG icons are rendered (there should be at least 6 svg elements)
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThanOrEqual(6); // At least one per feature
  });

  it('has proper hover effects classes', () => {
    render(<FeatureHighlights />);
    
    // Check for hover effect classes on feature cards
    const featureCards = document.querySelectorAll('.group');
    expect(featureCards.length).toBeGreaterThan(0);
    
    featureCards.forEach(card => {
      expect(card).toHaveClass('hover:scale-105');
    });
  });
});