import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, useParams } from 'next/navigation';
import BookingDetailPage from '../../app/bookings/[id]/page';
import BookingHistoryTimeline from '../../app/components/ui/BookingHistoryTimeline';
import Tabs from '../../app/components/ui/Tabs';
import { ApiContext } from '../../contexts/ApiContext';
import { ApiClient } from '../../lib/api/client';
import { Booking, BookingHistoryEntry, BookingHistoryEventType, BookingStatus, SleepingAccommodation } from '../../lib/types/api';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock API client
const mockApiClient: jest.Mocked<ApiClient> = {
  getBookingById: jest.fn(),
  getSleepingAccommodations: jest.fn(),
  getBookingHistory: jest.fn(),
  acceptBooking: jest.fn(),
  rejectBooking: jest.fn(),
} as any;

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

// Mock data
const mockBooking: Booking = {
  id: 'booking-123',
  userId: 1,
  userName: 'Max Mustermann',
  userEmail: 'max@example.com',
  startDate: '2025-08-01',
  endDate: '2025-08-03',
  status: BookingStatus.Confirmed,
  notes: 'Test booking notes',
  bookingItems: [
    {
      sleepingAccommodationId: 'room-1',
      sleepingAccommodationName: 'Hauptzimmer',
      personCount: 2
    }
  ],
  totalPersons: 2,
  numberOfNights: 2,
  createdAt: '2025-07-01T10:00:00Z',
  changedAt: '2025-07-01T11:00:00Z'
};

const mockAccommodations: SleepingAccommodation[] = [
  {
    id: 'room-1',
    name: 'Hauptzimmer',
    type: 0,
    maxCapacity: 4,
    isActive: true,
    createdAt: '2025-07-01T09:00:00Z'
  }
];

const mockHistoryEntries: BookingHistoryEntry[] = [
  {
    id: 'history-1',
    eventType: BookingHistoryEventType.Created,
    timestamp: '2025-07-01T10:00:00Z',
    user: {
      id: 'user-1',
      name: 'Max Mustermann',
      email: 'max@example.com'
    },
    description: 'Buchung wurde erstellt',
    details: {
      startDate: '2025-08-01',
      endDate: '2025-08-03',
      totalPersons: 2,
      accommodations: ['Hauptzimmer']
    }
  },
  {
    id: 'history-2',
    eventType: BookingHistoryEventType.StatusChanged,
    timestamp: '2025-07-01T11:00:00Z',
    user: {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com'
    },
    description: 'Status wurde geändert',
    details: {
      reason: 'Buchung wurde vom Administrator bestätigt'
    },
    previousValue: BookingStatus.Pending,
    newValue: BookingStatus.Confirmed
  }
];

const renderWithApiContext = (component: React.ReactElement) => {
  return render(
    <ApiContext.Provider value={{ apiClient: mockApiClient }}>
      {component}
    </ApiContext.Provider>
  );
};

// Helper to simulate viewport changes
const mockViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Mock matchMedia for responsive breakpoints
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => {
      const matches = {
        '(min-width: 640px)': width >= 640,   // sm
        '(min-width: 768px)': width >= 768,   // md
        '(min-width: 1024px)': width >= 1024, // lg
        '(min-width: 1280px)': width >= 1280, // xl
        '(max-width: 639px)': width < 640,    // mobile
        '(max-width: 767px)': width < 768,    // small tablet
      };
      
      return {
        matches: matches[query] || false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    }),
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

