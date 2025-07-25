import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserAvatar } from '../UserAvatar';
import { UserInfo } from '@/lib/types/auth';

// Mock user data
const mockUser: UserInfo = {
  name: 'Max Mustermann',
  email: 'max@example.com',
  role: 'Administrator',
  userId: 1,
  isAdmin: true
};

const mockOnClick = jest.fn();

describe('UserAvatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render user initials', () => {
      render(<UserAvatar userInfo={mockUser} />);
      
      expect(screen.getByText('MM')).toBeInTheDocument();
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<UserAvatar userInfo={mockUser} size="sm" />);
      let avatar = screen.getByText('MM');
      expect(avatar).toHaveClass('h-8', 'w-8', 'text-sm');

      rerender(<UserAvatar userInfo={mockUser} size="md" />);
      avatar = screen.getByText('MM');
      expect(avatar).toHaveClass('h-10', 'w-10', 'text-base');

      rerender(<UserAvatar userInfo={mockUser} size="lg" />);
      avatar = screen.getByText('MM');
      expect(avatar).toHaveClass('h-12', 'w-12', 'text-lg');
    });

    it('should apply custom className', () => {
      render(<UserAvatar userInfo={mockUser} className="custom-class" />);
      
      const avatar = screen.getByText('MM');
      expect(avatar).toHaveClass('custom-class');
    });
  });

  describe('Initials Generation', () => {
    it('should generate initials from first and last name', () => {
      render(<UserAvatar userInfo={mockUser} />);
      
      expect(screen.getByText('MM')).toBeInTheDocument();
    });

    it('should handle single name', () => {
      const singleNameUser = { ...mockUser, name: 'Max' };
      render(<UserAvatar userInfo={singleNameUser} />);
      
      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('should handle three names and take only first two initials', () => {
      const threeNameUser = { ...mockUser, name: 'Max Peter Mustermann' };
      render(<UserAvatar userInfo={threeNameUser} />);
      
      expect(screen.getByText('MP')).toBeInTheDocument();
    });

    it('should handle empty name', () => {
      const emptyNameUser = { ...mockUser, name: '' };
      render(<UserAvatar userInfo={emptyNameUser} />);
      
      // Should still render something (empty string becomes empty initials)
      const avatar = screen.getByTitle(new RegExp(`\\s*\\(${emptyNameUser.email}\\)`));
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Show Name Variant', () => {
    it('should show name when showName is true', () => {
      render(<UserAvatar userInfo={mockUser} showName={true} />);
      
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
      expect(screen.getByText('max@example.com')).toBeInTheDocument();
    });

    it('should not show name when showName is false', () => {
      render(<UserAvatar userInfo={mockUser} showName={false} />);
      
      expect(screen.queryByText('Max Mustermann')).not.toBeInTheDocument();
      expect(screen.queryByText('max@example.com')).not.toBeInTheDocument();
    });

    it('should apply correct text size classes when showing name', () => {
      const { rerender } = render(<UserAvatar userInfo={mockUser} showName={true} size="sm" />);
      let nameText = screen.getByText('Max Mustermann');
      expect(nameText).toHaveClass('text-sm');

      rerender(<UserAvatar userInfo={mockUser} showName={true} size="md" />);
      nameText = screen.getByText('Max Mustermann');
      expect(nameText).toHaveClass('text-base');

      rerender(<UserAvatar userInfo={mockUser} showName={true} size="lg" />);
      nameText = screen.getByText('Max Mustermann');
      expect(nameText).toHaveClass('text-lg');
    });

    it('should not show email if email is empty', () => {
      const noEmailUser = { ...mockUser, email: '' };
      render(<UserAvatar userInfo={noEmailUser} showName={true} />);
      
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
      expect(screen.queryByText('max@example.com')).not.toBeInTheDocument();
    });
  });

  describe('Click Interaction', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      render(<UserAvatar userInfo={mockUser} onClick={mockOnClick} />);
      
      const avatar = screen.getByText('MM');
      await user.click(avatar);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when no onClick provided', async () => {
      const user = userEvent.setup();
      render(<UserAvatar userInfo={mockUser} />);
      
      const avatar = screen.getByText('MM');
      await user.click(avatar);
      
      // Should not throw or cause errors
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should add cursor pointer when onClick is provided', () => {
      render(<UserAvatar userInfo={mockUser} onClick={mockOnClick} />);
      
      const avatar = screen.getByText('MM');
      expect(avatar).toHaveClass('cursor-pointer');
    });

    it('should not add cursor pointer when no onClick provided', () => {
      render(<UserAvatar userInfo={mockUser} />);
      
      const avatar = screen.getByText('MM');
      expect(avatar).not.toHaveClass('cursor-pointer');
    });
  });

  describe('Keyboard Interaction', () => {
    it('should call onClick on Enter key', async () => {
      const user = userEvent.setup();
      render(<UserAvatar userInfo={mockUser} onClick={mockOnClick} />);
      
      const avatar = screen.getByText('MM');
      avatar.focus();
      await user.keyboard('{Enter}');
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick on Space key', async () => {
      const user = userEvent.setup();
      render(<UserAvatar userInfo={mockUser} onClick={mockOnClick} />);
      
      const avatar = screen.getByText('MM');
      avatar.focus();
      await user.keyboard(' ');
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not respond to other keys', async () => {
      const user = userEvent.setup();
      render(<UserAvatar userInfo={mockUser} onClick={mockOnClick} />);
      
      const avatar = screen.getByText('MM');
      avatar.focus();
      await user.keyboard('{ArrowDown}');
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label when clickable', () => {
      render(<UserAvatar userInfo={mockUser} onClick={mockOnClick} />);
      
      const avatar = screen.getByLabelText('User menu for Max Mustermann');
      expect(avatar).toBeInTheDocument();
    });

    it('should have correct aria-label when not clickable', () => {
      render(<UserAvatar userInfo={mockUser} />);
      
      const avatar = screen.getByLabelText('User Max Mustermann');
      expect(avatar).toBeInTheDocument();
    });

    it('should be accessible when clickable', () => {
      render(<UserAvatar userInfo={mockUser} onClick={mockOnClick} />);
      
      const avatar = screen.getByLabelText('User menu for Max Mustermann');
      expect(avatar).toBeInTheDocument();
    });

    it('should be accessible when not clickable', () => {
      render(<UserAvatar userInfo={mockUser} />);
      
      const avatar = screen.getByLabelText('User Max Mustermann');
      expect(avatar).toBeInTheDocument();
    });

    it('should have correct tabIndex when clickable', () => {
      render(<UserAvatar userInfo={mockUser} onClick={mockOnClick} />);
      
      const avatar = screen.getByText('MM');
      expect(avatar).toHaveAttribute('tabIndex', '0');
    });

    it('should not have tabIndex when not clickable', () => {
      render(<UserAvatar userInfo={mockUser} />);
      
      const avatar = screen.getByText('MM');
      expect(avatar).not.toHaveAttribute('tabIndex');
    });

    it('should have title attribute with user info', () => {
      render(<UserAvatar userInfo={mockUser} />);
      
      const avatar = screen.getByTitle('Max Mustermann (max@example.com)');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should have gradient background', () => {
      render(<UserAvatar userInfo={mockUser} />);
      
      const avatar = screen.getByText('MM');
      expect(avatar).toHaveClass('bg-gradient-to-br', 'from-indigo-500', 'to-purple-600');
    });

    it('should have hover effects when clickable', () => {
      render(<UserAvatar userInfo={mockUser} onClick={mockOnClick} />);
      
      const avatar = screen.getByText('MM');
      expect(avatar).toHaveClass('hover:from-indigo-600', 'hover:to-purple-700');
    });

    it('should not have hover effects when not clickable', () => {
      render(<UserAvatar userInfo={mockUser} />);
      
      const avatar = screen.getByText('MM');
      expect(avatar).not.toHaveClass('hover:from-indigo-600', 'hover:to-purple-700');
    });

    it('should be rounded', () => {
      render(<UserAvatar userInfo={mockUser} />);
      
      const avatar = screen.getByText('MM');
      expect(avatar).toHaveClass('rounded-full');
    });

    it('should have proper text styling', () => {
      render(<UserAvatar userInfo={mockUser} />);
      
      const avatar = screen.getByText('MM');
      expect(avatar).toHaveClass('text-white', 'font-medium', 'select-none');
    });
  });
});