import { render, screen, fireEvent } from '@testing-library/react';
import { TimeRange } from '../../../lib/types/api';
import TimeRangeFilter from '../TimeRangeFilter';

describe('TimeRangeFilter', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with correct label and options', () => {
    render(
      <TimeRangeFilter
        selectedTimeRange={TimeRange.Future}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByLabelText('Zeitraum:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    
    // Check all options are present
    expect(screen.getByDisplayValue('Aktuelle & Zukünftige')).toBeInTheDocument();
    expect(screen.getByText('Alle Buchungen')).toBeInTheDocument();
    expect(screen.getByText('Vergangene')).toBeInTheDocument();
    expect(screen.getByText('Letzte 30 Tage')).toBeInTheDocument();
    expect(screen.getByText('Letztes Jahr')).toBeInTheDocument();
  });

  it('displays the selected time range correctly', () => {
    render(
      <TimeRangeFilter
        selectedTimeRange={TimeRange.All}
        onChange={mockOnChange}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue(TimeRange.All.toString());
  });

  it('calls onChange when selection changes', () => {
    render(
      <TimeRangeFilter
        selectedTimeRange={TimeRange.Future}
        onChange={mockOnChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: TimeRange.All.toString() } });

    expect(mockOnChange).toHaveBeenCalledWith(TimeRange.All);
  });

  it('handles all time range options correctly', () => {
    const { rerender } = render(
      <TimeRangeFilter
        selectedTimeRange={TimeRange.Future}
        onChange={mockOnChange}
      />
    );

    const select = screen.getByRole('combobox');

    // Test each time range option
    const timeRangeTests = [
      { value: TimeRange.Future, expectedText: 'Aktuelle & Zukünftige' },
      { value: TimeRange.All, expectedText: 'Alle Buchungen' },
      { value: TimeRange.Past, expectedText: 'Vergangene' },
      { value: TimeRange.Last30Days, expectedText: 'Letzte 30 Tage' },
      { value: TimeRange.LastYear, expectedText: 'Letztes Jahr' },
    ];

    timeRangeTests.forEach(({ value, expectedText }) => {
      rerender(
        <TimeRangeFilter
          selectedTimeRange={value}
          onChange={mockOnChange}
        />
      );
      
      expect(screen.getByDisplayValue(expectedText)).toBeInTheDocument();
      expect(select).toHaveValue(value.toString());
    });
  });

  it('has correct styling classes', () => {
    render(
      <TimeRangeFilter
        selectedTimeRange={TimeRange.Future}
        onChange={mockOnChange}
      />
    );

    const container = screen.getByLabelText('Zeitraum:').closest('div');
    expect(container).toHaveClass('flex', 'items-center', 'space-x-2');

    const select = screen.getByRole('combobox');
    expect(select).toHaveClass(
      'block',
      'px-3',
      'py-1.5',
      'text-sm',
      'text-gray-900',
      'border',
      'border-gray-300',
      'rounded-lg',
      'bg-white',
      'focus:ring-2',
      'focus:ring-blue-500',
      'focus:border-blue-500'
    );
  });

  it('handles accessibility properly', () => {
    render(
      <TimeRangeFilter
        selectedTimeRange={TimeRange.Future}
        onChange={mockOnChange}
      />
    );

    const label = screen.getByText('Zeitraum:');
    const select = screen.getByRole('combobox');

    expect(label).toHaveAttribute('for', 'timeRange');
    expect(select).toHaveAttribute('id', 'timeRange');
  });
});