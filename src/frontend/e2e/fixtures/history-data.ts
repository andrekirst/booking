/**
 * Test Data Factory for Booking History E2E Tests
 * Provides standardized test data creation for consistent testing
 */

export interface HistoryEvent {
  id: string;
  eventType: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  description: string;
  details: any;
  previousValue?: any;
  newValue?: any;
}

export interface MockApiResponse {
  status: number;
  contentType?: string;
  body: string;
  headers?: Record<string, string>;
}

export class HistoryDataFactory {
  /**
   * Creates a standard booking history with basic events
   */
  static createStandardHistory(bookingId: string): HistoryEvent[] {
    const baseTimestamp = new Date('2025-01-10T10:00:00Z');
    
    return [
      {
        id: `${bookingId}-created`,
        eventType: 'Created',
        timestamp: new Date(baseTimestamp.getTime()).toISOString(),
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com'
        },
        description: 'Buchung wurde erstellt',
        details: {
          startDate: '2025-08-01',
          endDate: '2025-08-03',
          totalPersons: 2,
          accommodations: ['Main Bedroom']
        }
      },
      {
        id: `${bookingId}-status-changed`,
        eventType: 'StatusChanged',
        timestamp: new Date(baseTimestamp.getTime() + 30 * 60 * 1000).toISOString(), // 30 minutes later
        user: {
          id: '2',
          name: 'Admin User',
          email: 'admin@booking.com'
        },
        description: 'Status geändert',
        details: {
          reason: 'Automatische Bestätigung'
        },
        previousValue: 0, // Pending
        newValue: 1       // Confirmed
      }
    ];
  }

  /**
   * Creates a complex booking history with multiple event types
   */
  static createComplexHistory(bookingId: string, eventCount: number = 10): HistoryEvent[] {
    const baseTimestamp = new Date('2025-01-10T08:00:00Z');
    const eventTypes = ['Created', 'StatusChanged', 'NotesUpdated', 'AccommodationsChanged', 'GuestCountChanged'];
    const users = [
      { id: '1', name: 'Customer User', email: 'customer@family.com' },
      { id: '2', name: 'Admin User', email: 'admin@booking.com' },
      { id: '3', name: 'System', email: 'system@booking.com' }
    ];

    return Array.from({ length: eventCount }, (_, i) => {
      const eventType = eventTypes[i % eventTypes.length];
      const user = users[i % users.length];
      const timestamp = new Date(baseTimestamp.getTime() + i * 15 * 60 * 1000); // 15 minutes apart

      return {
        id: `${bookingId}-event-${i}`,
        eventType,
        timestamp: timestamp.toISOString(),
        user,
        description: this.getDescriptionForEventType(eventType, i),
        details: this.getDetailsForEventType(eventType, i),
        ...(eventType === 'StatusChanged' && {
          previousValue: i % 3,
          newValue: (i + 1) % 3
        })
      };
    });
  }

  /**
   * Creates a large history dataset for performance testing
   */
  static createLargeHistory(bookingId: string, eventCount: number = 100): HistoryEvent[] {
    const baseTimestamp = new Date('2025-01-01T00:00:00Z');
    const eventTypes = ['Created', 'StatusChanged', 'NotesUpdated', 'AccommodationsChanged', 'GuestCountChanged', 'PaymentUpdated'];
    
    return Array.from({ length: eventCount }, (_, i) => {
      const eventType = eventTypes[i % eventTypes.length];
      const timestamp = new Date(baseTimestamp.getTime() + i * 60 * 60 * 1000); // 1 hour apart
      
      return {
        id: `${bookingId}-perf-${i}`,
        eventType,
        timestamp: timestamp.toISOString(),
        user: {
          id: `${(i % 10) + 1}`,
          name: `Performance User ${(i % 10) + 1}`,
          email: `perf${(i % 10) + 1}@example.com`
        },
        description: `Performance Test Event ${i + 1}: ${this.getDescriptionForEventType(eventType, i)}`,
        details: {
          performanceTestIndex: i,
          eventType: eventType,
          largeData: this.generateLargeTestData(i),
          metadata: {
            testRun: 'performance-suite',
            iteration: i,
            timestamp: timestamp.toISOString()
          }
        }
      };
    });
  }

  /**
   * Creates history with specific error scenarios
   */
  static createErrorScenarioHistory(bookingId: string, errorType: 'server_error' | 'timeout' | 'network_error'): MockApiResponse {
    switch (errorType) {
      case 'server_error':
        return {
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal Server Error',
            message: 'Unable to fetch booking history',
            code: 'HISTORY_FETCH_ERROR'
          })
        };
        
      case 'timeout':
        return {
          status: 408,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Request Timeout',
            message: 'History request timed out',
            code: 'TIMEOUT_ERROR'
          })
        };
        
      case 'network_error':
        // This would be handled by route.abort() in tests
        return {
          status: 0,
          body: 'Network Error'
        };
        
      default:
        throw new Error(`Unknown error type: ${errorType}`);
    }
  }

  /**
   * Creates history for rate limiting scenarios
   */
  static createRateLimitHistory(bookingId: string): MockApiResponse {
    return {
      status: 429,
      contentType: 'application/json',
      headers: {
        'Retry-After': '2',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': (Date.now() + 2000).toString()
      },
      body: JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      })
    };
  }

  /**
   * Creates empty history response
   */
  static createEmptyHistory(): MockApiResponse {
    return {
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    };
  }

  /**
   * Creates history for specific test scenarios
   */
  static createScenarioHistory(bookingId: string, scenario: string): HistoryEvent[] {
    switch (scenario) {
      case 'booking_lifecycle':
        return [
          {
            id: `${bookingId}-created`,
            eventType: 'Created',
            timestamp: '2025-01-10T10:00:00Z',
            user: { id: '1', name: 'Customer', email: 'customer@family.com' },
            description: 'Buchung wurde erstellt',
            details: { method: 'web_form' }
          },
          {
            id: `${bookingId}-pending`,
            eventType: 'StatusChanged',
            timestamp: '2025-01-10T10:01:00Z',
            user: { id: 'system', name: 'System', email: 'system@booking.com' },
            description: 'Status auf Ausstehend gesetzt',
            details: { automatic: true },
            previousValue: null,
            newValue: 0
          },
          {
            id: `${bookingId}-confirmed`,
            eventType: 'StatusChanged',
            timestamp: '2025-01-10T11:00:00Z',
            user: { id: '2', name: 'Admin', email: 'admin@booking.com' },
            description: 'Buchung bestätigt',
            details: { reason: 'Manual review completed' },
            previousValue: 0,
            newValue: 1
          },
          {
            id: `${bookingId}-checkin`,
            eventType: 'StatusChanged',
            timestamp: '2025-08-01T15:00:00Z',
            user: { id: '2', name: 'Admin', email: 'admin@booking.com' },
            description: 'Gast eingecheckt',
            details: { checkInTime: '15:00' },
            previousValue: 1,
            newValue: 2
          },
          {
            id: `${bookingId}-checkout`,
            eventType: 'StatusChanged',
            timestamp: '2025-08-03T11:00:00Z',
            user: { id: '2', name: 'Admin', email: 'admin@booking.com' },
            description: 'Gast ausgecheckt',
            details: { checkOutTime: '11:00' },
            previousValue: 2,
            newValue: 3
          }
        ];

      case 'complex_modifications':
        return [
          {
            id: `${bookingId}-created`,
            eventType: 'Created',
            timestamp: '2025-01-10T10:00:00Z',
            user: { id: '1', name: 'Customer', email: 'customer@family.com' },
            description: 'Buchung wurde erstellt',
            details: {
              originalRequest: {
                startDate: '2025-08-01',
                endDate: '2025-08-03',
                guestCount: 2,
                accommodations: ['Main Bedroom']
              }
            }
          },
          {
            id: `${bookingId}-notes-added`,
            eventType: 'NotesUpdated',
            timestamp: '2025-01-10T10:30:00Z',
            user: { id: '1', name: 'Customer', email: 'customer@family.com' },
            description: 'Notizen wurden hinzugefügt',
            details: { 
              notes: 'Bitte vegetarisches Essen vorbereiten. Ankunft gegen 16:00 Uhr.' 
            }
          },
          {
            id: `${bookingId}-guests-increased`,
            eventType: 'GuestCountChanged',
            timestamp: '2025-01-10T14:00:00Z',
            user: { id: '1', name: 'Customer', email: 'customer@family.com' },
            description: 'Personenanzahl geändert',
            details: { 
              reason: 'Additional family member joining',
              previousCount: 2,
              newCount: 3
            }
          },
          {
            id: `${bookingId}-accommodation-upgraded`,
            eventType: 'AccommodationsChanged',
            timestamp: '2025-01-10T15:00:00Z',
            user: { id: '2', name: 'Admin', email: 'admin@booking.com' },
            description: 'Schlafplätze wurden angepasst',
            details: {
              reason: 'Upgrade due to increased guest count',
              previousAccommodations: ['Main Bedroom'],
              newAccommodations: ['Main Bedroom', 'Guest Room']
            }
          },
          {
            id: `${bookingId}-dates-extended`,
            eventType: 'DatesChanged',
            timestamp: '2025-01-11T09:00:00Z',
            user: { id: '1', name: 'Customer', email: 'customer@family.com' },
            description: 'Buchungsdauer verlängert',
            details: {
              reason: 'Extended vacation',
              previousStartDate: '2025-08-01',
              previousEndDate: '2025-08-03',
              newStartDate: '2025-08-01',
              newEndDate: '2025-08-05'
            }
          }
        ];

      case 'system_events':
        return [
          {
            id: `${bookingId}-created`,
            eventType: 'Created',
            timestamp: '2025-01-10T10:00:00Z',
            user: { id: '1', name: 'Customer', email: 'customer@family.com' },
            description: 'Buchung wurde erstellt',
            details: {}
          },
          {
            id: `${bookingId}-auto-reminder`,
            eventType: 'SystemEvent',
            timestamp: '2025-07-25T09:00:00Z',
            user: { id: 'system', name: 'System', email: 'system@booking.com' },
            description: 'Automatische Erinnerung versendet',
            details: {
              reminderType: 'upcoming_booking',
              daysUntilArrival: 7,
              emailSent: true
            }
          },
          {
            id: `${bookingId}-payment-reminder`,
            eventType: 'SystemEvent',
            timestamp: '2025-07-30T10:00:00Z',
            user: { id: 'system', name: 'System', email: 'system@booking.com' },
            description: 'Zahlungserinnerung versendet',
            details: {
              reminderType: 'payment_due',
              amount: 150.00,
              currency: 'EUR',
              dueDate: '2025-08-01'
            }
          },
          {
            id: `${bookingId}-checkin-available`,
            eventType: 'SystemEvent',
            timestamp: '2025-08-01T12:00:00Z',
            user: { id: 'system', name: 'System', email: 'system@booking.com' },
            description: 'Check-in verfügbar',
            details: {
              checkInTime: '14:00',
              checkInCode: 'ABC123',
              keyLocation: 'Schlüsselkasten neben der Tür'
            }
          }
        ];

      default:
        return this.createStandardHistory(bookingId);
    }
  }

  /**
   * Converts history events to API response format
   */
  static toApiResponse(events: HistoryEvent[], status: number = 200): MockApiResponse {
    return {
      status,
      contentType: 'application/json',
      body: JSON.stringify(events)
    };
  }

  /**
   * Helper method to get description for event type
   */
  private static getDescriptionForEventType(eventType: string, index: number): string {
    const descriptions: Record<string, string[]> = {
      'Created': ['Buchung wurde erstellt'],
      'StatusChanged': [
        'Status auf Ausstehend gesetzt',
        'Buchung bestätigt',
        'Gast eingecheckt',
        'Gast ausgecheckt',
        'Buchung storniert'
      ],
      'NotesUpdated': [
        'Notizen wurden hinzugefügt',
        'Notizen wurden aktualisiert',
        'Spezielle Anfragen hinzugefügt',
        'Anmerkungen zur Anreise'
      ],
      'AccommodationsChanged': [
        'Schlafplätze wurden angepasst',
        'Zimmer-Upgrade durchgeführt',
        'Zusätzliches Zimmer hinzugefügt',
        'Schlafplatz-Konfiguration geändert'
      ],
      'GuestCountChanged': [
        'Personenanzahl erhöht',
        'Personenanzahl reduziert',
        'Gästeanzahl angepasst'
      ],
      'PaymentUpdated': [
        'Zahlung eingegangen',
        'Zahlungsstatus aktualisiert',
        'Rechnung erstellt',
        'Rückerstattung verarbeitet'
      ]
    };

    const typeDescriptions = descriptions[eventType] || [`${eventType} Event`];
    return typeDescriptions[index % typeDescriptions.length];
  }

  /**
   * Helper method to get details for event type
   */
  private static getDetailsForEventType(eventType: string, index: number): any {
    const baseDetails: Record<string, any> = {
      'Created': {
        method: 'web_form',
        userAgent: 'Mozilla/5.0 Test Browser',
        ip: '192.168.1.100'
      },
      'StatusChanged': {
        reason: [
          'Automatische Bestätigung',
          'Manuelle Überprüfung',
          'Zahlungseingang bestätigt',
          'Check-in durchgeführt'
        ][index % 4],
        automatic: index % 2 === 0
      },
      'NotesUpdated': {
        notes: [
          'Bitte vegetarisches Essen bereitstellen',
          'Ankunft gegen 18:00 Uhr',
          'Allergien: Nüsse, Gluten',
          'Parken im Hinterhof möglich'
        ][index % 4],
        previousNotes: index > 0 ? 'Vorherige Notizen...' : null
      },
      'AccommodationsChanged': {
        reason: [
          'Upgrade auf Premium-Suite',
          'Zusätzlicher Schlafplatz benötigt',
          'Barrierefreier Zugang erforderlich',
          'Zimmer-Tausch gewünscht'
        ][index % 4],
        previousAccommodations: ['Standard Room'],
        newAccommodations: ['Premium Suite']
      },
      'GuestCountChanged': {
        reason: 'Familienplanung geändert',
        previousCount: 2 + (index % 3),
        newCount: 3 + (index % 3)
      },
      'PaymentUpdated': {
        amount: 100 + (index * 25),
        currency: 'EUR',
        method: ['credit_card', 'bank_transfer', 'paypal'][index % 3],
        transactionId: `TXN-${1000 + index}`
      }
    };

    return baseDetails[eventType] || { eventIndex: index };
  }

  /**
   * Generates large test data for performance testing
   */
  private static generateLargeTestData(index: number): any {
    return {
      largeTextField: `This is a large text field for performance testing. Entry ${index}. `.repeat(10),
      arrayData: Array.from({ length: 20 }, (_, i) => ({
        id: `item-${index}-${i}`,
        value: `Value ${i} for entry ${index}`,
        metadata: {
          created: new Date(Date.now() - i * 1000).toISOString(),
          tags: [`tag-${i}`, `entry-${index}`]
        }
      })),
      nestedObject: {
        level1: {
          level2: {
            level3: {
              data: `Deep nested data for entry ${index}`,
              values: Array.from({ length: 10 }, (_, i) => i * index)
            }
          }
        }
      }
    };
  }
}

