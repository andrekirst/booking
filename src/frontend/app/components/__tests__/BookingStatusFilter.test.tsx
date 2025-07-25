import { render, screen, fireEvent } from '@testing-library/react';
import { BookingStatus } from '../../../lib/types/api';
import BookingStatusFilter from '../BookingStatusFilter';

describe('BookingStatusFilter', () => {
  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    mockOnStatusChange.mockClear();
  });

  it('renders all filter options', () => {
    render(
      <BookingStatusFilter
        currentStatus={null}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Nach Status filtern')).toBeInTheDocument();
    expect(screen.getByText('Alle Buchungen')).toBeInTheDocument();
    expect(screen.getByText('Ausstehend')).toBeInTheDocument();
    expect(screen.getByText('Angenommen')).toBeInTheDocument();
    expect(screen.getByText('Abgelehnt')).toBeInTheDocument();
    expect(screen.getByText('Bestätigt')).toBeInTheDocument();
    expect(screen.getByText('Storniert')).toBeInTheDocument();
    expect(screen.getByText('Abgeschlossen')).toBeInTheDocument();
  });

  it('highlights the currently selected filter', () => {
    render(
      <BookingStatusFilter
        currentStatus={BookingStatus.Pending}
        onStatusChange={mockOnStatusChange}
      />
    );

    const pendingButton = screen.getByText('Ausstehend').closest('button');
    expect(pendingButton).toHaveClass('ring-2');
    expect(pendingButton).toHaveClass('scale-105');
  });

  it('calls onStatusChange when filter option is clicked', () => {
    render(
      <BookingStatusFilter
        currentStatus={null}
        onStatusChange={mockOnStatusChange}
      />
    );

    fireEvent.click(screen.getByText('Ausstehend'));
    expect(mockOnStatusChange).toHaveBeenCalledWith(BookingStatus.Pending);
  });

  it('calls onStatusChange with null when "Alle Buchungen" is clicked', () => {
    render(
      <BookingStatusFilter
        currentStatus={BookingStatus.Pending}
        onStatusChange={mockOnStatusChange}
      />
    );

    fireEvent.click(screen.getByText('Alle Buchungen'));
    expect(mockOnStatusChange).toHaveBeenCalledWith(null);
  });

  it('shows reset filter button when a filter is active', () => {
    render(
      <BookingStatusFilter
        currentStatus={BookingStatus.Accepted}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Filter zurücksetzen')).toBeInTheDocument();
  });

  it('does not show reset filter button when no filter is active', () => {
    render(
      <BookingStatusFilter
        currentStatus={null}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.queryByText('Filter zurücksetzen')).not.toBeInTheDocument();
  });

  it('calls onStatusChange with null when reset filter is clicked', () => {
    render(
      <BookingStatusFilter
        currentStatus={BookingStatus.Rejected}
        onStatusChange={mockOnStatusChange}
      />
    );

    fireEvent.click(screen.getByText('Filter zurücksetzen'));
    expect(mockOnStatusChange).toHaveBeenCalledWith(null);
  });

  it('applies correct styling for different filter states', () => {
    const { rerender } = render(
      <BookingStatusFilter
        currentStatus={null}
        onStatusChange={mockOnStatusChange}
      />
    );

    // All filter buttons should have opacity-70 when not selected
    const allButton = screen.getByText('Alle Buchungen').closest('button');
    expect(allButton).toHaveClass('opacity-70');

    // Rerender with Pending selected
    rerender(
      <BookingStatusFilter
        currentStatus={BookingStatus.Pending}
        onStatusChange={mockOnStatusChange}
      />
    );

    const pendingButton = screen.getByText('Ausstehend').closest('button');
    expect(pendingButton).toHaveClass('ring-2');
    expect(pendingButton).toHaveClass('scale-105');
    expect(pendingButton).not.toHaveClass('opacity-70');
  });

  it('renders correct icons for each filter option', () => {
    render(
      <BookingStatusFilter
        currentStatus={null}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Check that each button contains an SVG icon
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('handles all booking status types correctly', () => {
    const statusValues = [
      BookingStatus.Pending,
      BookingStatus.Accepted,
      BookingStatus.Rejected,
      BookingStatus.Confirmed,
      BookingStatus.Cancelled,
      BookingStatus.Completed
    ];

    statusValues.forEach(status => {
      const { rerender } = render(
        <BookingStatusFilter
          currentStatus={status}
          onStatusChange={mockOnStatusChange}
        />
      );

      // Should show reset button for any selected status
      expect(screen.getByText('Filter zurücksetzen')).toBeInTheDocument();

      // Clean up for next iteration
      rerender(<div />);
    });
  });
});