import { render, screen, fireEvent } from '@testing-library/react';
import SleepingAccommodationsTable from '../SleepingAccommodationsTable';
import { SleepingAccommodation, AccommodationType } from '@/lib/types/sleeping-accommodation';

describe('SleepingAccommodationsTable', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const mockAccommodations: SleepingAccommodation[] = [
    {
      id: '1',
      name: 'Schlafzimmer 1',
      type: AccommodationType.Room,
      maxCapacity: 4,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      changedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Zelt 1',
      type: AccommodationType.Tent,
      maxCapacity: 2,
      isActive: false,
      createdAt: '2024-01-01T00:00:00Z',
      changedAt: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no accommodations', () => {
    render(
      <SleepingAccommodationsTable
        accommodations={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Keine Schlafmöglichkeiten vorhanden.')).toBeInTheDocument();
  });

  it('renders table with accommodations', () => {
    render(
      <SleepingAccommodationsTable
        accommodations={mockAccommodations}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Schlafzimmer 1')).toBeInTheDocument();
    expect(screen.getByText('Zelt 1')).toBeInTheDocument();
    expect(screen.getByText('Raum')).toBeInTheDocument();
    expect(screen.getByText('Zelt')).toBeInTheDocument();
    expect(screen.getByText('4 Personen')).toBeInTheDocument();
    expect(screen.getByText('2 Personen')).toBeInTheDocument();
  });

  it('displays correct status for active and inactive accommodations', () => {
    render(
      <SleepingAccommodationsTable
        accommodations={mockAccommodations}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Aktiv')).toBeInTheDocument();
    expect(screen.getByText('Inaktiv')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <SleepingAccommodationsTable
        accommodations={mockAccommodations}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByText('Bearbeiten');
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith('1');
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <SleepingAccommodationsTable
        accommodations={mockAccommodations}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByText('Deaktivieren');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('does not show delete button for inactive accommodations', () => {
    render(
      <SleepingAccommodationsTable
        accommodations={mockAccommodations}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.queryAllByText('Deaktivieren');
    expect(deleteButtons).toHaveLength(1); // Only for active accommodation
  });

  it('applies opacity styling for inactive accommodations', () => {
    render(
      <SleepingAccommodationsTable
        accommodations={mockAccommodations}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const rows = screen.getAllByRole('row');
    // First row is header, second is active accommodation, third is inactive
    expect(rows[2]).toHaveClass('opacity-50');
    expect(rows[1]).not.toHaveClass('opacity-50');
  });

  it('displays correct accommodation type text', () => {
    const roomAccommodation: SleepingAccommodation = {
      id: '1',
      name: 'Test Room',
      type: AccommodationType.Room,
      maxCapacity: 2,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
    };

    const tentAccommodation: SleepingAccommodation = {
      id: '2',
      name: 'Test Tent',
      type: AccommodationType.Tent,
      maxCapacity: 2,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
    };

    render(
      <SleepingAccommodationsTable
        accommodations={[roomAccommodation, tentAccommodation]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Raum')).toBeInTheDocument();
    expect(screen.getByText('Zelt')).toBeInTheDocument();
  });

  it('has proper accessibility attributes for action buttons', () => {
    render(
      <SleepingAccommodationsTable
        accommodations={mockAccommodations}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check aria-label for edit button
    const editButton = screen.getByLabelText('Schlafzimmer 1 bearbeiten');
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveAttribute('title', 'Schlafzimmer 1 bearbeiten');

    // Check aria-label for delete button
    const deleteButton = screen.getByLabelText('Schlafzimmer 1 deaktivieren');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveAttribute('title', 'Schlafzimmer 1 deaktivieren');
  });

  it('has proper focus management for action buttons', () => {
    render(
      <SleepingAccommodationsTable
        accommodations={mockAccommodations}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByLabelText('Schlafzimmer 1 bearbeiten');
    const deleteButton = screen.getByLabelText('Schlafzimmer 1 deaktivieren');

    // Check that buttons can receive focus
    editButton.focus();
    expect(editButton).toHaveFocus();

    deleteButton.focus();
    expect(deleteButton).toHaveFocus();
  });

  it('has icons that are hidden from screen readers', () => {
    render(
      <SleepingAccommodationsTable
        accommodations={mockAccommodations}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check that SVG icons have aria-hidden="true"
    const svgIcons = document.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgIcons.length).toBeGreaterThan(0);
  });
});