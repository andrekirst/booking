'use client';

import { usePathname } from 'next/navigation';
import { GlobalHeader } from './GlobalHeader';

/**
 * Conditional header that shows ThemeToggle for non-authenticated pages
 */
export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Define pages where ThemeToggle should be shown in the header
  // (for non-authenticated users)
  const publicPages = ['/', '/login', '/register', '/verify-email'];
  const isPublicPage = publicPages.includes(pathname);
  
  return <GlobalHeader showThemeToggle={isPublicPage} />;
}