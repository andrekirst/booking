import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import BookingHistoryTimeline from '../BookingHistoryTimeline';
import { BookingHistoryEntry, BookingHistoryEventType, BookingStatus } from '../../../../lib/types/api';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('BookingHistoryTimeline', () => {
  const mockHistoryEntry: BookingHistoryEntry = {
    id: '1',
    eventType: BookingHistoryEventType.Created,
    timestamp: '2025-08-01T10:00:00Z',
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
      accommodations: ['Hauptzimmer', 'Gästezimmer']
    }
  };

  const mockStatusChangeEntry: BookingHistoryEntry = {
    id: '2',
    eventType: BookingHistoryEventType.StatusChanged,
    timestamp: '2025-08-01T11:00:00Z',
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
  };

  const mockNotesUpdateEntry: BookingHistoryEntry = {
    id: '3',
    eventType: BookingHistoryEventType.NotesUpdated,
    timestamp: '2025-08-01T12:00:00Z',
    user: {
      id: 'user-1',
      name: 'Max Mustermann',
      email: 'max@example.com'
    },
    description: 'Notizen wurden aktualisiert',
    details: {
      notes: 'Bitte Handtücher bereitstellen'
    }
  };

  const mockCancelledEntry: BookingHistoryEntry = {
    id: '4',
    eventType: BookingHistoryEventType.Cancelled,
    timestamp: '2025-08-01T13:00:00Z',
    user: {
      id: 'user-1',
      name: 'Max Mustermann',
      email: 'max@example.com'
    },
    description: 'Buchung wurde storniert',
    details: {
      reason: 'Terminkonflikt'
    }
  };

  describe('Rendering States', () => {
    test('should render loading state correctly', () => {
      render(<BookingHistoryTimeline history={[]} isLoading={true} />);
      
      expect(screen.getByRole('status', { name: /historie wird geladen/i })).toBeInTheDocument();
      
      // Should render 3 skeleton items
      const skeletonItems = screen.getAllByText('', { selector: '.animate-pulse' });
      expect(skeletonItems.length).toBeGreaterThan(0);
    });

    test('should render error state correctly', () => {
      const errorMessage = 'Fehler beim Laden der Historie';
      render(<BookingHistoryTimeline history={[]} error={errorMessage} />);
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveAttribute('aria-live', 'polite');
      
      expect(screen.getByText('Fehler beim Laden der Historie')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      
      const reloadButton = screen.getByRole('button', { name: /historie neu laden/i });
      expect(reloadButton).toBeInTheDocument();
    });

    test('should render empty state correctly', () => {
      render(<BookingHistoryTimeline history={[]} />);
      
      expect(screen.getByText('Keine Historie verfügbar')).toBeInTheDocument();
      expect(screen.getByText(/für diese buchung wurden noch keine änderungen aufgezeichnet/i)).toBeInTheDocument();
    });

    test('should render history timeline correctly', () => {
      render(<BookingHistoryTimeline history={[mockHistoryEntry]} />);
      
      const feed = screen.getByRole('feed', { name: /buchungshistorie/i });
      expect(feed).toBeInTheDocument();
      expect(feed).toHaveAttribute('aria-live', 'polite');
      
      expect(screen.getByText('Änderungsverlauf')).toBeInTheDocument();
      expect(screen.getByText(/chronologische auflistung aller änderungen/i)).toBeInTheDocument();
    });
  });

  describe('Event Types and Icons', () => {
    test('should render Created event with correct icon and styling', () => {
      render(<BookingHistoryTimeline history={[mockHistoryEntry]} />);
      
      expect(screen.getByText('Buchung wurde erstellt')).toBeInTheDocument();
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
      expect(screen.getByText('max@example.com')).toBeInTheDocument();
      
      // Check for blue styling (Created events)
      const eventDetails = screen.getByText(/zeitraum:/i).closest('.bg-blue-50');
      expect(eventDetails).toBeInTheDocument();
    });

    test('should render StatusChanged event with status transition details', () => {
      render(<BookingHistoryTimeline history={[mockStatusChangeEntry]} />);
      
      expect(screen.getByText('Status wurde geändert')).toBeInTheDocument();
      expect(screen.getByText('Von:')).toBeInTheDocument();
      expect(screen.getByText('Ausstehend')).toBeInTheDocument();
      expect(screen.getByText('Zu:')).toBeInTheDocument();
      expect(screen.getByText('Bestätigt')).toBeInTheDocument();
      expect(screen.getByText('Grund:')).toBeInTheDocument();
      expect(screen.getByText('Buchung wurde vom Administrator bestätigt')).toBeInTheDocument();
    });

    test('should render NotesUpdated event with notes details', () => {
      render(<BookingHistoryTimeline history={[mockNotesUpdateEntry]} />);
      
      expect(screen.getByText('Notizen wurden aktualisiert')).toBeInTheDocument();
      expect(screen.getByText('Neue Notiz:')).toBeInTheDocument();
      expect(screen.getByText('"Bitte Handtücher bereitstellen"')).toBeInTheDocument();
      
      // Check for orange styling (Update events)
      const eventDetails = screen.getByText(/neue notiz:/i).closest('.bg-orange-50');
      expect(eventDetails).toBeInTheDocument();
    });

    test('should render Cancelled event with correct styling', () => {
      render(<BookingHistoryTimeline history={[mockCancelledEntry]} />);
      
      expect(screen.getByText('Buchung wurde storniert')).toBeInTheDocument();
      expect(screen.getByText('Details:')).toBeInTheDocument();
      expect(screen.getByText('Terminkonflikt')).toBeInTheDocument();
    });

    test('should render all event types with appropriate icons', () => {
      const allEventTypes: BookingHistoryEntry[] = [
        { ...mockHistoryEntry, eventType: BookingHistoryEventType.Created },
        { ...mockHistoryEntry, id: '2', eventType: BookingHistoryEventType.Confirmed },
        { ...mockHistoryEntry, id: '3', eventType: BookingHistoryEventType.Accepted },
        { ...mockHistoryEntry, id: '4', eventType: BookingHistoryEventType.Cancelled },
        { ...mockHistoryEntry, id: '5', eventType: BookingHistoryEventType.Rejected },
        { ...mockHistoryEntry, id: '6', eventType: BookingHistoryEventType.Updated },
        { ...mockHistoryEntry, id: '7', eventType: BookingHistoryEventType.NotesUpdated },
        { ...mockHistoryEntry, id: '8', eventType: BookingHistoryEventType.AccommodationsChanged },
        { ...mockHistoryEntry, id: '9', eventType: BookingHistoryEventType.DatesChanged }
      ];

      render(<BookingHistoryTimeline history={allEventTypes} />);
      
      // Should render all events
      allEventTypes.forEach(entry => {
        const eventIcon = screen.getByRole('img', { name: `${entry.eventType} Event` });
        expect(eventIcon).toBeInTheDocument();
      });
    });
  });

  describe('Timestamp Formatting', () => {
    test('should format recent timestamps correctly', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const recentEntry = {
        ...mockHistoryEntry,
        timestamp: fiveMinutesAgo.toISOString()
      };

      render(<BookingHistoryTimeline history={[recentEntry]} />);
      
      expect(screen.getByText(/vor 5 minuten/i)).toBeInTheDocument();
    });

    test('should format hour-old timestamps correctly', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const hourEntry = {
        ...mockHistoryEntry,
        timestamp: twoHoursAgo.toISOString()
      };

      render(<BookingHistoryTimeline history={[hourEntry]} />);
      
      expect(screen.getByText(/vor 2 stunden/i)).toBeInTheDocument();
    });

    test('should format day-old timestamps correctly', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const dayEntry = {
        ...mockHistoryEntry,
        timestamp: threeDaysAgo.toISOString()
      };

      render(<BookingHistoryTimeline history={[dayEntry]} />);
      
      expect(screen.getByText(/vor 3 tagen/i)).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    test('should reload page when reload button is clicked in error state', () => {
      // Mock window.location.reload
      const originalReload = window.location.reload;
      window.location.reload = jest.fn();

      render(<BookingHistoryTimeline history={[]} error="Test error" />);
      
      const reloadButton = screen.getByRole('button', { name: /historie neu laden/i });
      fireEvent.click(reloadButton);
      
      expect(window.location.reload).toHaveBeenCalled();
      
      // Restore original method
      window.location.reload = originalReload;
    });

    test('should show tooltip with full timestamp on hover', () => {
      render(<BookingHistoryTimeline history={[mockHistoryEntry]} />);
      
      const timestampElement = screen.getByText(/vor/i);
      expect(timestampElement.closest('[title]')).toHaveAttribute('title');
    });
  });

  describe('Multiple Entries', () => {
    test('should render multiple history entries in correct order', () => {
      const multipleEntries = [mockHistoryEntry, mockStatusChangeEntry, mockNotesUpdateEntry];
      
      render(<BookingHistoryTimeline history={multipleEntries} />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
      
      // Should render timeline connectors between items (except for the last one)
      const connectors = screen.getAllByText('', { selector: '.bg-gray-200' });
      expect(connectors.length).toBeGreaterThan(0);
    });

    test('should not render connector line for the last item', () => {
      render(<BookingHistoryTimeline history={[mockHistoryEntry]} />);
      
      // Single item should not have a connector line
      const list = screen.getByRole('list');
      const lastItem = list.querySelector('li:last-child');
      const connector = lastItem?.querySelector('.bg-gray-200');
      expect(connector).toBeNull();
    });
  });

  describe('Status Display Names', () => {
    test('should display correct German status names', () => {
      const statusEntry = {
        ...mockStatusChangeEntry,
        previousValue: BookingStatus.Pending,
        newValue: BookingStatus.Completed
      };

      render(<BookingHistoryTimeline history={[statusEntry]} />);
      
      expect(screen.getByText('Ausstehend')).toBeInTheDocument();
      expect(screen.getByText('Abgeschlossen')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing details gracefully', () => {
      const entryWithoutDetails = {
        ...mockHistoryEntry,
        details: undefined
      };

      render(<BookingHistoryTimeline history={[entryWithoutDetails]} />);
      
      expect(screen.getByText('Buchung wurde erstellt')).toBeInTheDocument();
      // Should not crash and still render the basic event info
    });

    test('should handle invalid timestamps gracefully', () => {
      const entryWithInvalidTimestamp = {
        ...mockHistoryEntry,
        timestamp: 'invalid-timestamp'
      };

      render(<BookingHistoryTimeline history={[entryWithInvalidTimestamp]} />);
      
      // Should not crash and still render the event
      expect(screen.getByText('Buchung wurde erstellt')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have no accessibility violations with history entries', async () => {
      const { container } = render(<BookingHistoryTimeline history={[mockHistoryEntry, mockStatusChangeEntry]} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations in loading state', async () => {
      const { container } = render(<BookingHistoryTimeline history={[]} isLoading={true} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations in error state', async () => {
      const { container } = render(<BookingHistoryTimeline history={[]} error="Test error" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations in empty state', async () => {
      const { container } = render(<BookingHistoryTimeline history={[]} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper ARIA attributes', () => {
      render(<BookingHistoryTimeline history={[mockHistoryEntry]} />);
      
      const feed = screen.getByRole('feed');
      expect(feed).toHaveAttribute('aria-label', 'Buchungshistorie');
      expect(feed).toHaveAttribute('aria-live', 'polite');
      
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      
      const eventIcon = screen.getByRole('img', { name: `${mockHistoryEntry.eventType} Event` });
      expect(eventIcon).toBeInTheDocument();
    });

    test('should have proper semantic structure', () => {
      render(<BookingHistoryTimeline history={[mockHistoryEntry, mockStatusChangeEntry]} />);
      
      // Should have proper heading structure
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Änderungsverlauf');
      
      // Should have proper list structure
      const list = screen.getByRole('list');
      const listItems = screen.getAllByRole('listitem');
      
      expect(list).toBeInTheDocument();
      expect(listItems).toHaveLength(2);
    });
  });

  describe('Responsive Design', () => {
    test('should handle responsive layout classes correctly', () => {
      render(<BookingHistoryTimeline history={[mockHistoryEntry]} />);
      
      // Check for responsive classes in user info section
      const userInfoSection = screen.getByText('Max Mustermann').closest('.flex-col');
      expect(userInfoSection).toHaveClass('sm:flex-row', 'sm:items-center', 'sm:space-x-4');
    });

    test('should handle grid layout for creation details responsively', () => {
      render(<BookingHistoryTimeline history={[mockHistoryEntry]} />);
      
      const detailsGrid = screen.getByText(/zeitraum:/i).closest('.grid');
      expect(detailsGrid).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    });
  });

  describe('Content Formatting', () => {
    test('should format dates correctly in creation details', () => {
      render(<BookingHistoryTimeline history={[mockHistoryEntry]} />);
      
      // Should show German date format
      expect(screen.getByText(/01.08.2025 - 03.08.2025/)).toBeInTheDocument();
    });

    test('should display person count correctly', () => {
      render(<BookingHistoryTimeline history={[mockHistoryEntry]} />);
      
      expect(screen.getByText('Personen:')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    test('should display accommodations correctly', () => {
      render(<BookingHistoryTimeline history={[mockHistoryEntry]} />);
      
      expect(screen.getByText('Schlafplätze:')).toBeInTheDocument();
      expect(screen.getByText('Hauptzimmer, Gästezimmer')).toBeInTheDocument();
    });
  });
});