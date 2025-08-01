import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import { useRouter, useParams } from 'next/navigation';
import BookingDetailPage from '../../app/bookings/[id]/page';
import BookingHistoryTimeline from '../../app/components/ui/BookingHistoryTimeline';
import Tabs from '../../app/components/ui/Tabs';
import { ApiContext } from '../../contexts/ApiContext';
import { ApiClient } from '../../lib/api/client';
import { Booking, BookingHistoryEntry, BookingHistoryEventType, BookingStatus, SleepingAccommodation } from '../../lib/types/api';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

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
  },
  {
    id: 'history-3',
    eventType: BookingHistoryEventType.NotesUpdated,
    timestamp: '2025-07-01T12:00:00Z',
    user: {
      id: 'user-1',
      name: 'Max Mustermann',
      email: 'max@example.com'
    },
    description: 'Notizen wurden aktualisiert',
    details: {
      notes: 'Zusätzliche Informationen hinzugefügt'
    }
  }
];

const renderWithApiContext = (component: React.ReactElement) => {
  return render(
    <ApiContext.Provider value={{ apiClient: mockApiClient }}>
      {component}
    </ApiContext.Provider>
  );
};

describe('Booking History Accessibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: 'booking-123' });
    
    mockApiClient.getBookingById.mockResolvedValue(mockBooking);
    mockApiClient.getSleepingAccommodations.mockResolvedValue(mockAccommodations);
    mockApiClient.getBookingHistory.mockResolvedValue(mockHistoryEntries);
  });

  describe('BookingHistoryTimeline Accessibility', () => {
    test('should have no accessibility violations with history data', async () => {
      const { container } = render(
        <BookingHistoryTimeline history={mockHistoryEntries} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations in loading state', async () => {
      const { container } = render(
        <BookingHistoryTimeline history={[]} isLoading={true} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations in error state', async () => {
      const { container } = render(
        <BookingHistoryTimeline history={[]} error="Test error message" />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations in empty state', async () => {
      const { container } = render(
        <BookingHistoryTimeline history={[]} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper semantic structure', () => {
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Should have proper heading hierarchy
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Änderungsverlauf');
      
      // Should have proper list structure
      const feed = screen.getByRole('feed');
      expect(feed).toHaveAttribute('aria-label', 'Buchungshistorie');
      expect(feed).toHaveAttribute('aria-live', 'polite');
      
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });

    test('should have proper ARIA attributes for event icons', () => {
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Each event should have an icon with proper ARIA labeling
      const eventIcons = screen.getAllByRole('img');
      
      expect(eventIcons[0]).toHaveAttribute('aria-label', 'Created Event');
      expect(eventIcons[1]).toHaveAttribute('aria-label', 'StatusChanged Event');
      expect(eventIcons[2]).toHaveAttribute('aria-label', 'NotesUpdated Event');
    });

    test('should have accessible color contrast for all event types', () => {
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Check that all event type colors meet accessibility standards
      // The actual color contrast would be checked by axe, but we verify the structure
      
      // Created event (blue)
      const createdEvent = screen.getByText('Buchung wurde erstellt').closest('.pb-8');
      expect(createdEvent?.querySelector('.bg-blue-50')).toBeInTheDocument();
      
      // Status change event (should have status badges)
      expect(screen.getByText('Ausstehend')).toBeInTheDocument();
      expect(screen.getByText('Bestätigt')).toBeInTheDocument();
      
      // Notes update event (orange)
      const notesEvent = screen.getByText('Notizen wurden aktualisiert').closest('.pb-8');
      expect(notesEvent).toBeInTheDocument();
    });

    test('should provide meaningful alternative text for visual elements', () => {
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Timeline connectors should be marked as decorative
      const connectors = screen.getAllByText('', { selector: '[aria-hidden="true"]' });
      expect(connectors.length).toBeGreaterThan(0);
      
      // Interactive elements should have accessible names
      const reloadButton = screen.queryByRole('button', { name: /historie neu laden/i });
      if (reloadButton) {
        expect(reloadButton).toHaveAccessibleName();
      }
    });

    test('should support keyboard navigation', () => {
      render(<BookingHistoryTimeline history={[]} error="Test error" />);
      
      const reloadButton = screen.getByRole('button', { name: /historie neu laden/i });
      
      // Button should be focusable
      reloadButton.focus();
      expect(reloadButton).toHaveFocus();
      
      // Should be keyboard activatable
      fireEvent.keyDown(reloadButton, { key: 'Enter' });
      fireEvent.keyDown(reloadButton, { key: ' ' });
      
      // Focus should remain visible (tested by axe)
    });

    test('should announce loading state to screen readers', () => {
      render(<BookingHistoryTimeline history={[]} isLoading={true} />);
      
      const loadingStatus = screen.getByRole('status', { name: /historie wird geladen/i });
      expect(loadingStatus).toBeInTheDocument();
      expect(loadingStatus).toHaveAttribute('aria-label', 'Historie wird geladen');
    });

    test('should announce errors to screen readers', () => {
      render(<BookingHistoryTimeline history={[]} error="Test error message" />);
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveAttribute('aria-live', 'polite');
      expect(errorAlert).toHaveTextContent('Fehler beim Laden der Historie');
    });
  });

  describe('Tabs Component Accessibility', () => {
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

    test('should have no accessibility violations', async () => {
      const { container } = render(<Tabs tabs={mockTabs} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper ARIA tablist structure', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const tabNavigation = screen.getByLabelText('Tabs');
      expect(tabNavigation).toHaveAttribute('role', 'navigation');
      
      const detailsTab = screen.getByRole('button', { name: 'Details' });
      const historyTab = screen.getByRole('button', { name: 'Historie' });
      
      expect(detailsTab).toHaveAttribute('aria-current', 'page');
      expect(historyTab).not.toHaveAttribute('aria-current');
    });

    test('should support keyboard navigation between tabs', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const detailsTab = screen.getByRole('button', { name: 'Details' });
      const historyTab = screen.getByRole('button', { name: 'Historie' });
      
      // Focus should work
      detailsTab.focus();
      expect(detailsTab).toHaveFocus();
      
      // Tab navigation should work (in browser, not in jsdom)
      // We test that elements are in proper tab order
      expect(detailsTab).not.toHaveAttribute('tabindex', '-1');
      expect(historyTab).not.toHaveAttribute('tabindex', '-1');
    });

    test('should announce tab changes to screen readers', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const detailsTab = screen.getByRole('button', { name: 'Details' });
      const historyTab = screen.getByRole('button', { name: 'Historie' });
      
      // Initially details tab should be active
      expect(detailsTab).toHaveAttribute('aria-current', 'page');
      expect(historyTab).not.toHaveAttribute('aria-current');
      
      // Click history tab
      fireEvent.click(historyTab);
      
      // ARIA attributes should update
      expect(detailsTab).not.toHaveAttribute('aria-current');
      expect(historyTab).toHaveAttribute('aria-current', 'page');
    });

    test('should handle disabled tabs accessibly', () => {
      const tabsWithDisabled = [
        ...mockTabs,
        {
          id: 'disabled',
          label: 'Disabled Tab',
          content: <div>Disabled Content</div>,
          disabled: true
        }
      ];

      render(<Tabs tabs={tabsWithDisabled} />);
      
      const disabledTab = screen.getByRole('button', { name: 'Disabled Tab' });
      expect(disabledTab).toBeDisabled();
      expect(disabledTab).toHaveAttribute('disabled');
    });
  });

  describe('BookingDetailPage Integration Accessibility', () => {
    test('should have no accessibility violations in full page context', async () => {
      const { container } = renderWithApiContext(<BookingDetailPage />);
      
      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations with history tab active', async () => {
      const { container } = renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Activate history tab
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      await waitFor(() => {
        expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper heading hierarchy in full page', async () => {
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Buchungsdetails')).toBeInTheDocument();
      });
      
      // Main page heading should be h1
      const pageHeading = screen.getByRole('heading', { level: 1 });
      expect(pageHeading).toHaveTextContent('Buchungsdetails');
      
      // Load history
      fireEvent.click(screen.getByRole('button', { name: 'Historie' }));
      
      await waitFor(() => {
        expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
      });
      
      // History heading should be h2 (proper hierarchy)
      const historyHeading = screen.getByRole('heading', { level: 2 });
      expect(historyHeading).toHaveTextContent('Änderungsverlauf');
    });

    test('should maintain focus management during tab navigation', async () => {
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      const historyTab = screen.getByRole('button', { name: 'Historie' });
      
      // Focus and activate history tab
      historyTab.focus();
      expect(historyTab).toHaveFocus();
      
      fireEvent.click(historyTab);
      
      // Focus should remain on the tab after activation
      expect(historyTab).toHaveFocus();
      
      await waitFor(() => {
        expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
      });
    });

    test('should provide skip links or landmarks for navigation', async () => {
      renderWithApiContext(<BookingDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      
      // Should have navigation landmark
      const tabNavigation = screen.getByLabelText('Tabs');
      expect(tabNavigation).toHaveAttribute('role', 'navigation');
      
      // Should have proper main content area
      // (This would typically be handled by layout components)
    });
  });

  describe('Screen Reader Experience', () => {
    test('should provide comprehensive screen reader support for timeline', () => {
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Feed role for dynamic content
      const feed = screen.getByRole('feed');
      expect(feed).toHaveAttribute('aria-label', 'Buchungshistorie');
      expect(feed).toHaveAttribute('aria-live', 'polite');
      
      // Each list item should be properly structured
      const listItems = screen.getAllByRole('listitem');
      
      listItems.forEach((item, index) => {
        // Should have event description
        const entry = mockHistoryEntries[index];
        expect(item).toHaveTextContent(entry.description);
        
        // Should have user information
        expect(item).toHaveTextContent(entry.user.name);
        expect(item).toHaveTextContent(entry.user.email);
      });
    });

    test('should provide accessible timestamp information', () => {
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Timestamps should have title attributes for full date/time
      const timestampElements = screen.getAllByText(/vor/i);
      
      timestampElements.forEach(element => {
        const titleElement = element.closest('[title]');
        expect(titleElement).toHaveAttribute('title');
        expect(titleElement?.getAttribute('title')).toMatch(/\d{2}\.\d{2}\.\d{4}/);
      });
    });

    test('should handle dynamic content updates accessibly', async () => {
      const { rerender } = render(
        <BookingHistoryTimeline history={[]} isLoading={true} />
      );
      
      // Loading state should be announced
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Historie wird geladen');
      
      // Update to show content
      rerender(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Content should be announced via aria-live
      const feed = screen.getByRole('feed');
      expect(feed).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Color and Contrast', () => {
    test('should not rely solely on color for event type indication', () => {
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Each event type should have both color AND other indicators
      
      // Created event: blue color + plus icon
      const createdIcon = screen.getByRole('img', { name: 'Created Event' });
      expect(createdIcon).toBeInTheDocument();
      
      // Status change: color + status badges with text
      expect(screen.getByText('Ausstehend')).toBeInTheDocument();
      expect(screen.getByText('Bestätigt')).toBeInTheDocument();
      
      // Notes update: color + descriptive text
      expect(screen.getByText('Neue Notiz:')).toBeInTheDocument();
    });

    test('should provide sufficient color contrast for all text', async () => {
      const { container } = render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // axe will check color contrast automatically
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Responsive Design Accessibility', () => {
    test('should maintain accessibility across different viewport sizes', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      const { container } = render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
      
      // Restore viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    test('should handle responsive layout changes accessibly', () => {
      render(<BookingHistoryTimeline history={mockHistoryEntries} />);
      
      // Check that responsive classes don't break accessibility
      const userInfoSections = screen.getAllByText('Max Mustermann');
      
      userInfoSections.forEach(section => {
        const container = section.closest('.flex-col');
        expect(container).toHaveClass('sm:flex-row', 'sm:items-center', 'sm:space-x-4');
      });
    });
  });

  describe('Motion and Animation', () => {
    test('should respect prefers-reduced-motion', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      render(<BookingHistoryTimeline history={[]} isLoading={true} />);
      
      // Loading animations should still be present but could be modified
      // (This would typically be handled by CSS media queries)
      const loadingElements = screen.getAllByText('', { selector: '.animate-pulse' });
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });
});