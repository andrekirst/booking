import { http, HttpResponse } from 'msw';
import { BookingHistoryEntry, BookingHistoryEventType, BookingStatus } from '../../../lib/types/api';

// Mock booking history data
const mockBookingHistoryDatabase: { [bookingId: string]: BookingHistoryEntry[] } = {
  'booking-123': [
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
  ],
  'booking-456': [
    {
      id: 'history-4',
      eventType: BookingHistoryEventType.Created,
      timestamp: '2025-07-02T14:00:00Z',
      user: {
        id: 'user-2',
        name: 'Anna Schmidt',
        email: 'anna@example.com'
      },
      description: 'Buchung wurde erstellt',
      details: {
        startDate: '2025-08-10',
        endDate: '2025-08-12',
        totalPersons: 4,
        accommodations: ['Hauptzimmer', 'Gästezimmer']
      }
    },
    {
      id: 'history-5',
      eventType: BookingHistoryEventType.Cancelled,
      timestamp: '2025-07-02T15:30:00Z',
      user: {
        id: 'user-2',
        name: 'Anna Schmidt',
        email: 'anna@example.com'
      },
      description: 'Buchung wurde storniert',
      details: {
        reason: 'Terminkonflikt'
      },
      previousValue: BookingStatus.Pending,
      newValue: BookingStatus.Cancelled
    }
  ],
  'booking-789': [
    {
      id: 'history-6',
      eventType: BookingHistoryEventType.Created,
      timestamp: '2025-07-03T09:00:00Z',
      user: {
        id: 'user-3',
        name: 'Peter Müller',
        email: 'peter@example.com'
      },
      description: 'Buchung wurde erstellt',
      details: {
        startDate: '2025-08-15',
        endDate: '2025-08-17',
        totalPersons: 1,
        accommodations: ['Kleines Zimmer']
      }
    },
    {
      id: 'history-7',
      eventType: BookingHistoryEventType.Accepted,
      timestamp: '2025-07-03T10:15:00Z',
      user: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@example.com'
      },
      description: 'Buchung wurde angenommen',
      details: {
        reason: 'Alle Kriterien erfüllt'
      },
      previousValue: BookingStatus.Pending,
      newValue: BookingStatus.Accepted
    },
    {
      id: 'history-8',
      eventType: BookingHistoryEventType.AccommodationsChanged,
      timestamp: '2025-07-03T11:30:00Z',
      user: {
        id: 'user-3',
        name: 'Peter Müller',
        email: 'peter@example.com'
      },
      description: 'Schlafplätze wurden geändert',
      details: {
        reason: 'Upgrade auf größeres Zimmer verfügbar',
        previousAccommodations: ['Kleines Zimmer'],
        newAccommodations: ['Hauptzimmer']
      },
      previousValue: ['Kleines Zimmer'],
      newValue: ['Hauptzimmer']
    }
  ],
  'booking-empty': [], // For testing empty history
};

// MSW handlers for booking history API
export const bookingHistoryHandlers = [
  // GET /api/bookings/:id/history - Get booking history
  http.get('*/api/bookings/:id/history', ({ params }) => {
    const { id } = params;
    const bookingId = id as string;

    // Simulate network delay
    const delay = Math.random() * 300 + 100; // 100-400ms
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Handle specific test scenarios
        if (bookingId === 'unauthorized') {
          resolve(HttpResponse.json(
            { error: 'Unauthorized', message: 'Please log in to access this resource' },
            { status: 401 }
          ));
          return;
        }

        if (bookingId === 'not-found') {
          resolve(HttpResponse.json(
            { error: 'Not Found', message: 'Booking not found' },
            { status: 404 }
          ));
          return;
        }

        if (bookingId === 'server-error') {
          resolve(HttpResponse.json(
            { error: 'Internal Server Error', message: 'Failed to load booking history' },
            { status: 500 }
          ));
          return;
        }

        if (bookingId === 'network-timeout') {
          // Simulate network timeout by never resolving
          return;
        }

        if (bookingId === 'slow-response') {
          // Simulate very slow response
          setTimeout(() => {
            const history = mockBookingHistoryDatabase[bookingId] || [];
            resolve(HttpResponse.json(history.sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )));
          }, 3000);
          return;
        }

        // Normal response
        const history = mockBookingHistoryDatabase[bookingId] || [];
        
        // Sort by timestamp (newest first) like the backend
        const sortedHistory = history.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        resolve(HttpResponse.json(sortedHistory));
      }, delay);
    });
  }),

  // POST /api/bookings/:id/history/events - Add history event (for testing dynamic updates)
  http.post('*/api/bookings/:id/history/events', async ({ params, request }) => {
    const { id } = params;
    const bookingId = id as string;
    const eventData = await request.json() as Partial<BookingHistoryEntry>;

    if (!mockBookingHistoryDatabase[bookingId]) {
      mockBookingHistoryDatabase[bookingId] = [];
    }

    const newEvent: BookingHistoryEntry = {
      id: `history-${Date.now()}`,
      eventType: eventData.eventType || BookingHistoryEventType.Updated,
      timestamp: new Date().toISOString(),
      user: eventData.user || {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com'
      },
      description: eventData.description || 'Test event',
      details: eventData.details || {},
      ...eventData
    };

    mockBookingHistoryDatabase[bookingId].unshift(newEvent);

    return HttpResponse.json(newEvent, { status: 201 });
  }),

  // DELETE /api/bookings/:id/history - Clear history (for testing cleanup)
  http.delete('*/api/bookings/:id/history', ({ params }) => {
    const { id } = params;
    const bookingId = id as string;

    if (mockBookingHistoryDatabase[bookingId]) {
      mockBookingHistoryDatabase[bookingId] = [];
    }

    return HttpResponse.json({ message: 'History cleared successfully' });
  }),
];

