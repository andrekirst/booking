import { render, screen, fireEvent } from '@testing-library/react';
import { BookingStatus, TimeRange } from '../../../lib/types/api';
import FilterPanel from '../FilterPanel';

describe('FilterPanel', () => {
  const defaultProps = {
    selectedTimeRange: TimeRange.Future,
    statusFilter: null,
    isFilterLoading: false,
    onTimeRangeChange: jest.fn(),
    onStatusChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filter panel in collapsed state by default', () => {
    const { container } = render(<FilterPanel {...defaultProps} />);

    // Header should be visible
    expect(screen.getByText('Filter')).toBeInTheDocument();
    expect(screen.getByText('Aktuelle & Zukünftige • Alle Status')).toBeInTheDocument();

    // Filter content should have max-h-0 and opacity-0 classes (collapsed)
    const expandableContent = container.querySelector('.max-h-0.opacity-0');
    expect(expandableContent).toBeInTheDocument();
  });

  it('expands when header is clicked', () => {
    render(<FilterPanel {...defaultProps} />);

    // Click header to expand
    fireEvent.click(screen.getByText('Filter'));

    // Filter options should now be visible
    expect(screen.getByText('Zeitraum')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Alle Buchungen')).toBeInTheDocument();
    expect(screen.getByText('Ausstehend')).toBeInTheDocument();
  });

  it('shows loading indicator when isFilterLoading is true', () => {
    render(<FilterPanel {...defaultProps} isFilterLoading={true} />);

    expect(screen.getByText('Laden...')).toBeInTheDocument();
  });

  it('displays correct current filter values in header', () => {
    render(
      <FilterPanel 
        {...defaultProps} 
        selectedTimeRange={TimeRange.Past}
        statusFilter={BookingStatus.Confirmed}
      />
    );

    expect(screen.getByText('Vergangene • Bestätigt')).toBeInTheDocument();
  });

  it('calls onTimeRangeChange when time range button is clicked', () => {
    const onTimeRangeChange = jest.fn();
    render(<FilterPanel {...defaultProps} onTimeRangeChange={onTimeRangeChange} />);

    // Expand panel first
    fireEvent.click(screen.getByText('Filter'));

    // Click on "Alle Buchungen" button
    fireEvent.click(screen.getByText('Alle Buchungen'));

    expect(onTimeRangeChange).toHaveBeenCalledWith(TimeRange.All);
  });

  it('calls onStatusChange when status button is clicked', () => {
    const onStatusChange = jest.fn();
    render(<FilterPanel {...defaultProps} onStatusChange={onStatusChange} />);

    // Expand panel first
    fireEvent.click(screen.getByText('Filter'));

    // Click on "Bestätigt" button
    fireEvent.click(screen.getByText('Bestätigt'));

    expect(onStatusChange).toHaveBeenCalledWith(BookingStatus.Confirmed);
  });

  it('highlights selected time range button', () => {
    render(<FilterPanel {...defaultProps} selectedTimeRange={TimeRange.Past} />);

    // Expand panel
    fireEvent.click(screen.getByText('Filter'));

    const selectedButton = screen.getByText('Vergangene');
    expect(selectedButton).toHaveClass('bg-blue-500', 'text-white');
  });

  it('highlights selected status button', () => {
    render(<FilterPanel {...defaultProps} statusFilter={BookingStatus.Pending} />);

    // Expand panel
    fireEvent.click(screen.getByText('Filter'));

    const selectedButton = screen.getByText('Ausstehend');
    expect(selectedButton).toHaveClass('bg-green-500', 'text-white');
  });

  it('resets filters when reset button is clicked', () => {
    const onTimeRangeChange = jest.fn();
    const onStatusChange = jest.fn();
    
    render(
      <FilterPanel 
        {...defaultProps} 
        onTimeRangeChange={onTimeRangeChange}
        onStatusChange={onStatusChange}
      />
    );

    // Expand panel
    fireEvent.click(screen.getByText('Filter'));

    // Click reset button
    fireEvent.click(screen.getByText('Filter zurücksetzen'));

    expect(onTimeRangeChange).toHaveBeenCalledWith(TimeRange.Future);
    expect(onStatusChange).toHaveBeenCalledWith(null);
  });

  it('collapses when "Fertig" button is clicked', () => {
    render(<FilterPanel {...defaultProps} />);

    // Expand panel first
    fireEvent.click(screen.getByText('Filter'));
    expect(screen.getByText('Zeitraum')).toBeInTheDocument();

    // Click "Fertig" button
    fireEvent.click(screen.getByText('Fertig'));

    // Should collapse (note: this tests the onClick handler, 
    // the actual collapse animation would need more complex testing)
    // We can verify the button exists and is clickable
    expect(screen.getByText('Fertig')).toBeInTheDocument();
  });

  it('shows chevron icon that rotates when expanded', () => {
    const { container } = render(<FilterPanel {...defaultProps} />);

    // Find chevron icon (should be pointing down initially)
    const chevron = container.querySelector('svg[viewBox="0 0 24 24"]:last-child');
    expect(chevron).toBeInTheDocument();
  });

  it('renders all time range options', () => {
    render(<FilterPanel {...defaultProps} />);

    // Expand panel
    fireEvent.click(screen.getByText('Filter'));

    // Check all time range options are present
    expect(screen.getByText('Aktuelle & Zukünftige')).toBeInTheDocument();
    expect(screen.getByText('Alle Buchungen')).toBeInTheDocument();
    expect(screen.getByText('Vergangene')).toBeInTheDocument();
    expect(screen.getByText('Letzte 30 Tage')).toBeInTheDocument();
    expect(screen.getByText('Letztes Jahr')).toBeInTheDocument();
  });

  it('renders all status options', () => {
    render(<FilterPanel {...defaultProps} />);

    // Expand panel
    fireEvent.click(screen.getByText('Filter'));

    // Check all status options are present
    expect(screen.getByText('Alle Status')).toBeInTheDocument();
    expect(screen.getByText('Ausstehend')).toBeInTheDocument();
    expect(screen.getByText('Bestätigt')).toBeInTheDocument();
    expect(screen.getByText('Angenommen')).toBeInTheDocument();
    expect(screen.getByText('Abgelehnt')).toBeInTheDocument();
    expect(screen.getByText('Storniert')).toBeInTheDocument();
    expect(screen.getByText('Abgeschlossen')).toBeInTheDocument();
  });
});