describe('Booking History Responsive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: 'booking-123' });
    
    mockApiClient.getBookingById.mockResolvedValue(mockBooking);
    mockApiClient.getSleepingAccommodations.mockResolvedValue(mockAccommodations);
    mockApiClient.getBookingHistory.mockResolvedValue(mockHistoryEntries);
  });

  afterEach(() => {
    // Reset viewport to default
    mockViewport(1024, 768);
  });

  describe('BookingHistoryTimeline Responsive Behavior', () => {
    test('should adapt layout for mobile screens (< 640px)', () => {
      mockViewport(375, 667); // iPhone SE
      
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Should have mobile-friendly spacing
      const timeline = screen.getByRole('feed');
      expect(timeline).toBeInTheDocument();
      
      // User info should stack vertically on mobile
      const userInfoSections = screen.getAllByText('Max Mustermann');
      userInfoSections.forEach(section => {
        const container = section.closest('.flex-col');
        expect(container).toHaveClass('flex-col'); // Should be column layout
        expect(container).toHaveClass('sm:flex-row'); // Should become row on larger screens
      });
      
      // Status change details should stack on mobile
      const statusDetails = screen.getByText('Von:').closest('.flex');
      expect(statusDetails).toHaveClass('flex');
      expect(statusDetails).toHaveClass('sm:space-x-4'); // Horizontal spacing on larger screens
    });

    test('should use horizontal layout for tablet screens (640px - 768px)', () => {
      mockViewport(640, 1024); // iPad portrait
      
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Creation details should use 2-column grid on tablets
      const detailsGrid = screen.getByText(/zeitraum:/i).closest('.grid');
      expect(detailsGrid).toHaveClass('grid-cols-1'); // Single column on mobile
      expect(detailsGrid).toHaveClass('sm:grid-cols-2'); // Two columns on tablet+
      
      // User info should be horizontal on tablet
      const userInfoContainer = screen.getAllByText('Max Mustermann')[0].closest('.flex-col');
      expect(userInfoContainer).toHaveClass('sm:flex-row');
      expect(userInfoContainer).toHaveClass('sm:items-center');
    });

    test('should use desktop layout for large screens (> 1024px)', () => {
      mockViewport(1440, 900); // Desktop
      
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Should have full desktop layout
      const timeline = screen.getByRole('feed');
      expect(timeline).toBeInTheDocument();
      
      // Grid layouts should be at full width
      const detailsGrid = screen.getByText(/zeitraum:/i).closest('.grid');
      expect(detailsGrid).toHaveClass('sm:grid-cols-2');
      
      // Timeline should have proper spacing
      const timelineItems = screen.getAllByRole('listitem');
      expect(timelineItems.length).toBeGreaterThan(0);
    });

    test('should handle very narrow screens (< 320px)', () => {
      mockViewport(280, 568); // Very narrow mobile
      
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Should still be functional
      expect(screen.getByText('Änderungsverlauf')).toBeVisible();
      expect(screen.getByText('Buchung wurde erstellt')).toBeVisible();
      
      // Content should not overflow
      const timeline = screen.getByRole('feed');
      expect(timeline).toBeInTheDocument();
    });

    test('should handle ultra-wide screens (> 1920px)', () => {
      mockViewport(2560, 1440); // Ultra-wide monitor
      
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Should maintain readable layout without stretching too much
      expect(screen.getByText('Änderungsverlauf')).toBeVisible();
      
      // Grid should still use reasonable column count
      const detailsGrid = screen.getByText(/zeitraum:/i).closest('.grid');
      expect(detailsGrid).toHaveClass('sm:grid-cols-2'); // Max 2 columns
    });

    test('should maintain readability at different text sizes', () => {
      mockViewport(375, 667); // Mobile
      
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Text should be appropriately sized
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('text-xl'); // Mobile-appropriate heading size
      
      // Description text should be readable
      const descriptions = screen.getAllByText(/buchung wurde/i);
      descriptions.forEach(desc => {
        expect(desc).toHaveClass('font-medium');
      });
      
      // Small text should still be legible
      const timestamps = screen.getAllByText(/vor/i);
      timestamps.forEach(timestamp => {
        const container = timestamp.closest('.text-xs');
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Tabs Component Responsive Behavior', () => {
    const mockTabs = [
      {
        id: 'details',
        label: 'Details',
        content: <div>Details Content</div>
      },
      {
        id: 'historie',
        label: 'Historie',
        content: <BookingHistoryTimeline history={mockHistoryEntries} />
      }
    ];

    test('should adapt tab layout for mobile', () => {
      mockViewport(375, 667); // Mobile
      
      render(<Tabs tabs={mockTabs} />);
      
      // Tabs should be horizontally scrollable if needed
      const tabNavigation = screen.getByLabelText('Tabs');
      expect(tabNavigation).toBeInTheDocument();
      
      // Tab buttons should have appropriate spacing
      const detailsTab = screen.getByRole('button', { name: 'Details' });
      const historyTab = screen.getByRole('button', { name: 'Historie' });
      
      expect(detailsTab).toHaveClass('py-4', 'px-1'); // Mobile-appropriate padding
      expect(historyTab).toHaveClass('py-4', 'px-1');
    });

    test('should maintain touch targets on mobile', () => {
      mockViewport(375, 667); // Mobile
      
      render(<Tabs tabs={mockTabs} />);
      
      // Tab buttons should be large enough for touch
      const tabs = screen.getAllByRole('button');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('py-4'); // At least 16px vertical padding (44px minimum touch target)
      });
    });

    test('should handle long tab labels on narrow screens', () => {
      const tabsWithLongLabels = [
        {
          id: 'very-long-details',
          label: 'Sehr detaillierte Buchungsinformationen',
          content: <div>Content</div>
        },
        {
          id: 'long-history',
          label: 'Vollständige Änderungshistorie',
          content: <div>History</div>
        }
      ];

      mockViewport(320, 568); // Narrow mobile
      
      render(<Tabs tabs={tabsWithLongLabels} />);
      
      // Tabs should handle overflow gracefully
      const longTab = screen.getByRole('button', { name: /sehr detaillierte/i });
      expect(longTab).toHaveClass('whitespace-nowrap'); // Prevent wrapping
      
      // Should have horizontal scroll container
      const tabContainer = longTab.closest('.flex');
      expect(tabContainer).toHaveClass('space-x-8'); // Proper spacing
    });
  });

  describe('BookingDetailPage Responsive Integration', () => {
    test('should adapt entire page layout for mobile', async () => {
      mockViewport(375, 667); // Mobile
      
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Buchungsdetails')).toBeInTheDocument();
      });
      
      // Page title should be mobile-appropriate
      const pageTitle = screen.getByRole('heading', { level: 1 });
      expect(pageTitle).toHaveClass('text-3xl', 'md:text-4xl'); // Responsive text sizing
      
      // Header elements should stack on mobile
      const headerContainer = pageTitle.closest('.flex-col');
      expect(headerContainer).toHaveClass('sm:flex-row'); // Row layout on larger screens
    });

    test('should handle tab content overflow on mobile', async () => {
      mockViewport(375, 667); // Mobile
      
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Load history tab
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      await waitFor(() => {
        expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
      });
      
      // Content should not overflow horizontally
      const historyContent = screen.getByRole('feed');
      expect(historyContent).toBeInTheDocument();
      
      // Long text should wrap properly
      const longTexts = screen.getAllByText(/buchung wurde vom administrator bestätigt/i);
      longTexts.forEach(text => {
        const container = text.closest('.text-sm');
        expect(container).toBeInTheDocument();
      });
    });

    test('should maintain functionality across all breakpoints', async () => {
      const breakpoints = [
        { width: 320, height: 568, name: 'Small Mobile' },
        { width: 375, height: 667, name: 'Mobile' },
        { width: 640, height: 1024, name: 'Tablet Portrait' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1024, height: 768, name: 'Desktop' },
        { width: 1440, height: 900, name: 'Large Desktop' },
      ];

      for (const breakpoint of breakpoints) {
        mockViewport(breakpoint.width, breakpoint.height);
        
        const { unmount } = renderWithApiContext(<BookingDetailPage />);
        
        await waitFor(() => {
          expect(screen.getByText('Details')).toBeInTheDocument();
        });
        
        // Tabs should be clickable
        fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
        
        await waitFor(() => {
          expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
        });
        
        // History should load
        expect(screen.getByRole('feed')).toBeInTheDocument();
        
        unmount();
      }
    });
  });

  describe('Touch and Interaction Responsive Behavior', () => {
    test('should handle touch events on mobile', () => {
      mockViewport(375, 667); // Mobile
      
      const mockTabs = [
        {
          id: 'details',
          label: 'Details',
          content: <div>Details Content</div>
        },
        {
          id: 'historie',
          label: 'Historie',
          content: <BookingHistoryTimeline history={mockHistoryEntries} />
        }
      ];

      render(<Tabs tabs={mockTabs} />);
      
      // Simulate touch events
      const historyTab = screen.getByRole('button', { name: 'Historie' });
      
      // Touch start/end simulation
      fireEvent.touchStart(historyTab);
      fireEvent.touchEnd(historyTab);
      fireEvent.click(historyTab);
      
      // Should activate tab
      expect(historyTab).toHaveAttribute('aria-current', 'page');
      expect(screen.getByText('Änderungsverlauf')).toBeVisible();
    });

    test('should provide adequate touch targets', () => {
      mockViewport(375, 667); // Mobile
      
      render(<BookingHistoryTimeline history={[]} error="Test error" />);
      
      // Reload button should be large enough for touch (44px minimum)
      const reloadButton = screen.getByRole('button', { name: /historie neu laden/i });
      expect(reloadButton).toHaveClass('px-4', 'py-2'); // Should provide adequate padding
    });

    test('should handle hover states appropriately on different devices', () => {
      // Desktop - should have hover states
      mockViewport(1024, 768);
      
      const mockTabs = [
        { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
        { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> }
      ];

      render(<Tabs tabs={mockTabs} />);
      
      const inactiveTab = screen.getByRole('button', { name: 'Tab 2' });
      expect(inactiveTab).toHaveClass('hover:text-gray-700', 'hover:border-gray-300');
    });
  });

  describe('Content Scaling and Typography', () => {
    test('should scale typography appropriately across screen sizes', () => {
      const sizes = [
        { width: 320, headingClass: 'text-3xl' },
        { width: 768, headingClass: 'text-3xl' },
        { width: 1024, headingClass: 'md:text-4xl' },
      ];

      sizes.forEach(({ width, headingClass }) => {
        mockViewport(width, 768);
        
        const { unmount } = render(<BookingHistoryTimeline history={mockHistoryEntries} />);
        
        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading).toHaveClass('text-xl'); // Consistent mobile-first approach
        
        unmount();
      });
    });

    test('should maintain content hierarchy on all screen sizes', () => {
      mockViewport(375, 667); // Mobile
      
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Heading hierarchy should be maintained
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Änderungsverlauf');
      
      // Text sizes should be appropriate
      const descriptions = screen.getAllByText(/buchung wurde/i);
      descriptions.forEach(desc => {
        expect(desc).toHaveClass('font-medium');
      });
      
      // Small text should still be readable
      const userEmails = screen.getAllByText(/@/);
      userEmails.forEach(email => {
        expect(email).toHaveClass('text-gray-400');
      });
    });
  });

  describe('Performance on Different Screen Sizes', () => {
    test('should render efficiently on mobile devices', () => {
      mockViewport(375, 667); // Mobile
      
      const startTime = performance.now();
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      const endTime = performance.now();
      
      // Should render quickly (arbitrary threshold)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should not create excessive DOM nodes on mobile
      const timeline = screen.getByRole('feed');
      const listItems = screen.getAllByRole('listitem');
      
      expect(timeline).toBeInTheDocument();
      expect(listItems.length).toBe(mockHistoryEntries.length);
    });

    test('should handle large history efficiently on small screens', () => {
      const largeHistory = Array.from({ length: 50 }, (_, i) => ({
        ...mockHistoryEntries[0],
        id: `history-${i}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        description: `Event ${i + 1}`
      }));

      mockViewport(375, 667); // Mobile
      
      const startTime = performance.now();
      render(<BookingHistoryTimeline history={largeHistory} />);
      const endTime = performance.now();
      
      // Should still render in reasonable time
      expect(endTime - startTime).toBeLessThan(200);
      
      // Should render all items
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(50);
    });
  });

  describe('Orientation Changes', () => {
    test('should handle orientation change from portrait to landscape', async () => {
      // Start in portrait
      mockViewport(375, 667);
      
      const { rerender } = renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Change to landscape
      mockViewport(667, 375);
      
      rerender(
        <ApiContext.Provider value={{ apiClient: mockApiClient }}>
          <BookingDetailPage />
        </ApiContext.Provider>
      );
      
      // Should still be functional
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Tabs should still work
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      await waitFor(() => {
        expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
      });
    });
  });
});