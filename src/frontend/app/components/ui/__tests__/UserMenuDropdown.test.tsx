import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMenuDropdown } from '../UserMenuDropdown';
import { UserInfo } from '@/lib/types/auth';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock localStorage for theme context
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

// Mock matchMedia for theme context
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

// Mock user data
const mockAdminUser: UserInfo = {
  name: 'Max Mustermann',
  email: 'max@example.com',
  role: 'Administrator',
  userId: 1,
  isAdmin: true
};

const mockRegularUser: UserInfo = {
  name: 'Anna Schmidt',
  email: 'anna@example.com',
  role: 'Member',
  userId: 2,
  isAdmin: false
};

// Mock functions
const mockOnLogout = jest.fn();
const mockOnProfileClick = jest.fn();
const mockOnAdminClick = jest.fn();

// Wrapper component for ThemeProvider
const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider defaultTheme="system">
      {ui}
    </ThemeProvider>
  );
};

describe('UserMenuDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render user avatar button', () => {
      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockRegularUser}
          onLogout={mockOnLogout}
        />
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      expect(avatarButton).toBeInTheDocument();
    });

    it('should not show dropdown initially', () => {
      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockRegularUser}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should show dropdown when avatar is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockRegularUser}
          onLogout={mockOnLogout}
        />
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      await user.click(avatarButton);

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  describe('Menu Content', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockAdminUser}
          onLogout={mockOnLogout}
          onProfileClick={mockOnProfileClick}
          onAdminClick={mockOnAdminClick}
        />
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      await user.click(avatarButton);
    });

    it('should display user information in header', () => {
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
      expect(screen.getByText('max@example.com')).toBeInTheDocument();
      expect(screen.getByText('Administrator')).toBeInTheDocument();
    });

    it('should show profile menu item', () => {
      expect(screen.getByRole('menuitem', { name: /profil/i })).toBeInTheDocument();
    });

    it('should show admin menu item for admin users', () => {
      expect(screen.getByRole('menuitem', { name: /administration/i })).toBeInTheDocument();
    });

    it('should show logout menu item', () => {
      expect(screen.getByRole('menuitem', { name: /abmelden/i })).toBeInTheDocument();
    });
  });

  describe('Admin Visibility', () => {
    it('should show admin menu item for admin users', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockAdminUser}
          onLogout={mockOnLogout}
          onAdminClick={mockOnAdminClick}
        />
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      await user.click(avatarButton);

      expect(screen.getByRole('menuitem', { name: /administration/i })).toBeInTheDocument();
    });

    it('should not show admin menu item for regular users', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockRegularUser}
          onLogout={mockOnLogout}
        />
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      await user.click(avatarButton);

      expect(screen.queryByRole('menuitem', { name: /administration/i })).not.toBeInTheDocument();
    });
  });

  describe('Click Handlers', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockAdminUser}
          onLogout={mockOnLogout}
          onProfileClick={mockOnProfileClick}
          onAdminClick={mockOnAdminClick}
        />
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      await user.click(avatarButton);
    });

    it('should call onProfileClick when profile is clicked', async () => {
      const user = userEvent.setup();
      const profileButton = screen.getByRole('menuitem', { name: /profil/i });
      
      await user.click(profileButton);
      
      expect(mockOnProfileClick).toHaveBeenCalledTimes(1);
    });

    it('should call onAdminClick when admin is clicked', async () => {
      const user = userEvent.setup();
      const adminButton = screen.getByRole('menuitem', { name: /administration/i });
      
      await user.click(adminButton);
      
      expect(mockOnAdminClick).toHaveBeenCalledTimes(1);
    });

    it('should call onLogout when logout is clicked', async () => {
      const user = userEvent.setup();
      const logoutButton = screen.getByRole('menuitem', { name: /abmelden/i });
      
      await user.click(logoutButton);
      
      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });

    it('should close dropdown after menu item click', async () => {
      const user = userEvent.setup();
      const profileButton = screen.getByRole('menuitem', { name: /profil/i });
      
      await user.click(profileButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should open dropdown on Enter key', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockRegularUser}
          onLogout={mockOnLogout}
        />
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      avatarButton.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should open dropdown on Space key', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockRegularUser}
          onLogout={mockOnLogout}
        />
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      avatarButton.focus();
      await user.keyboard(' ');

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should close dropdown on Escape key', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockRegularUser}
          onLogout={mockOnLogout}
        />
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      await user.click(avatarButton);
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Click Outside', () => {
    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <div>
          <UserMenuDropdown
            userInfo={mockRegularUser}
            onLogout={mockOnLogout}
          />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      await user.click(avatarButton);
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      const outsideElement = screen.getByTestId('outside');
      await user.click(outsideElement);
      
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Custom Items', () => {
    it('should render custom menu items', async () => {
      const user = userEvent.setup();
      const mockCustomClick = jest.fn();
      const customItems = [
        {
          label: 'Custom Item',
          icon: ({ className }: { className?: string }) => (
            <div className={className}>🔧</div>
          ),
          onClick: mockCustomClick,
          show: true
        }
      ];

      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockRegularUser}
          onLogout={mockOnLogout}
          customItems={customItems}
        />
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      await user.click(avatarButton);

      expect(screen.getByRole('menuitem', { name: /custom item/i })).toBeInTheDocument();
    });

    it('should call custom item onClick handler', async () => {
      const user = userEvent.setup();
      const mockCustomClick = jest.fn();
      const customItems = [
        {
          label: 'Custom Item',
          icon: ({ className }: { className?: string }) => (
            <div className={className}>🔧</div>
          ),
          onClick: mockCustomClick,
          show: true
        }
      ];

      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockRegularUser}
          onLogout={mockOnLogout}
          customItems={customItems}
        />
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      await user.click(avatarButton);

      const customButton = screen.getByRole('menuitem', { name: /custom item/i });
      await user.click(customButton);

      expect(mockCustomClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes on button', () => {
      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockRegularUser}
          onLogout={mockOnLogout}
        />
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      expect(avatarButton).toHaveAttribute('aria-expanded', 'false');
      expect(avatarButton).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should update aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockRegularUser}
          onLogout={mockOnLogout}
        />
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      await user.click(avatarButton);

      expect(avatarButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have correct ARIA attributes on menu', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <UserMenuDropdown
          userInfo={mockRegularUser}
          onLogout={mockOnLogout}
        />
      );

      const avatarButton = screen.getByRole('button', { expanded: false });
      await user.click(avatarButton);

      const menu = screen.getByRole('menu');
      expect(menu).toHaveAttribute('aria-orientation', 'vertical');
    });
  });
});