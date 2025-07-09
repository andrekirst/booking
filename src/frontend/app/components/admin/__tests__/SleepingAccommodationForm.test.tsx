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
        isEdit={false}
      />
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByText('Typ')).toBeInTheDocument();
    expect(screen.getByLabelText('Raum')).toBeInTheDocument();
    expect(screen.getByLabelText('Zelt')).toBeInTheDocument();
    expect(screen.getByText('Maximale Kapazität')).toBeInTheDocument();
    expect(screen.getByText('Speichern')).toBeInTheDocument();
    expect(screen.getByText('Abbrechen')).toBeInTheDocument();
  });

  it('does not show status section when not in edit mode', () => {
    render(
      <SleepingAccommodationForm
        onSubmit={mockOnSubmit}
        isEdit={false}
      />
    );

    // Status handling is now moved to parent component
    expect(screen.queryByText('Status')).not.toBeInTheDocument();
  });


  it('calls onSubmit with correct data when form is submitted', async () => {
    render(
      <SleepingAccommodationForm
        accommodation={mockAccommodation}
        onSubmit={mockOnSubmit}
        isEdit={true}
      />
    );

    const nameInput = screen.getByLabelText('Name');
    const tentRadio = screen.getByLabelText('Zelt');
    const incrementButton = screen.getByLabelText('Erhöhen');
    const submitButton = screen.getByText('Speichern');

    fireEvent.change(nameInput, { target: { value: 'Updated Room' } });
    fireEvent.click(tentRadio);
    fireEvent.click(incrementButton); // Increase capacity from 4 to 5
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Updated Room',
        type: AccommodationType.Tent,
        maxCapacity: 5,
        isActive: true,
      });
    });
  });


  it('handles form submission error correctly', async () => {
    mockOnSubmit.mockRejectedValue(new Error('Submit failed'));
    
    render(
      <SleepingAccommodationForm
        accommodation={mockAccommodation}
        onSubmit={mockOnSubmit}
        isEdit={true}
      />
    );

    const submitButton = screen.getByText('Speichern');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Submit failed')).toBeInTheDocument();
    });
  });

  it('uses radio buttons for type selection', () => {
    render(
      <SleepingAccommodationForm
        accommodation={mockAccommodation}
        onSubmit={mockOnSubmit}
        isEdit={true}
      />
    );

    const roomRadio = screen.getByLabelText('Raum');
    const tentRadio = screen.getByLabelText('Zelt');

    expect(roomRadio).toHaveAttribute('type', 'radio');
    expect(tentRadio).toHaveAttribute('type', 'radio');
    expect(roomRadio).toBeChecked(); // Room is default
    expect(tentRadio).not.toBeChecked();

    // Test changing selection
    fireEvent.click(tentRadio);
    expect(tentRadio).toBeChecked();
    expect(roomRadio).not.toBeChecked();
  });

  it('uses NumberSpinner for capacity input', () => {
    render(
      <SleepingAccommodationForm
        accommodation={mockAccommodation}
        onSubmit={mockOnSubmit}
        isEdit={true}
      />
    );

    // Check if NumberSpinner is rendered (by checking for increment/decrement buttons)
    expect(screen.getByLabelText('Erhöhen')).toBeInTheDocument();
    expect(screen.getByLabelText('Verringern')).toBeInTheDocument();
    
    // Test that capacity value is displayed
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
    
    // Test increment functionality
    const incrementButton = screen.getByLabelText('Erhöhen');
    fireEvent.click(incrementButton);
    
    // The NumberSpinner should handle the increment internally
    // We don't test the final value change here as it's tested in NumberSpinner tests
  });
});