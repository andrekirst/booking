import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SleepingAccommodationForm from '../SleepingAccommodationForm';
import { SleepingAccommodation, AccommodationType } from '@/lib/types/sleeping-accommodation';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('SleepingAccommodationForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnToggleActive = jest.fn();

  const mockAccommodation: SleepingAccommodation = {
    id: '1',
    name: 'Test Room',
    type: AccommodationType.Room,
    maxCapacity: 4,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    changedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(
      <SleepingAccommodationForm
        onSubmit={mockOnSubmit}
        onToggleActive={mockOnToggleActive}
        isEdit={false}
      />
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Typ')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximale Kapazität')).toBeInTheDocument();
    expect(screen.getByText('Speichern')).toBeInTheDocument();
    expect(screen.getByText('Abbrechen')).toBeInTheDocument();
  });

  it('does not show status section when not in edit mode', () => {
    render(
      <SleepingAccommodationForm
        onSubmit={mockOnSubmit}
        onToggleActive={mockOnToggleActive}
        isEdit={false}
      />
    );

    expect(screen.queryByText('Status')).not.toBeInTheDocument();
  });

  it('shows status section with active accommodation in edit mode', () => {
    render(
      <SleepingAccommodationForm
        accommodation={mockAccommodation}
        onSubmit={mockOnSubmit}
        onToggleActive={mockOnToggleActive}
        isEdit={true}
      />
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Aktiv')).toBeInTheDocument();
    expect(screen.getByText('Deaktivieren')).toBeInTheDocument();
  });

  it('shows status section with inactive accommodation in edit mode', () => {
    const inactiveAccommodation = { ...mockAccommodation, isActive: false };
    
    render(
      <SleepingAccommodationForm
        accommodation={inactiveAccommodation}
        onSubmit={mockOnSubmit}
        onToggleActive={mockOnToggleActive}
        isEdit={true}
      />
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Inaktiv')).toBeInTheDocument();
    expect(screen.getByText('Aktivieren')).toBeInTheDocument();
  });

  it('calls onToggleActive when toggle button is clicked', async () => {
    render(
      <SleepingAccommodationForm
        accommodation={mockAccommodation}
        onSubmit={mockOnSubmit}
        onToggleActive={mockOnToggleActive}
        isEdit={true}
      />
    );

    const toggleButton = screen.getByText('Deaktivieren');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockOnToggleActive).toHaveBeenCalledWith('1', false);
    });
  });

  it('calls onSubmit with correct data when form is submitted', async () => {
    render(
      <SleepingAccommodationForm
        accommodation={mockAccommodation}
        onSubmit={mockOnSubmit}
        onToggleActive={mockOnToggleActive}
        isEdit={true}
      />
    );

    const nameInput = screen.getByLabelText('Name');
    const capacityInput = screen.getByLabelText('Maximale Kapazität');
    const submitButton = screen.getByText('Speichern');

    fireEvent.change(nameInput, { target: { value: 'Updated Room' } });
    fireEvent.change(capacityInput, { target: { value: '6' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Updated Room',
        type: AccommodationType.Room,
        maxCapacity: 6,
        isActive: true,
      });
    });
  });

  it('shows correct button styling for active accommodation', () => {
    render(
      <SleepingAccommodationForm
        accommodation={mockAccommodation}
        onSubmit={mockOnSubmit}
        onToggleActive={mockOnToggleActive}
        isEdit={true}
      />
    );

    const toggleButton = screen.getByText('Deaktivieren');
    expect(toggleButton).toHaveClass('text-red-700', 'bg-red-50', 'border-red-200');
  });

  it('shows correct button styling for inactive accommodation', () => {
    const inactiveAccommodation = { ...mockAccommodation, isActive: false };
    
    render(
      <SleepingAccommodationForm
        accommodation={inactiveAccommodation}
        onSubmit={mockOnSubmit}
        onToggleActive={mockOnToggleActive}
        isEdit={true}
      />
    );

    const toggleButton = screen.getByText('Aktivieren');
    expect(toggleButton).toHaveClass('text-green-700', 'bg-green-50', 'border-green-200');
  });

  it('handles form submission error correctly', async () => {
    mockOnSubmit.mockRejectedValue(new Error('Submit failed'));
    
    render(
      <SleepingAccommodationForm
        accommodation={mockAccommodation}
        onSubmit={mockOnSubmit}
        onToggleActive={mockOnToggleActive}
        isEdit={true}
      />
    );

    const submitButton = screen.getByText('Speichern');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Submit failed')).toBeInTheDocument();
    });
  });
});