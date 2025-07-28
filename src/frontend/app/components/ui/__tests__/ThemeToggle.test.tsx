/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const renderWithTheme = (defaultTheme = 'system') => {
  return render(
    <ThemeProvider defaultTheme={defaultTheme as any}>
      <ThemeToggle />
    </ThemeProvider>
  );
};

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('renders theme toggle button', () => {
    renderWithTheme();
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Aktuelles Theme'));
  });

  it('shows system theme icon by default', () => {
    renderWithTheme('system');
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('System'));
  });

  it('shows light theme icon when light theme is selected', () => {
    renderWithTheme('light');
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Hell'));
  });

  it('shows dark theme icon when dark theme is selected', () => {
    renderWithTheme('dark');
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Dunkel'));
  });

  it('opens dropdown when clicked', async () => {
    renderWithTheme();
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Hell/ })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Dunkel/ })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /System/ })).toBeInTheDocument();
    });
  });

  it('highlights currently selected theme in dropdown', async () => {
    renderWithTheme('dark');
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const darkOption = screen.getByRole('menuitem', { name: /Dunkel/ });
      expect(darkOption).toHaveClass('bg-blue-50');
    });
  });

  it('changes theme when dropdown option is clicked', async () => {
    renderWithTheme('system');
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const lightOption = screen.getByRole('menuitem', { name: /Hell/ });
      fireEvent.click(lightOption);
    });

    // Should close dropdown and save to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes dropdown when clicking outside', async () => {
    renderWithTheme();
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Hell/ })).toBeInTheDocument();
    });

    // Click outside
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('has proper accessibility attributes', () => {
    renderWithTheme();
    
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
  });

  it('supports keyboard navigation', async () => {
    renderWithTheme();
    
    const button = screen.getByRole('button');
    
    // Focus should be visible
    button.focus();
    expect(button).toHaveFocus();
    
    // Enter should open dropdown
    fireEvent.keyDown(button, { key: 'Enter' });
    
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('shows visual indicator for selected theme in dropdown', async () => {
    renderWithTheme('light');
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const lightOption = screen.getByRole('menuitem', { name: /Hell/ });
      const indicator = lightOption.querySelector('.bg-blue-600');
      expect(indicator).toBeInTheDocument();
    });
  });

  it('handles theme switching correctly', async () => {
    renderWithTheme('system');
    
    const button = screen.getByRole('button');
    
    // Initial state
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('System'));
    
    // Switch to dark
    fireEvent.click(button);
    
    await waitFor(() => {
      const darkOption = screen.getByRole('menuitem', { name: /Dunkel/ });
      fireEvent.click(darkOption);
    });
    
    // Should update button label
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Dunkel'));
    });
  });
});