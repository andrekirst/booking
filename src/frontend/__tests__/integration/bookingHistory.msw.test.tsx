import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import '@testing-library/jest-dom';
import { bookingHistoryHandlers, bookingHistoryTestUtils, createHistoryEvent, sampleBookingHistory } from '../mocks/handlers/bookingHistory';
import BookingHistoryTimeline from '../../app/components/ui/BookingHistoryTimeline';
import { BookingHistoryEventType, BookingStatus } from '../../lib/types/api';

// Setup MSW server
const server = setupServer(...bookingHistoryHandlers);

// Setup and cleanup
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  bookingHistoryTestUtils.resetAllHistory();
});

afterAll(() => {
  server.close();
});

// Helper to fetch booking history data
const fetchBookingHistory = async (bookingId: string) => {
  const response = await fetch(`/api/bookings/${bookingId}/history`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

describe('Booking History MSW Integration Tests', () => {
  describe('API Response Handling', () => {
    test('should fetch and display booking history successfully', async () => {
      const history = await fetchBookingHistory('booking-123');
      
      render(<BookingHistoryTimeline history={history} />);
      
      // Should display all history entries
      expect(screen.getByText('Buchung wurde erstellt')).toBeInTheDocument();
      expect(screen.getByText('Status wurde geändert')).toBeInTheDocument();
      expect(screen.getByText('Notizen wurden aktualisiert')).toBeInTheDocument();
      
      // Should display user information
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      
      // Should display creation details
      expect(screen.getByText(/01.08.2025 - 03.08.2025/)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Person count
      expect(screen.getByText('Hauptzimmer')).toBeInTheDocument();
    });

    test('should handle empty history gracefully', async () => {
      const history = await fetchBookingHistory('booking-empty');
      
      render(<BookingHistoryTimeline history={history} />);
      
      expect(screen.getByText('Keine Historie verfügbar')).toBeInTheDocument();
      expect(screen.getByText(/für diese buchung wurden noch keine änderungen aufgezeichnet/i)).toBeInTheDocument();
    });

    test('should handle 404 booking not found', async () => {
      await expect(fetchBookingHistory('not-found')).rejects.toThrow('HTTP 404');
    });

    test('should handle 401 unauthorized', async () => {
      await expect(fetchBookingHistory('unauthorized')).rejects.toThrow('HTTP 401');
    });

    test('should handle 500 server error', async () => {
      await expect(fetchBookingHistory('server-error')).rejects.toThrow('HTTP 500');
    });

    test('should sort history entries by timestamp (newest first)', async () => {
      // Create custom booking with unsorted history
      const unsortedHistory = [
        createHistoryEvent.created({ 
          id: 'old-event',
          timestamp: '2025-07-01T10:00:00Z' 
        }),
        createHistoryEvent.statusChanged(
          BookingStatus.Pending, 
          BookingStatus.Confirmed, 
          { 
            id: 'newer-event',
            timestamp: '2025-07-01T15:00:00Z' 
          }
        ),
        createHistoryEvent.notesUpdated('Updated notes', { 
          id: 'newest-event',
          timestamp: '2025-07-01T20:00:00Z' 
        })
      ];

      bookingHistoryTestUtils.createBookingWithHistory('test-booking', unsortedHistory);
      
      const history = await fetchBookingHistory('test-booking');
      
      render(<BookingHistoryTimeline history={history} />);
      
      // Should render in chronological order (newest first)
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
      
      // First item should be the newest (notes update)
      expect(listItems[0]).toHaveTextContent('Notizen wurden aktualisiert');
      // Last item should be the oldest (creation)
      expect(listItems[2]).toHaveTextContent('Buchung wurde erstellt');
    });
  });

  describe('Network Conditions', () => {
    test('should handle slow network responses', async () => {
      const startTime = Date.now();
      
      // Use slow-response booking ID
      const historyPromise = fetchBookingHistory('slow-response');
      
      // Should eventually resolve
      await expect(historyPromise).resolves.toBeDefined();
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThan(2500); // Should take at least 2.5 seconds
    }, 10000); // 10 second timeout for slow test

    test('should handle network timeout gracefully', async () => {
      // Set a shorter timeout for this test
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      try {
        await fetch('/api/bookings/network-timeout/history', {
          signal: controller.signal
        });
      } catch (error: any) {
        expect(error.name).toBe('AbortError');
      } finally {
        clearTimeout(timeoutId);
      }
    });
  });

  describe('Dynamic History Updates', () => {
    test('should support adding new history events', async () => {
      // Start with empty history
      let history = await fetchBookingHistory('booking-empty');
      expect(history).toHaveLength(0);

      // Add a new event
      const newEvent = createHistoryEvent.created({
        user: {
          id: 'test-user',
          name: 'Test User',
          email: 'test@example.com'
        }
      });

      await fetch('/api/bookings/booking-empty/history/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });

      // Fetch updated history
      history = await fetchBookingHistory('booking-empty');
      expect(history).toHaveLength(1);
      expect(history[0].description).toBe('Buchung wurde erstellt');
    });

    test('should preserve chronological order when adding events', async () => {
      // Add multiple events with different timestamps
      const events = [
        createHistoryEvent.created({ timestamp: '2025-07-01T10:00:00Z' }),
        createHistoryEvent.statusChanged(
          BookingStatus.Pending, 
          BookingStatus.Confirmed, 
          { timestamp: '2025-07-01T11:00:00Z' }
        ),
        createHistoryEvent.notesUpdated('Notes added', { timestamp: '2025-07-01T09:00:00Z' })
      ];

      // Add events in random order
      for (const event of [events[1], events[2], events[0]]) {
        await fetch('/api/bookings/test-chronology/history/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
      }

      const history = await fetchBookingHistory('test-chronology');
      
      // Should be sorted by timestamp (newest first)
      expect(history[0].timestamp).toBe('2025-07-01T11:00:00Z'); // Status change
      expect(history[1].timestamp).toBe('2025-07-01T10:00:00Z'); // Creation
      expect(history[2].timestamp).toBe('2025-07-01T09:00:00Z'); // Notes
    });
  });

  describe('Event Type Scenarios', () => {
    test('should handle complex status change scenario', async () => {
      const statusHistory = [
        createHistoryEvent.created(),
        createHistoryEvent.statusChanged(BookingStatus.Pending, BookingStatus.Confirmed),
        createHistoryEvent.statusChanged(BookingStatus.Confirmed, BookingStatus.Cancelled)
      ];

      bookingHistoryTestUtils.createBookingWithHistory('status-scenario', statusHistory);
      const history = await fetchBookingHistory('status-scenario');
      
      render(<BookingHistoryTimeline history={history} />);
      
      // Should show status transitions
      expect(screen.getByText('Ausstehend')).toBeInTheDocument();
      expect(screen.getByText('Bestätigt')).toBeInTheDocument();
      expect(screen.getByText('Storniert')).toBeInTheDocument();
      
      // Should show arrows indicating transitions
      const arrows = screen.getAllByText('', { selector: 'svg' });
      expect(arrows.length).toBeGreaterThan(0);
    });

    test('should handle accommodation changes', async () => {
      const accommodationHistory = [
        createHistoryEvent.created(),
        {
          eventType: BookingHistoryEventType.AccommodationsChanged,
          description: 'Schlafplätze wurden geändert',
          details: {
            previousAccommodations: ['Kleines Zimmer'],
            newAccommodations: ['Hauptzimmer', 'Gästezimmer'],
            reason: 'Upgrade verfügbar'
          },
          previousValue: ['Kleines Zimmer'],
          newValue: ['Hauptzimmer', 'Gästezimmer']
        }
      ];

      bookingHistoryTestUtils.createBookingWithHistory('accommodation-scenario', accommodationHistory);
      const history = await fetchBookingHistory('accommodation-scenario');
      
      render(<BookingHistoryTimeline history={history} />);
      
      expect(screen.getByText('Schlafplätze wurden geändert')).toBeInTheDocument();
      // Should show orange styling for update events
      const updateEvent = screen.getByText('Schlafplätze wurden geändert').closest('.pb-8');
      expect(updateEvent?.querySelector('.bg-orange-100')).toBeInTheDocument();
    });

    test('should handle rejection with reason', async () => {
      const rejectionHistory = [
        createHistoryEvent.created(),
        createHistoryEvent.rejected('Terminkonflikt mit anderen Buchungen')
      ];

      bookingHistoryTestUtils.createBookingWithHistory('rejection-scenario', rejectionHistory);
      const history = await fetchBookingHistory('rejection-scenario');
      
      render(<BookingHistoryTimeline history={history} />);
      
      expect(screen.getByText('Buchung wurde abgelehnt')).toBeInTheDocument();
      expect(screen.getByText('Details:')).toBeInTheDocument();
      expect(screen.getByText('Terminkonflikt mit anderen Buchungen')).toBeInTheDocument();
      
      // Should show red styling for cancellation/rejection events
      const rejectionEvent = screen.getByText('Buchung wurde abgelehnt').closest('.pb-8');
      expect(rejectionEvent?.querySelector('.bg-red-100')).toBeInTheDocument();
    });
  });

  describe('Performance and Caching', () => {
    test('should handle multiple concurrent requests', async () => {
      const bookingIds = ['booking-123', 'booking-456', 'booking-789'];
      
      const startTime = Date.now();
      
      // Make concurrent requests
      const promises = bookingIds.map(id => fetchBookingHistory(id));
      const results = await Promise.all(promises);
      
      const endTime = Date.now();
      
      // All requests should succeed
      expect(results).toHaveLength(3);
      results.forEach(history => {
        expect(Array.isArray(history)).toBe(true);
      });
      
      // Should complete in reasonable time (accounting for network simulation)
      expect(endTime - startTime).toBeLessThan(2000);
    });

    test('should simulate realistic network delays', async () => {
      const requests = [];
      
      // Make multiple requests and measure timing
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        const promise = fetchBookingHistory('booking-123').then(() => {
          const endTime = Date.now();
          return endTime - startTime;
        });
        requests.push(promise);
      }
      
      const durations = await Promise.all(requests);
      
      // Should have realistic delays (100-400ms each)
      durations.forEach(duration => {
        expect(duration).toBeGreaterThan(50);
        expect(duration).toBeLessThan(500);
      });
    });
  });

  describe('Error Recovery', () => {
    test('should handle temporary server errors with retry', async () => {
      let attemptCount = 0;
      
      // Override handler to fail first attempt, succeed on retry
      server.use(
        http.get('*/api/bookings/flaky-server/history', () => {
          attemptCount++;
          if (attemptCount === 1) {
            return HttpResponse.json(
              { error: 'Internal Server Error' },
              { status: 500 }
            );
          }
          return HttpResponse.json(sampleBookingHistory.withMultipleEvents);
        })
      );

      // First attempt should fail
      await expect(fetchBookingHistory('flaky-server')).rejects.toThrow('HTTP 500');
      
      // Retry should succeed
      const history = await fetchBookingHistory('flaky-server');
      expect(history).toHaveLength(3);
      expect(attemptCount).toBe(2);
    });

    test('should handle malformed responses gracefully', async () => {
      // Override handler to return malformed data
      server.use(
        http.get('*/api/bookings/malformed/history', () => {
          return HttpResponse.json({ invalid: 'data' });
        })
      );

      const malformedData = await fetchBookingHistory('malformed');
      
      // Component should handle malformed data without crashing
      render(<BookingHistoryTimeline history={malformedData as any} />);
      
      // Should show empty state or handle gracefully
      expect(screen.getByText('Keine Historie verfügbar')).toBeInTheDocument();
    });
  });

  describe('Real-world Scenarios', () => {
    test('should handle a complete booking lifecycle', async () => {
      const lifecycleHistory = [
        createHistoryEvent.created({ timestamp: '2025-07-01T10:00:00Z' }),
        createHistoryEvent.notesUpdated('Zusätzliche Wünsche hinzugefügt', { 
          timestamp: '2025-07-01T10:30:00Z' 
        }),
        createHistoryEvent.statusChanged(
          BookingStatus.Pending, 
          BookingStatus.Confirmed, 
          { timestamp: '2025-07-01T11:00:00Z' }
        ),
        createHistoryEvent.accepted('Finale Bestätigung', { 
          timestamp: '2025-07-01T12:00:00Z' 
        }),
        {
          eventType: BookingHistoryEventType.DatesChanged,
          description: 'Datum wurde angepasst',
          details: {
            previousStartDate: '2025-08-01',
            previousEndDate: '2025-08-03',
            newStartDate: '2025-08-02',
            newEndDate: '2025-08-04',
            reason: 'Änderung auf Kundenwunsch'
          },
          timestamp: '2025-07-01T13:00:00Z'
        }
      ];

      bookingHistoryTestUtils.createBookingWithHistory('lifecycle', lifecycleHistory);
      const history = await fetchBookingHistory('lifecycle');
      
      render(<BookingHistoryTimeline history={history} />);
      
      // Should show complete timeline
      expect(screen.getByText('Buchung wurde erstellt')).toBeInTheDocument();
      expect(screen.getByText('Zusätzliche Wünsche hinzugefügt')).toBeInTheDocument();
      expect(screen.getByText('Status wurde geändert')).toBeInTheDocument();
      expect(screen.getByText('Buchung wurde angenommen')).toBeInTheDocument();
      expect(screen.getByText('Datum wurde angepasst')).toBeInTheDocument();
      
      // Should have proper timeline connectors
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(5);
      
      // Should be in chronological order (newest first)
      expect(listItems[0]).toHaveTextContent('Datum wurde angepasst');
      expect(listItems[4]).toHaveTextContent('Buchung wurde erstellt');
    });
  });
});