/**
 * Test scenario builder for complex test cases
 */
export class HistoryTestScenarioBuilder {
  private events: HistoryEvent[] = [];
  private bookingId: string;

  constructor(bookingId: string) {
    this.bookingId = bookingId;
  }

  /**
   * Add booking creation event
   */
  addCreationEvent(user: any, timestamp?: string): this {
    this.events.push({
      id: `${this.bookingId}-created`,
      eventType: 'Created',
      timestamp: timestamp || new Date().toISOString(),
      user,
      description: 'Buchung wurde erstellt',
      details: {}
    });
    return this;
  }

  /**
   * Add status change event
   */
  addStatusChange(user: any, fromStatus: number, toStatus: number, reason?: string, timestamp?: string): this {
    this.events.push({
      id: `${this.bookingId}-status-${this.events.length}`,
      eventType: 'StatusChanged',
      timestamp: timestamp || new Date().toISOString(),
      user,
      description: 'Status geändert',
      details: { reason: reason || 'Status update' },
      previousValue: fromStatus,
      newValue: toStatus
    });
    return this;
  }

  /**
   * Add notes update event
   */
  addNotesUpdate(user: any, notes: string, timestamp?: string): this {
    this.events.push({
      id: `${this.bookingId}-notes-${this.events.length}`,
      eventType: 'NotesUpdated',
      timestamp: timestamp || new Date().toISOString(),
      user,
      description: 'Notizen wurden aktualisiert',
      details: { notes }
    });
    return this;
  }

