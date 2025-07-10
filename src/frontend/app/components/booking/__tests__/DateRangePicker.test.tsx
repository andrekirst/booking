import { render, screen, fireEvent } from '@testing-library/react';
import DateRangePicker from '../DateRangePicker';

describe('DateRangePicker', () => {
  const mockOnDateChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders start and end date inputs', () => {
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      expect(screen.getByLabelText(/anreise/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/abreise/i)).toBeInTheDocument();
    });

    it('renders with initial values', () => {
      render(
        <DateRangePicker
          startDate="2024-07-15"
          endDate="2024-07-17"
          onDateChange={mockOnDateChange}
        />
      );

      const startInput = screen.getByLabelText(/anreise/i) as HTMLInputElement;
      const endInput = screen.getByLabelText(/abreise/i) as HTMLInputElement;

      expect(startInput.value).toBe('2024-07-15');
      expect(endInput.value).toBe('2024-07-17');
    });

    it('displays night count when both dates are selected', () => {
      render(
        <DateRangePicker
          startDate="2024-07-15"
          endDate="2024-07-17"
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.getByText(/2 nächte/i)).toBeInTheDocument();
    });

    it('displays singular form for one night', () => {
      render(
        <DateRangePicker
          startDate="2024-07-15"
          endDate="2024-07-16"
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.getByText(/1 nacht/i)).toBeInTheDocument();
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
  });

  describe('Date Input Behavior', () => {
    it('calls onDateChange when start date changes', () => {
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      const startInput = screen.getByLabelText(/anreise/i);
      fireEvent.change(startInput, { target: { value: '2024-07-15' } });

      expect(mockOnDateChange).toHaveBeenCalledWith('2024-07-15', '');
    });

    it('calls onDateChange when end date changes', () => {
      render(
        <DateRangePicker
          startDate="2024-07-15"
          onDateChange={mockOnDateChange}
        />
      );

      const endInput = screen.getByLabelText(/abreise/i);
      fireEvent.change(endInput, { target: { value: '2024-07-17' } });

      expect(mockOnDateChange).toHaveBeenCalledWith('2024-07-15', '2024-07-17');
    });

    it('clears end date when start date is set to after end date', () => {
      render(
        <DateRangePicker
          startDate="2024-07-15"
          endDate="2024-07-17"
          onDateChange={mockOnDateChange}
        />
      );

      const startInput = screen.getByLabelText(/anreise/i);
      fireEvent.change(startInput, { target: { value: '2024-07-18' } });

      expect(mockOnDateChange).toHaveBeenCalledWith('2024-07-18', '');
    });

    it('disables end date input when no start date is selected', () => {
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      const endInput = screen.getByLabelText(/abreise/i);
      expect(endInput).toBeDisabled();
    });

    it('enables end date input when start date is selected', () => {
      render(
        <DateRangePicker
          startDate="2024-07-15"
          onDateChange={mockOnDateChange}
        />
      );

      const endInput = screen.getByLabelText(/abreise/i);
      expect(endInput).not.toBeDisabled();
    });
  });

  describe('Date Validation', () => {
    it('sets minimum date to today by default', () => {
      const today = new Date().toISOString().split('T')[0];
      
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      const startInput = screen.getByLabelText(/anreise/i) as HTMLInputElement;
      expect(startInput.min).toBe(today);
    });

    it('uses custom minimum date when provided', () => {
      const customMinDate = '2024-07-01';
      
      render(
        <DateRangePicker
          onDateChange={mockOnDateChange}
          minDate={customMinDate}
        />
      );

      const startInput = screen.getByLabelText(/anreise/i) as HTMLInputElement;
      expect(startInput.min).toBe(customMinDate);
    });

    it('sets end date minimum to one day after start date', () => {
      render(
        <DateRangePicker
          startDate="2024-07-15"
          onDateChange={mockOnDateChange}
        />
      );

      const endInput = screen.getByLabelText(/abreise/i) as HTMLInputElement;
      expect(endInput.min).toBe('2024-07-16');
    });

    it('applies maximum date when provided', () => {
      const maxDate = '2024-12-31';
      
      render(
        <DateRangePicker
          onDateChange={mockOnDateChange}
          maxDate={maxDate}
        />
      );

      const startInput = screen.getByLabelText(/anreise/i) as HTMLInputElement;
      const endInput = screen.getByLabelText(/abreise/i) as HTMLInputElement;
      
      expect(startInput.max).toBe(maxDate);
      expect(endInput.max).toBe(maxDate);
    });
  });

  describe('Error States', () => {
    it('applies error styles when error is provided', () => {
      render(
        <DateRangePicker
          onDateChange={mockOnDateChange}
          error="Test error"
        />
      );

      const startInput = screen.getByLabelText(/anreise/i);
      const endInput = screen.getByLabelText(/abreise/i);

      expect(startInput).toHaveClass('border-red-300');
      expect(endInput).toHaveClass('border-red-300');
    });

    it('applies normal styles when no error', () => {
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      const startInput = screen.getByLabelText(/anreise/i);
      const endInput = screen.getByLabelText(/abreise/i);

      expect(startInput).toHaveClass('border-gray-300');
      expect(endInput).toHaveClass('border-gray-300');
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for screen readers', () => {
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      expect(screen.getByLabelText(/anreise/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/abreise/i)).toBeInTheDocument();
    });

    it('marks inputs as required', () => {
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      const startInput = screen.getByLabelText(/anreise/i);
      const endInput = screen.getByLabelText(/abreise/i);

      expect(startInput).toBeRequired();
      expect(endInput).toBeRequired();
    });

    it('has proper input type for date inputs', () => {
      render(
        <DateRangePicker onDateChange={mockOnDateChange} />
      );

      const startInput = screen.getByLabelText(/anreise/i);
      const endInput = screen.getByLabelText(/abreise/i);

      expect(startInput).toHaveAttribute('type', 'date');
      expect(endInput).toHaveAttribute('type', 'date');
    });
  });
});