import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompactBookingListSkeleton from '../CompactBookingListSkeleton';

describe('CompactBookingListSkeleton', () => {
  it('renders skeleton container with correct styling', () => {
    const { container } = render(<CompactBookingListSkeleton />);
    
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass(
      'bg-white', 
      'rounded-2xl', 
      'shadow-xl', 
      'overflow-hidden', 
      'animate-pulse'
    );
  });

  it('renders header skeleton', () => {
    const { container } = render(<CompactBookingListSkeleton />);
    
    // Check for header skeleton element
    const headerSkeleton = container.querySelector('.p-4.border-b .w-32.h-6.bg-gray-200.rounded');
    expect(headerSkeleton).toBeInTheDocument();
  });

  it('renders correct number of booking item skeletons', () => {
    const { container } = render(<CompactBookingListSkeleton />);
    
    // Should render 8 skeleton booking items
    const bookingItems = container.querySelectorAll('.divide-y.divide-gray-100 > div');
    expect(bookingItems).toHaveLength(8);
  });

  it('renders booking item skeleton elements correctly', () => {
    const { container } = render(<CompactBookingListSkeleton />);
    
    const firstItem = container.querySelector('.divide-y.divide-gray-100 > div:first-child');
    
    // Check for status dot skeleton
    const statusDot = firstItem?.querySelector('.w-2.h-2.bg-gray-300.rounded-full');
    expect(statusDot).toBeInTheDocument();
    
    // Check for date skeleton
    const dateSkeleton = firstItem?.querySelector('.w-24.h-4.bg-gray-200.rounded');
    expect(dateSkeleton).toBeInTheDocument();
    
    // Check for statistics skeletons (persons, nights, accommodations)
    const statSkeletons = firstItem?.querySelectorAll('.flex.items-center .w-4.h-3.bg-gray-200.rounded, .w-6.h-3.bg-gray-200.rounded');
    expect(statSkeletons?.length).toBeGreaterThan(0);
  });

  it('has correct height constraints', () => {
    const { container } = render(<CompactBookingListSkeleton />);
    
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('max-h-[600px]', 'xl:max-h-[600px]', 'lg:max-h-[400px]');
  });
});