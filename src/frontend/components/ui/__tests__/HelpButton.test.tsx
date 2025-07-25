import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HelpButton from '../HelpButton';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ 
    children, 
    href, 
    target, 
    rel, 
    className, 
    onMouseEnter, 
    onMouseLeave, 
    title, 
    'aria-label': ariaLabel 
  }: {
    children: React.ReactNode;
    href: string;
    target?: string;
    rel?: string;
    className?: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    title?: string;
    'aria-label'?: string;
  }) {
    return (
      <a 
        href={href} 
        target={target} 
        rel={rel} 
        className={className}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        title={title}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  };
});

describe('HelpButton', () => {
  describe('rendering variants', () => {
    it('renders icon variant by default', () => {
      render(<HelpButton />);
      const button = screen.getByRole('link');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/help');
    });

    it('renders text variant correctly', () => {
      render(<HelpButton variant="text" />);
      const helpText = screen.getByText('Hilfe');
      expect(helpText).toBeInTheDocument();
    });

    it('renders full variant correctly', () => {
      render(<HelpButton variant="full" />);
      const fullText = screen.getByText('Benutzerhandbuch');
      expect(fullText).toBeInTheDocument();
    });
  });

  describe('topic mapping', () => {
    it('maps login topic correctly', () => {
      render(<HelpButton topic="login" />);
      const button = screen.getByRole('link');
      expect(button).toHaveAttribute('href', '/help/erste-schritte#anmeldung');
      expect(button).toHaveAttribute('title', 'Hilfe: Anmeldung');
    });

    it('maps booking-create topic correctly', () => {
      render(<HelpButton topic="booking-create" />);
      const button = screen.getByRole('link');
      expect(button).toHaveAttribute('href', '/help/buchungen#erstellen');
      expect(button).toHaveAttribute('title', 'Hilfe: Buchung erstellen');
    });

    it('falls back to home for unknown topics', () => {
      render(<HelpButton topic="unknown-topic" />);
      const button = screen.getByRole('link');
      expect(button).toHaveAttribute('href', '/help');
      expect(button).toHaveAttribute('title', 'Hilfe: Benutzerhandbuch');
    });
  });

  describe('size variants', () => {
    it('applies small size classes', () => {
      render(<HelpButton size="sm" />);
      const button = screen.getByRole('link').firstChild;
      expect(button).toHaveClass('w-6', 'h-6', 'text-xs');
    });

    it('applies medium size classes by default', () => {
      render(<HelpButton />);
      const button = screen.getByRole('link').firstChild;
      expect(button).toHaveClass('w-8', 'h-8', 'text-sm');
    });

    it('applies large size classes', () => {
      render(<HelpButton size="lg" />);
      const button = screen.getByRole('link').firstChild;
      expect(button).toHaveClass('w-10', 'h-10', 'text-base');
    });
  });

  describe('position variants', () => {
    it('renders inline position by default', () => {
      render(<HelpButton />);
      const container = screen.getByRole('link').parentElement;
      expect(container).toHaveClass('inline-block');
    });

    it('renders fixed position correctly', () => {
      render(<HelpButton position="fixed-bottom-right" />);
      const button = screen.getByRole('link').firstChild;
      expect(button).toHaveClass('fixed', 'bottom-4', 'right-4', 'z-50');
    });
  });

  describe('tooltip functionality', () => {
    it('shows tooltip on hover for inline position', () => {
      render(<HelpButton topic="login" />);
      const button = screen.getByRole('link');
      
      fireEvent.mouseEnter(button);
      expect(screen.getByText('Anmeldung')).toBeInTheDocument();
      
      fireEvent.mouseLeave(button);
      expect(screen.queryByText('Anmeldung')).not.toBeInTheDocument();
    });

    it('does not show tooltip for fixed position', () => {
      render(<HelpButton topic="login" position="fixed-bottom-right" />);
      const button = screen.getByRole('link');
      
      fireEvent.mouseEnter(button);
      expect(screen.queryByText('Anmeldung')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<HelpButton topic="login" />);
      const button = screen.getByRole('link');
      expect(button).toHaveAttribute('aria-label', 'Hilfe öffnen: Anmeldung');
    });

    it('opens in new tab with proper security attributes', () => {
      render(<HelpButton />);
      const button = screen.getByRole('link');
      expect(button).toHaveAttribute('target', '_blank');
      expect(button).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('has proper focus styles', () => {
      render(<HelpButton />);
      const button = screen.getByRole('link').firstChild;
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });
  });

  describe('custom styling', () => {
    it('applies custom className', () => {
      render(<HelpButton className="custom-class" />);
      const button = screen.getByRole('link').firstChild;
      expect(button).toHaveClass('custom-class');
    });

    it('maintains base styling with custom classes', () => {
      render(<HelpButton className="custom-class" />);
      const button = screen.getByRole('link').firstChild;
      expect(button).toHaveClass('custom-class', 'bg-blue-100', 'hover:bg-blue-200');
    });
  });

  describe('interaction', () => {
    it('has hover effects', () => {
      render(<HelpButton />);
      const button = screen.getByRole('link').firstChild;
      expect(button).toHaveClass('hover:bg-blue-200', 'hover:text-blue-800', 'hover:border-blue-400');
    });

    it('has transition effects', () => {
      render(<HelpButton />);
      const button = screen.getByRole('link').firstChild;
      expect(button).toHaveClass('transition-all', 'duration-200');
    });
  });
});