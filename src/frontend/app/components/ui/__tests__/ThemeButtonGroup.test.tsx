/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeButtonGroup } from '../ThemeButtonGroup';
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
      <ThemeButtonGroup />
    </ThemeProvider>
  );
};

describe('ThemeButtonGroup', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('renders theme label and button group', () => {
    renderWithTheme();
    
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('shows all three theme options', () => {
    renderWithTheme();
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    
    // Check that buttons have proper titles
    expect(screen.getByTitle('Hell')).toBeInTheDocument();
    expect(screen.getByTitle('Dunkel')).toBeInTheDocument();
    expect(screen.getByTitle('System')).toBeInTheDocument();
  });

  it('highlights the currently selected theme', () => {
    renderWithTheme('light');
    
    const lightButton = screen.getByTitle('Hell');
    expect(lightButton).toHaveClass('bg-blue-50');
    expect(lightButton).toHaveClass('text-blue-700');
  });

  it('shows current theme label at bottom', () => {
    renderWithTheme('dark');
    
    // The theme label should show the current theme
    expect(screen.getByText('Dunkel')).toBeInTheDocument();
  });

  it('switches theme when button is clicked', () => {
    renderWithTheme('system');
    
    const lightButton = screen.getByTitle('Hell');
    fireEvent.click(lightButton);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  it('has proper button group styling', () => {
    renderWithTheme();
    
    const buttons = screen.getAllByRole('button');
    
    // First button should not have left border
    expect(buttons[0]).not.toHaveClass('border-l');
    
    // Other buttons should have left border
    expect(buttons[1]).toHaveClass('border-l');
    expect(buttons[2]).toHaveClass('border-l');
  });

  it('has accessible focus states', () => {
    renderWithTheme();
    
    const lightButton = screen.getByTitle('Hell');
    lightButton.focus();
    
    expect(lightButton).toHaveClass('focus:outline-none');
    expect(lightButton).toHaveClass('focus:ring-2');
    expect(lightButton).toHaveClass('focus:ring-blue-500');
  });
});