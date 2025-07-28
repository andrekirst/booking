/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { GlobalHeader } from '../GlobalHeader';
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

const renderWithTheme = () => {
  return render(
    <ThemeProvider defaultTheme="system">
      <GlobalHeader />
    </ThemeProvider>
  );
};

describe('GlobalHeader', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('renders the header with title', () => {
    renderWithTheme();
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Garten Buchungssystem');
  });

  it('includes the theme toggle component when showThemeToggle is true', () => {
    render(
      <ThemeProvider defaultTheme="system">
        <GlobalHeader showThemeToggle={true} />
      </ThemeProvider>
    );
    
    const themeToggle = screen.getByRole('button');
    expect(themeToggle).toBeInTheDocument();
    expect(themeToggle).toHaveAttribute('aria-label', expect.stringContaining('Aktuelles Theme'));
  });

  it('does not include theme toggle when showThemeToggle is false', () => {
    render(
      <ThemeProvider defaultTheme="system">
        <GlobalHeader showThemeToggle={false} />
      </ThemeProvider>
    );
    
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  it('does not include theme toggle by default', () => {
    render(
      <ThemeProvider defaultTheme="system">
        <GlobalHeader />
      </ThemeProvider>
    );
    
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  it('has proper header structure with container and flex layout', () => {
    renderWithTheme();
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-white', 'dark:bg-gray-800', 'shadow-sm', 'border-b');
    
    // Check for container structure
    const container = header.querySelector('.container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('mx-auto', 'px-4', 'py-4');
    
    // Check for flex layout
    const flexContainer = container?.querySelector('.flex');
    expect(flexContainer).toBeInTheDocument();
    expect(flexContainer).toHaveClass('justify-between', 'items-center');
  });

  it('applies correct styling classes', () => {
    renderWithTheme();
    
    const header = screen.getByRole('banner');
    
    // Header styling
    expect(header).toHaveClass(
      'bg-white',
      'dark:bg-gray-800',
      'shadow-sm',
      'border-b',
      'border-gray-200',
      'dark:border-gray-700'
    );
    
    // Title styling
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveClass(
      'text-2xl',
      'font-bold',
      'text-gray-800',
      'dark:text-gray-100'
    );
  });

  it('maintains responsive design with container classes', () => {
    renderWithTheme();
    
    const header = screen.getByRole('banner');
    const container = header.querySelector('.container');
    
    expect(container).toHaveClass('container', 'mx-auto', 'px-4', 'py-4');
  });
});