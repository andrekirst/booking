import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookingCardSkeleton from '../BookingCardSkeleton';

describe('BookingCardSkeleton', () => {
  it('renders skeleton container with correct styling', () => {
    const { container } = render(<BookingCardSkeleton />);
    
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass(
      'bg-white', 
      'rounded-2xl', 
      'shadow-xl', 
      'overflow-hidden', 
      'animate-pulse'
    );
  });

  it('renders header skeleton elements', () => {
    const { container } = render(<BookingCardSkeleton />);
    
    // Check for date skeleton (48 width)
    const dateSkeleton = container.querySelector('.w-48.h-6.bg-gray-200.rounded');
    expect(dateSkeleton).toBeInTheDocument();
    
    // Check for status badge skeleton (20 width)
    const statusSkeleton = container.querySelector('.w-20.h-6.bg-gray-200.rounded-full');
    expect(statusSkeleton).toBeInTheDocument();
  });

  it('renders details grid skeleton', () => {
    const { container } = render(<BookingCardSkeleton />);
    
    // Should have 3 detail items in grid
    const detailItems = container.querySelectorAll('.grid.grid-cols-3.gap-4 > div');
    expect(detailItems).toHaveLength(3);
    
    // Each detail item should have icon and text skeleton
    detailItems.forEach(item => {
      expect(item.querySelector('.w-4.h-4.bg-gray-200.rounded')).toBeInTheDocument();
      expect(item.querySelector('.w-16.h-4.bg-gray-200.rounded')).toBeInTheDocument();
    });
  });

  it('renders action footer skeleton', () => {
    const { container } = render(<BookingCardSkeleton />);
    
    const footer = container.querySelector('.bg-gray-50.px-6.py-3');
    expect(footer).toBeInTheDocument();
    
    // Check for text skeleton in footer
    const textSkeleton = footer?.querySelector('.w-24.h-4.bg-gray-200.rounded');
    expect(textSkeleton).toBeInTheDocument();
    
    // Check for arrow skeleton
    const arrowSkeleton = footer?.querySelector('.w-4.h-4.bg-gray-200.rounded');
    expect(arrowSkeleton).toBeInTheDocument();
  });

  it('has proper card structure', () => {
    const { container } = render(<BookingCardSkeleton />);
    
    // Main content area
    const contentArea = container.querySelector('.p-6');
    expect(contentArea).toBeInTheDocument();
    
    // Footer area
    const footerArea = container.querySelector('.bg-gray-50.px-6.py-3');
    expect(footerArea).toBeInTheDocument();
  });
});