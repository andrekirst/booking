import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateRangePicker from '../DateRangePicker';
import { SleepingAccommodationAvailability } from '@/lib/types/api';

// Mock current date for consistent testing
const mockToday = new Date('2025-01-15');

// Mock Date constructor and Date.now()
const RealDate = Date;
// @ts-ignore
global.Date = class extends RealDate {
  constructor(...args: any[]) {
    if (args.length === 0) {
      return new RealDate(mockToday);
    }
    return new RealDate(...args);
  }
  
  static now() {
    return mockToday.getTime();
  }
  
  static parse(s: string) {
    return RealDate.parse(s);
  }
  
  static UTC(...args: any[]) {
    return RealDate.UTC(...args);
  }
};

const mockOnDateChange = jest.fn();

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
    name: 'Gartenzimmer',
    maxCapacity: 2,
    isAvailable: false,
    availableCapacity: 0,
    conflictingBookings: []
  }
];

describe('DateRangePicker', () => {
  beforeEach(() => {
    mockOnDateChange.mockClear();
  });

  describe('Rendering', () => {
    it('renders with default placeholder text', () => {
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      expect(screen.getByText('Anreise')).toBeInTheDocument();
    });

    it('displays selected dates in correct format', () => {
      render(
        <DateRangePicker
          startDate="2025-01-20"
          endDate="2025-01-25"
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.getByText('20. Jan. 2025')).toBeInTheDocument();
      expect(screen.getByText('25. Jan. 2025')).toBeInTheDocument();
      expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('shows nights count when both dates are selected', () => {
      render(
        <DateRangePicker
          startDate="2025-01-20"
          endDate="2025-01-25"
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.getByText('5 Nächte')).toBeInTheDocument();
    });

    it('shows singular night for one night stay', () => {
      render(
        <DateRangePicker
          startDate="2025-01-20"
          endDate="2025-01-21"
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.getByText('1 Nacht')).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
      const errorMessage = 'Bitte wählen Sie gültige Daten';
      render(
        <DateRangePicker
          onDateChange={mockOnDateChange}
          error={errorMessage}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('displays warning message when provided and no error', () => {
      const warningMessage = 'Verfügbarkeitsprüfung nicht möglich';
      render(
        <DateRangePicker
          onDateChange={mockOnDateChange}
          warning={warningMessage}
        />
      );

      expect(screen.getByText(warningMessage)).toBeInTheDocument();
    });

    it('prioritizes error over warning', () => {
      render(
        <DateRangePicker
          onDateChange={mockOnDateChange}
          error="Error message"
          warning="Warning message"
        />
      );

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
    });

    it('shows clear button when dates are selected', () => {
      render(
        <DateRangePicker
          startDate="2025-01-20"
          endDate="2025-01-25"
          onDateChange={mockOnDateChange}
        />
      );

      const clearButton = screen.getByTitle('Auswahl löschen');
      expect(clearButton).toBeInTheDocument();
    });

    it('does not show clear button when no dates are selected', () => {
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      const clearButton = screen.queryByTitle('Auswahl löschen');
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('Calendar Interaction', () => {
    it('opens calendar when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      const input = screen.getByTestId('date-range-picker-button');
      await user.click(input);

      expect(screen.getByText('Januar 2025')).toBeInTheDocument();
      expect(screen.getByText('Heute')).toBeInTheDocument();
    });

    it('shows Monday as first day of week', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));

      const dayHeaders = screen.getAllByText(/^(Mo|Di|Mi|Do|Fr|Sa|So)$/);
      expect(dayHeaders[0]).toHaveTextContent('Mo');
      expect(dayHeaders[6]).toHaveTextContent('So');
    });

    it('highlights today with blue ring', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));

      const todayButton = screen.getByRole('button', { name: '15' });
      expect(todayButton).toHaveClass('ring-2', 'ring-blue-200');
    });

    it('navigates to today when "Heute" button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      
      // Navigate to different month first
      const nextButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('path[d*="M9 5l7 7-7 7"]')
      );
      await user.click(nextButton!);
      
      expect(screen.getByText('Februar 2025')).toBeInTheDocument();

      // Click "Heute" button
      const todayButton = screen.getByRole('button', { name: 'Heute' });
      await user.click(todayButton);

      expect(screen.getByText('Januar 2025')).toBeInTheDocument();
    });

    it('closes calendar when clicking outside', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <DateRangePicker onDateChange={mockOnDateChange} />
          <div data-testid="outside-element">Outside</div>
        </div>
      );

      // Open calendar
      await user.click(screen.getByTestId('date-range-picker-button'));
      expect(screen.getByText('Januar 2025')).toBeInTheDocument();

      // Click outside
      await user.click(screen.getByTestId('outside-element'));
      
      await waitFor(() => {
        expect(screen.queryByText('Januar 2025')).not.toBeInTheDocument();
      });
    });

    it('shows status legend in calendar', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      
      expect(screen.getByText('Vergangen')).toBeInTheDocument();
      expect(screen.getByText('Ausgebucht')).toBeInTheDocument();
      expect(screen.getByText('Ausgewählt')).toBeInTheDocument();
      expect(screen.getByText('Heute')).toBeInTheDocument();
    });
  });

  describe('Date Selection', () => {
    it('selects start date and calls onDateChange', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      await user.click(screen.getByRole('button', { name: '20' }));

      expect(mockOnDateChange).toHaveBeenCalledWith('2025-01-20', '');
    });

    it('selects end date after start date', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker
          startDate="2025-01-20"
          onDateChange={mockOnDateChange}
        />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      await user.click(screen.getByRole('button', { name: '25' }));

      expect(mockOnDateChange).toHaveBeenCalledWith('2025-01-20', '2025-01-25');
    });

    it('clears end date when selecting earlier start date', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker
          startDate="2025-01-25"
          endDate="2025-01-30"
          onDateChange={mockOnDateChange}
        />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      await user.click(screen.getByRole('button', { name: '20' }));

      expect(mockOnDateChange).toHaveBeenCalledWith('2025-01-20', '');
    });

    it('allows selecting today', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      await user.click(screen.getByRole('button', { name: '15' }));

      expect(mockOnDateChange).toHaveBeenCalledWith('2025-01-15', '');
    });

    it('disables dates in the past', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      
      const pastDateButton = screen.getByRole('button', { name: '10 ✗' });
      expect(pastDateButton).toBeDisabled();
      expect(pastDateButton).toHaveClass('bg-gray-100', 'text-gray-400', 'line-through', 'cursor-not-allowed');
    });

    it('shows visual indicators for past dates', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      
      const pastDateButton = screen.getByRole('button', { name: '10 ✗' });
      const indicator = pastDateButton.querySelector('span');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('✗');
    });
  });

  describe('Hover Functionality', () => {
    it('shows nights preview on hover when start date is selected', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker
          startDate="2025-01-20"
          onDateChange={mockOnDateChange}
        />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      
      const date25Button = screen.getByRole('button', { name: '25' });
      await user.hover(date25Button);

      expect(screen.getByText('5 Nächte - Klicken Sie um zu bestätigen')).toBeInTheDocument();
    });

    it('does not show hover preview when no start date selected', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      
      const date25Button = screen.getByRole('button', { name: '25' });
      await user.hover(date25Button);

      expect(screen.queryByText(/Nächte - Klicken Sie um zu bestätigen/)).not.toBeInTheDocument();
    });

    it('highlights range between start date and hover date', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker
          startDate="2025-01-20"
          onDateChange={mockOnDateChange}
        />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      
      const date25Button = screen.getByRole('button', { name: '25' });
      await user.hover(date25Button);

      // Check that dates in between have hover range styling
      const date22Button = screen.getByRole('button', { name: '22' });
      expect(date22Button).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });

  describe('Availability Integration', () => {
    it('shows available dates normally', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker
          onDateChange={mockOnDateChange}
          availability={mockAvailability}
        />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      
      const date20Button = screen.getByRole('button', { name: '20' });
      expect(date20Button).not.toBeDisabled();
      expect(date20Button).not.toHaveClass('bg-red-100');
    });
  });

  describe('Clear Functionality', () => {
    it('clears selection when clear button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker
          startDate="2025-01-20"
          endDate="2025-01-25"
          onDateChange={mockOnDateChange}
        />
      );

      const clearButton = screen.getByTitle('Auswahl löschen');
      await user.click(clearButton);

      expect(mockOnDateChange).toHaveBeenCalledWith('', '');
    });

    it('clears selection when clear button in calendar is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker
          startDate="2025-01-20"
          endDate="2025-01-25"
          onDateChange={mockOnDateChange}
        />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      
      const clearButton = screen.getByText('Löschen');
      await user.click(clearButton);

      expect(mockOnDateChange).toHaveBeenCalledWith('', '');
    });

    it('starts new selection when date is clicked after complete selection', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker
          startDate="2025-01-20"
          endDate="2025-01-25"
          onDateChange={mockOnDateChange}
        />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      await user.click(screen.getByRole('button', { name: '27' }));

      expect(mockOnDateChange).toHaveBeenCalledWith('2025-01-27', '');
    });
  });

  describe('Accessibility and Interaction', () => {
    it('has proper button role for main input', () => {
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows dropdown arrow with rotation on open', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      const dropdownArrow = screen.getByRole('button').querySelector('svg:last-child');
      expect(dropdownArrow).not.toHaveClass('rotate-180');

      await user.click(screen.getByTestId('date-range-picker-button'));
      
      expect(dropdownArrow).toHaveClass('rotate-180');
    });

    it('navigates to next month', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      
      const nextButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('path[d*="M9 5l7 7-7 7"]')
      );
      
      await user.click(nextButton!);
      
      expect(screen.getByText('Februar 2025')).toBeInTheDocument();
    });

    it('navigates to previous month', async () => {
      const user = userEvent.setup();
      
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      await user.click(screen.getByTestId('date-range-picker-button'));
      
      const prevButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('path[d*="M15 19l-7-7 7-7"]')
      );
      
      await user.click(prevButton!);
      
      expect(screen.getByText('Dezember 2024')).toBeInTheDocument();
    });
  });
});