  /**
   * Add accommodation change event
   */
  addAccommodationChange(user: any, previous: string[], updated: string[], reason?: string, timestamp?: string): this {
    this.events.push({
      id: `${this.bookingId}-accommodation-${this.events.length}`,
      eventType: 'AccommodationsChanged',
      timestamp: timestamp || new Date().toISOString(),
      user,
      description: 'Schlafplätze wurden angepasst',
      details: {
        reason: reason || 'Accommodation update',
        previousAccommodations: previous,
        newAccommodations: updated
      }
    });
    return this;
  }

  /**
   * Add system event
   */
  addSystemEvent(eventDescription: string, details: any, timestamp?: string): this {
    this.events.push({
      id: `${this.bookingId}-system-${this.events.length}`,
      eventType: 'SystemEvent',
      timestamp: timestamp || new Date().toISOString(),
      user: { id: 'system', name: 'System', email: 'system@booking.com' },
      description: eventDescription,
      details
    });
    return this;
  }

  /**
   * Build the history events
   */
  build(): HistoryEvent[] {
    return [...this.events];
  }

  /**
   * Build as API response
   */
  buildAsApiResponse(status: number = 200): MockApiResponse {
    return HistoryDataFactory.toApiResponse(this.events, status);
  }
}

/**
 * Common test users for history events
 */
export const TestUsers = {
  CUSTOMER: { id: '1', name: 'Test Customer', email: 'customer@family.com' },
  ADMIN: { id: '2', name: 'Admin User', email: 'admin@booking.com' },
  SYSTEM: { id: 'system', name: 'System', email: 'system@booking.com' },
  MODERATOR: { id: '3', name: 'Moderator', email: 'moderator@booking.com' }
};

/**
 * Common test booking IDs
 */
export const TestBookingIds = {
  STANDARD: '123e4567-e89b-12d3-a456-426614174000',
  COMPLEX: '987fcdeb-51d2-43a1-b321-654987321098',
  PERFORMANCE: 'perf-test-booking-id',
  ERROR_SCENARIO: 'error-test-booking-id',
  EMPTY_HISTORY: 'empty-history-booking-id'
};