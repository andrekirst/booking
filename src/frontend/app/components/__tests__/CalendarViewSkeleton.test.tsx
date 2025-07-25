import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarViewSkeleton from '../CalendarViewSkeleton';

describe('CalendarViewSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<CalendarViewSkeleton />);
    
    // Check for skeleton container
    const skeletonContainer = container.firstChild;
    expect(skeletonContainer).toHaveClass('animate-pulse');
  });

  it('renders toolbar skeleton elements', () => {
    const { container } = render(<CalendarViewSkeleton />);
    
    // Check for navigation buttons (3 skeleton elements)
    const navButtons = container.querySelectorAll('.flex.items-center.space-x-2 > div');
    expect(navButtons).toHaveLength(3);
  });

  it('renders calendar grid skeleton', () => {
    const { container } = render(<CalendarViewSkeleton />);
    
    // Check for calendar header (7 columns)
    const headerCells = container.querySelectorAll('.grid.grid-cols-7:first-of-type > div');
    expect(headerCells).toHaveLength(7);
    
    // Check for calendar body (35 cells for 5 weeks)
    const bodyCells = container.querySelectorAll('.grid.grid-cols-7:last-of-type > div');
    expect(bodyCells).toHaveLength(35);
  });

  it('renders legend skeleton elements', () => {
    const { container } = render(<CalendarViewSkeleton />);
    
    // Check for legend items (4 status types)
    const legendItems = container.querySelectorAll('.flex.flex-wrap.gap-4 > div');
    expect(legendItems).toHaveLength(4);
  });

  it('has correct styling classes', () => {
    const { container } = render(<CalendarViewSkeleton />);
    
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('bg-white', 'rounded-2xl', 'shadow-xl', 'p-6', 'animate-pulse');
  });
});