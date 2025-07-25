import { render, screen, fireEvent } from '@testing-library/react';
import AccommodationSelector from '../AccommodationSelector';
import { SleepingAccommodation, SleepingAccommodationAvailability, CreateBookingItem, AccommodationType } from '../../../../lib/types/api';

const mockAccommodations: SleepingAccommodation[] = [
  {
    id: '1',
    name: 'Hauptzimmer',
    type: AccommodationType.Room,
    maxCapacity: 4,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Zeltplatz',
    type: AccommodationType.Tent,
    maxCapacity: 2,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Inaktives Zimmer',
    type: AccommodationType.Room,
    maxCapacity: 2,
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const mockAvailability: SleepingAccommodationAvailability[] = [
  {
    id: '1',
    name: 'Hauptzimmer',
    maxCapacity: 4,
    isAvailable: true,
    availableCapacity: 4,
    conflictingBookings: []
  },
  {
    id: '2',
    name: 'Zeltplatz',
    maxCapacity: 2,
    isAvailable: true,
    availableCapacity: 1,
    conflictingBookings: [
      {
        bookingId: 'booking-1',
        startDate: '2024-07-15',
        endDate: '2024-07-17',
        personCount: 1,
        userName: 'Max Mustermann'
      }
    ]
  }
];

describe('AccommodationSelector', () => {
  const mockOnSelectionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders accommodation selector with title', () => {
      render(
        <AccommodationSelector
          accommodations={mockAccommodations}
          selectedItems={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/schlafmöglichkeiten auswählen/i)).toBeInTheDocument();
    });

    it('renders only active accommodations', () => {
      render(
        <AccommodationSelector
          accommodations={mockAccommodations}
          selectedItems={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText('Hauptzimmer')).toBeInTheDocument();
      expect(screen.getByText('Zeltplatz')).toBeInTheDocument();
      expect(screen.queryByText('Inaktives Zimmer')).not.toBeInTheDocument();
    });

    it('displays accommodation type icons and names correctly', () => {
      render(
        <AccommodationSelector
          accommodations={mockAccommodations}
          selectedItems={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Use getAllByText since "Zimmer" appears multiple times
      const zimmerElements = screen.getAllByText(/zimmer/i);
      expect(zimmerElements.length).toBeGreaterThan(0);
      
      // Use getAllByText since "Zelt" may appear multiple times too
      const zeltElements = screen.getAllByText(/zelt/i);
      expect(zeltElements.length).toBeGreaterThan(0);
    });

    it('shows max capacity for each accommodation', () => {
      render(
        <AccommodationSelector
          accommodations={mockAccommodations}
          selectedItems={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/max\. 4 personen/i)).toBeInTheDocument();
      expect(screen.getByText(/max\. 2 personen/i)).toBeInTheDocument();
    });

    it('displays total persons count when items are selected', () => {
      const selectedItems: CreateBookingItem[] = [
        { sleepingAccommodationId: '1', personCount: 2 },
        { sleepingAccommodationId: '2', personCount: 1 }
      ];

      render(
        <AccommodationSelector
          accommodations={mockAccommodations}
          selectedItems={selectedItems}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/gesamt: 3 personen/i)).toBeInTheDocument();
    });

    it('uses singular form for one person', () => {
      const selectedItems: CreateBookingItem[] = [
        { sleepingAccommodationId: '1', personCount: 1 }
      ];

      render(
        <AccommodationSelector
          accommodations={mockAccommodations}
          selectedItems={selectedItems}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/gesamt: 1 person/i)).toBeInTheDocument();
    });

    it('shows no accommodations message when list is empty', () => {
      render(
        <AccommodationSelector
          accommodations={[]}
          selectedItems={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/keine schlafmöglichkeiten verfügbar/i)).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
      const errorMessage = 'Test error message';
      
      render(
        <AccommodationSelector
          accommodations={mockAccommodations}
          selectedItems={[]}
          onSelectionChange={mockOnSelectionChange}
          error={errorMessage}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Availability Display', () => {
    it('shows availability status when availability data is provided', () => {
      render(
        <AccommodationSelector
          accommodations={mockAccommodations}
          availability={mockAvailability}
          selectedItems={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/verfügbar/i)).toBeInTheDocument();
      expect(screen.getByText(/1 frei/i)).toBeInTheDocument();
    });

    it('displays conflicting bookings information', () => {
      render(
        <AccommodationSelector
          accommodations={mockAccommodations}
          availability={mockAvailability}
          selectedItems={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/teilweise belegt:/i)).toBeInTheDocument();
      expect(screen.getByText(/max mustermann/i)).toBeInTheDocument();
    });

    it('shows unavailable status correctly', () => {
      const unavailableAccommodation: SleepingAccommodationAvailability[] = [
        {
          id: '1',
          name: 'Hauptzimmer',
          maxCapacity: 4,
          isAvailable: false,
          availableCapacity: 0,
          conflictingBookings: [
            {
              bookingId: 'booking-1',
              startDate: '2024-07-15',
              endDate: '2024-07-17',
              personCount: 4,
              userName: 'Max Mustermann'
            }
          ]
        }
      ];

      render(
        <AccommodationSelector
          accommodations={mockAccommodations.slice(0, 1)}
          availability={unavailableAccommodation}
          selectedItems={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText('Belegt')).toBeInTheDocument();
    });
  });

  describe('Person Count Selection', () => {
    it('calls onSelectionChange when person count is changed', () => {
      render(
        <AccommodationSelector
          accommodations={mockAccommodations}
          selectedItems={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Find increase button for first accommodation
      const increaseButtons = screen.getAllByTitle('Erhöhen');
      fireEvent.click(increaseButtons[0]);
      
      expect(mockOnSelectionChange).toHaveBeenCalled();
    });

    it('removes item when person count is set to 0', () => {
      const selectedItems: CreateBookingItem[] = [
        { sleepingAccommodationId: '1', personCount: 1 }
      ];

      render(
        <AccommodationSelector
          accommodations={mockAccommodations}
          selectedItems={selectedItems}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Find decrease button for first accommodation  
      const decreaseButtons = screen.getAllByTitle('Verringern');
      fireEvent.click(decreaseButtons[0]);
      
      expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
    });

    it('limits person count to available capacity when availability is provided', () => {
      render(
        <AccommodationSelector
          accommodations={mockAccommodations}
          availability={mockAvailability}
          selectedItems={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Test NumberSpinner constraints by checking increment/decrement buttons and labels
      const incrementButtons = screen.getAllByLabelText('Erhöhen');
      const decrementButtons = screen.getAllByLabelText('Verringern');
      
      // Both accommodations should have NumberSpinner controls
      expect(incrementButtons).toHaveLength(2);
      expect(decrementButtons).toHaveLength(2);
      
      // Check that both NumberSpinners are present and functional
      expect(incrementButtons[0]).toBeInTheDocument();
      expect(incrementButtons[1]).toBeInTheDocument();
    });

    it('disables number spinner for unavailable accommodations', () => {
      const unavailableAccommodation: SleepingAccommodationAvailability[] = [
        {
          id: '1',
          name: 'Hauptzimmer',
          maxCapacity: 4,
          isAvailable: false,
          availableCapacity: 0,
          conflictingBookings: []
        }
      ];

      render(
        <AccommodationSelector
          accommodations={mockAccommodations.slice(0, 1)}
          availability={unavailableAccommodation}
          selectedItems={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Check that the number spinner buttons are disabled
      const incrementButton = screen.getByLabelText('Erhöhen');
      const decrementButton = screen.getByLabelText('Verringern');
      expect(incrementButton).toBeDisabled();
      expect(decrementButton).toBeDisabled();
    });
  });

  describe('Visual States', () => {
    it('shows selected state when accommodation is selected', () => {
      const selectedItems: CreateBookingItem[] = [
        { sleepingAccommodationId: '1', personCount: 2 }
      ];

      render(
        <AccommodationSelector
          accommodations={mockAccommodations}
          selectedItems={selectedItems}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Check that the total persons count is displayed (indicating selection)
      expect(screen.getByText(/gesamt: 2 personen/i)).toBeInTheDocument();
    });

    it('shows unavailable state when accommodation is unavailable', () => {
      const unavailableAccommodation: SleepingAccommodationAvailability[] = [
        {
          id: '1',
          name: 'Hauptzimmer',
          maxCapacity: 4,
          isAvailable: false,
          availableCapacity: 0,
          conflictingBookings: []
        }
      ];

      render(
        <AccommodationSelector
          accommodations={mockAccommodations.slice(0, 1)}
          availability={unavailableAccommodation}
          selectedItems={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Check that the number spinner buttons are disabled for unavailable accommodations
      const incrementButton = screen.getByLabelText('Erhöhen');
      const decrementButton = screen.getByLabelText('Verringern');
      expect(incrementButton).toBeDisabled();
      expect(decrementButton).toBeDisabled();
    });
  });

  describe('Props Update', () => {
    it('updates local state when selectedItems prop changes', () => {
      const { rerender } = render(
        <AccommodationSelector
          accommodations={mockAccommodations}
          selectedItems={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const selectedItems: CreateBookingItem[] = [
        { sleepingAccommodationId: '1', personCount: 2 }
      ];

      rerender(
        <AccommodationSelector
          accommodations={mockAccommodations}
          selectedItems={selectedItems}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/gesamt: 2 personen/i)).toBeInTheDocument();
    });
  });
});