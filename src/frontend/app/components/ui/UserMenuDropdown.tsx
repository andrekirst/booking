'use client';

import { useState, useRef, useEffect } from 'react';
import { UserMenuDropdownProps, UserMenuItem } from '@/lib/types/auth';
import { UserAvatar } from './UserAvatar';

/**
 * User menu dropdown component with profile, admin, and logout options
 */
export function UserMenuDropdown({
  userInfo,
  onLogout,
  onProfileClick,
  onAdminClick,
  customItems = [],
  position = 'bottom-right'
}: UserMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen]);

  // Position classes for dropdown
  const positionClasses = {
    'bottom-right': 'right-0 top-full',
    'bottom-left': 'left-0 top-full'
  };

  // Default menu items
  const defaultItems: UserMenuItem[] = [
    {
      label: 'Profil',
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => {
        setIsOpen(false);
        onProfileClick?.();
      },
      show: true
    },
    {
      label: 'Administration',
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      onClick: () => {
        setIsOpen(false);
        onAdminClick?.();
      },
      show: userInfo.isAdmin,
      showSeparator: true
    },
    {
      label: 'Abmelden',
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      onClick: () => {
        setIsOpen(false);
        onLogout();
      },
      show: true,
      variant: 'danger'
    }
  ];

  // Combine default and custom items
  const allItems = [...customItems, ...defaultItems];
  const visibleItems = allItems.filter(item => item.show !== false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleDropdown();
    }
  };

  return (
    <div className="relative">
      {/* Dropdown Toggle Button */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        className="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`User menu for ${userInfo.name}`}
      >
        <UserAvatar 
          userInfo={userInfo} 
          size="md" 
          onClick={toggleDropdown}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`
            absolute z-50 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2
            ${positionClasses[position]}
            animate-in fade-in-0 zoom-in-95 duration-100
          `}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <UserAvatar userInfo={userInfo} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userInfo.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userInfo.email}
                </p>
                <p className="text-xs text-gray-400">
                  {userInfo.role}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {visibleItems.map((item, index) => {
              const IconComponent = item.icon;
              const isLastItem = index === visibleItems.length - 1;
              
              return (
                <div key={`${item.label}-${index}`}>
                  <button
                    onClick={item.onClick}
                    className={`
                      w-full text-left px-4 py-2 text-sm flex items-center space-x-3
                      transition-colors duration-150
                      ${item.variant === 'danger' 
                        ? 'text-red-700 hover:bg-red-50 hover:text-red-900' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                      focus:outline-none focus:bg-gray-100 focus:text-gray-900
                    `}
                    role="menuitem"
                  >
                    {typeof IconComponent === 'function' ? (
                      <IconComponent className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <span className="w-4 h-4 flex-shrink-0">{IconComponent}</span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </button>
                  
                  {/* Separator */}
                  {item.showSeparator && !isLastItem && (
                    <div className="border-t border-gray-100 my-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}