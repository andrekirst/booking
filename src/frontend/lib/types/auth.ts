/**
 * User information extracted from JWT token
 */
export interface UserInfo {
  /** Full name of the user */
  name: string;
  /** Email address */
  email: string;
  /** User role (e.g., 'Administrator', 'Member') */
  role: string;
  /** Unique user identifier */
  userId: number;
  /** Whether user has admin privileges */
  isAdmin: boolean;
}

/**
 * User menu item definition
 */
export interface UserMenuItem {
  /** Display label */
  label: string;
  /** Icon component or icon name */
  icon: React.ComponentType<{ className?: string }> | string;
  /** onClick handler */
  onClick: () => void;
  /** Whether item should be shown (for conditional rendering) */
  show?: boolean;
  /** Visual styling variant */
  variant?: 'default' | 'danger';
  /** Whether to show a separator after this item */
  showSeparator?: boolean;
}

/**
 * Props for UserMenuDropdown component
 */
export interface UserMenuDropdownProps {
  /** User information to display */
  userInfo: UserInfo;
  /** Callback when logout is clicked */
  onLogout: () => void;
  /** Callback when profile is clicked */
  onProfileClick?: () => void;
  /** Callback when admin is clicked */
  onAdminClick?: () => void;
  /** Custom menu items */
  customItems?: UserMenuItem[];
  /** Position of dropdown */
  position?: 'bottom-right' | 'bottom-left';
}

/**
 * Props for UserAvatar component
 */
export interface UserAvatarProps {
  /** User information */
  userInfo: UserInfo;
  /** Size of avatar */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show name next to avatar */
  showName?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}