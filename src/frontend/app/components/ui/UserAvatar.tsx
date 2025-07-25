'use client';

import { UserAvatarProps } from '@/lib/types/auth';

/**
 * User avatar component that displays user's initials or icon
 */
export function UserAvatar({ 
  userInfo, 
  size = 'md', 
  showName = false, 
  onClick, 
  className = '' 
}: UserAvatarProps) {
  // Get user initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Size classes for avatar
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  // Size classes for text
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const initials = getInitials(userInfo.name);
  const baseClasses = `
    ${sizeClasses[size]} 
    bg-gradient-to-br from-indigo-500 to-purple-600 
    text-white 
    rounded-full 
    flex 
    items-center 
    justify-center 
    font-medium 
    select-none
    ${onClick ? 'cursor-pointer hover:from-indigo-600 hover:to-purple-700 transition-all duration-200' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const handleClick = () => {
    onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  if (showName) {
    return (
      <div 
        className={`flex items-center space-x-3 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? `User menu for ${userInfo.name}` : `User ${userInfo.name}`}
      >
        <div className={baseClasses}>
          {initials}
        </div>
        <div className="flex flex-col">
          <span className={`font-medium text-gray-900 ${textSizeClasses[size]}`}>
            {userInfo.name}
          </span>
          {userInfo.email && (
            <span className="text-xs text-gray-500">
              {userInfo.email}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={baseClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `User menu for ${userInfo.name}` : `User ${userInfo.name}`}
      title={`${userInfo.name} (${userInfo.email})`}
    >
      {initials}
    </div>
  );
}