// Test utility functions
export const bookingHistoryTestUtils = {
  // Add custom history entry for testing
  addHistoryEntry: (bookingId: string, entry: Partial<BookingHistoryEntry>) => {
    if (!mockBookingHistoryDatabase[bookingId]) {
      mockBookingHistoryDatabase[bookingId] = [];
    }

    const fullEntry: BookingHistoryEntry = {
      id: `test-${Date.now()}`,
      eventType: BookingHistoryEventType.Updated,
      timestamp: new Date().toISOString(),
      user: {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com'
      },
      description: 'Test event',
      details: {},
      ...entry
    };

    mockBookingHistoryDatabase[bookingId].unshift(fullEntry);
    return fullEntry;
  },

  // Clear all history for testing
  clearHistory: (bookingId: string) => {
    if (mockBookingHistoryDatabase[bookingId]) {
      mockBookingHistoryDatabase[bookingId] = [];
    }
  },

  // Get current history (for test assertions)
  getHistory: (bookingId: string) => {
    return mockBookingHistoryDatabase[bookingId] || [];
  },

  // Reset all mock data
  resetAllHistory: () => {
    Object.keys(mockBookingHistoryDatabase).forEach(key => {
      if (!['booking-123', 'booking-456', 'booking-789', 'booking-empty'].includes(key)) {
        delete mockBookingHistoryDatabase[key];
      }
    });
  },

  // Create booking with predefined history
  createBookingWithHistory: (
    bookingId: string, 
    historyEntries: Partial<BookingHistoryEntry>[]
  ) => {
    mockBookingHistoryDatabase[bookingId] = historyEntries.map((entry, index) => ({
      id: `${bookingId}-history-${index}`,
      eventType: BookingHistoryEventType.Updated,
      timestamp: new Date(Date.now() - (historyEntries.length - index) * 60000).toISOString(),
      user: {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com'
      },
      description: 'Test event',
      details: {},
      ...entry
    }));
  },

  // Simulate different network conditions
  simulateSlowNetwork: (bookingId: string, delayMs: number = 2000) => {
    // This would be implemented with dynamic handler modification
    // For now, we use the 'slow-response' booking ID
    return 'slow-response';
  },

  simulateNetworkError: (bookingId: string, errorCode: number = 500) => {
    switch (errorCode) {
      case 401:
        return 'unauthorized';
      case 404:
        return 'not-found';
      case 500:
        return 'server-error';
      default:
        return 'server-error';
    }
  }
};

// Export sample data for tests
export const sampleBookingHistory = {
  withMultipleEvents: mockBookingHistoryDatabase['booking-123'],
  withCancellation: mockBookingHistoryDatabase['booking-456'],
  withAcceptanceAndChanges: mockBookingHistoryDatabase['booking-789'],
  empty: mockBookingHistoryDatabase['booking-empty'],
};

// Export event type helpers for tests
export const createHistoryEvent = {
  created: (overrides: Partial<BookingHistoryEntry> = {}): Partial<BookingHistoryEntry> => ({
    eventType: BookingHistoryEventType.Created,
    description: 'Buchung wurde erstellt',
    details: {
      startDate: '2025-08-01',
      endDate: '2025-08-03',
      totalPersons: 2,
      accommodations: ['Hauptzimmer']
    },
    ...overrides
  }),

  statusChanged: (
    fromStatus: BookingStatus,
    toStatus: BookingStatus,
    overrides: Partial<BookingHistoryEntry> = {}
  ): Partial<BookingHistoryEntry> => ({
    eventType: BookingHistoryEventType.StatusChanged,
    description: `Status wurde von ${fromStatus} zu ${toStatus} geändert`,
    details: {
      reason: 'Automatische Statusänderung'
    },
    previousValue: fromStatus,
    newValue: toStatus,
    ...overrides
  }),

  notesUpdated: (notes: string, overrides: Partial<BookingHistoryEntry> = {}): Partial<BookingHistoryEntry> => ({
    eventType: BookingHistoryEventType.NotesUpdated,
    description: 'Notizen wurden aktualisiert',
    details: {
      notes
    },
    ...overrides
  }),

  cancelled: (reason: string, overrides: Partial<BookingHistoryEntry> = {}): Partial<BookingHistoryEntry> => ({
    eventType: BookingHistoryEventType.Cancelled,
    description: 'Buchung wurde storniert',
    details: {
      reason
    },
    previousValue: BookingStatus.Pending,
    newValue: BookingStatus.Cancelled,
    ...overrides
  }),

  accepted: (reason: string, overrides: Partial<BookingHistoryEntry> = {}): Partial<BookingHistoryEntry> => ({
    eventType: BookingHistoryEventType.Accepted,
    description: 'Buchung wurde angenommen',
    details: {
      reason
    },
    previousValue: BookingStatus.Pending,
    newValue: BookingStatus.Accepted,
    ...overrides
  }),

  rejected: (reason: string, overrides: Partial<BookingHistoryEntry> = {}): Partial<BookingHistoryEntry> => ({
    eventType: BookingHistoryEventType.Rejected,
    description: 'Buchung wurde abgelehnt',
    details: {
      reason
    },
    previousValue: BookingStatus.Pending,
    newValue: BookingStatus.Rejected,
    ...overrides
  })
};