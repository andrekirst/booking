import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookingActionMenu from '../BookingActionMenu';
import { Booking, BookingStatus } from '../../../../lib/types/api';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('BookingActionMenu', () => {
  const mockOnCancel = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnAccept = jest.fn();
  const mockOnReject = jest.fn();

  const baseBooking: Booking = {
    id: '123',
    userId: 1,
    userName: 'Test User',
    userEmail: 'test@example.com',
    status: BookingStatus.Pending,
    startDate: '2024-01-01',
    endDate: '2024-01-05',
    bookingItems: [],
    notes: '',
    totalPersons: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Admin Role Detection', () => {
    it('should show accept/reject buttons for admin users with pending bookings', async () => {
      // Mock admin JWT token
      const adminToken = btoa(JSON.stringify({ header: {} })) + '.' + 
        btoa(JSON.stringify({ 
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Administrator' 
        })) + '.' + 
        btoa('signature');
      
      mockLocalStorage.getItem.mockReturnValue(adminToken);

      render(
        <BookingActionMenu
          booking={baseBooking}
          onCancel={mockOnCancel}
          onEdit={mockOnEdit}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Annehmen')).toBeInTheDocument();
        expect(screen.getByText('Ablehnen')).toBeInTheDocument();
      });
    });

    it('should not show accept/reject buttons for non-admin users', async () => {
      // Mock regular user JWT token
      const userToken = btoa(JSON.stringify({ header: {} })) + '.' + 
        btoa(JSON.stringify({ role: 'Member' })) + '.' + 
        btoa('signature');
      
      mockLocalStorage.getItem.mockReturnValue(userToken);

      render(
        <BookingActionMenu
          booking={baseBooking}
          onCancel={mockOnCancel}
          onEdit={mockOnEdit}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Annehmen')).not.toBeInTheDocument();
        expect(screen.queryByText('Ablehnen')).not.toBeInTheDocument();
      });
    });

    it('should not show accept/reject buttons when no token is present', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <BookingActionMenu
          booking={baseBooking}
          onCancel={mockOnCancel}
          onEdit={mockOnEdit}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Annehmen')).not.toBeInTheDocument();
        expect(screen.queryByText('Ablehnen')).not.toBeInTheDocument();
      });
    });
  });

  describe('Button Visibility Based on Status', () => {
    it('should show accept/reject buttons only for pending bookings', async () => {
      const adminToken = btoa(JSON.stringify({ header: {} })) + '.' + 
        btoa(JSON.stringify({ role: 'Administrator' })) + '.' + 
        btoa('signature');
      
      mockLocalStorage.getItem.mockReturnValue(adminToken);

      const { rerender } = render(
        <BookingActionMenu
          booking={baseBooking}
          onCancel={mockOnCancel}
          onEdit={mockOnEdit}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      // Should show for Pending
      await waitFor(() => {
        expect(screen.getByText('Annehmen')).toBeInTheDocument();
        expect(screen.getByText('Ablehnen')).toBeInTheDocument();
      });

      // Should not show for Accepted
      rerender(
        <BookingActionMenu
          booking={{ ...baseBooking, status: BookingStatus.Accepted }}
          onCancel={mockOnCancel}
          onEdit={mockOnEdit}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      expect(screen.queryByText('Annehmen')).not.toBeInTheDocument();
      expect(screen.queryByText('Ablehnen')).not.toBeInTheDocument();
    });

    it('should disable edit button for cancelled/accepted/rejected bookings', () => {
      render(
        <BookingActionMenu
          booking={{ ...baseBooking, status: BookingStatus.Cancelled }}
          onCancel={mockOnCancel}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByText('Bearbeiten').closest('button');
      expect(editButton).toBeDisabled();
    });

    it('should not show cancel button for cancelled/accepted/rejected bookings', () => {
      render(
        <BookingActionMenu
          booking={{ ...baseBooking, status: BookingStatus.Cancelled }}
          onCancel={mockOnCancel}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByText('Stornieren')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      window.confirm = jest.fn(() => true);
    });

    it('should call onAccept when accept button is clicked and confirmed', async () => {
      const adminToken = btoa(JSON.stringify({ header: {} })) + '.' + 
        btoa(JSON.stringify({ role: 'Administrator' })) + '.' + 
        btoa('signature');
      
      mockLocalStorage.getItem.mockReturnValue(adminToken);

      render(
        <BookingActionMenu
          booking={baseBooking}
          onCancel={mockOnCancel}
          onEdit={mockOnEdit}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      await waitFor(() => {
        const acceptButton = screen.getByText('Annehmen');
        fireEvent.click(acceptButton);
      });

      expect(window.confirm).toHaveBeenCalledWith('Möchten Sie diese Buchung wirklich annehmen?');
      expect(mockOnAccept).toHaveBeenCalled();
    });

    it('should call onReject when reject button is clicked and confirmed', async () => {
      const adminToken = btoa(JSON.stringify({ header: {} })) + '.' + 
        btoa(JSON.stringify({ role: 'Administrator' })) + '.' + 
        btoa('signature');
      
      mockLocalStorage.getItem.mockReturnValue(adminToken);

      render(
        <BookingActionMenu
          booking={baseBooking}
          onCancel={mockOnCancel}
          onEdit={mockOnEdit}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      await waitFor(() => {
        const rejectButton = screen.getByText('Ablehnen');
        fireEvent.click(rejectButton);
      });

      expect(window.confirm).toHaveBeenCalledWith('Möchten Sie diese Buchung wirklich ablehnen?');
      expect(mockOnReject).toHaveBeenCalled();
    });

    it('should not call onAccept when confirmation is cancelled', async () => {
      window.confirm = jest.fn(() => false);
      
      const adminToken = btoa(JSON.stringify({ header: {} })) + '.' + 
        btoa(JSON.stringify({ role: 'Administrator' })) + '.' + 
        btoa('signature');
      
      mockLocalStorage.getItem.mockReturnValue(adminToken);

      render(
        <BookingActionMenu
          booking={baseBooking}
          onCancel={mockOnCancel}
          onEdit={mockOnEdit}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      await waitFor(() => {
        const acceptButton = screen.getByText('Annehmen');
        fireEvent.click(acceptButton);
      });

      expect(mockOnAccept).not.toHaveBeenCalled();
    });

    it('should call onCancel when cancel button is clicked and confirmed', () => {
      render(
        <BookingActionMenu
          booking={baseBooking}
          onCancel={mockOnCancel}
          onEdit={mockOnEdit}
        />
      );

      const cancelButton = screen.getByText('Stornieren');
      fireEvent.click(cancelButton);

      expect(window.confirm).toHaveBeenCalledWith('Möchten Sie diese Buchung wirklich stornieren?');
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should call onEdit when edit button is clicked', () => {
      render(
        <BookingActionMenu
          booking={baseBooking}
          onCancel={mockOnCancel}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByText('Bearbeiten');
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JWT token gracefully', async () => {
      const invalidToken = 'invalid.token.format';
      mockLocalStorage.getItem.mockReturnValue(invalidToken);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <BookingActionMenu
          booking={baseBooking}
          onCancel={mockOnCancel}
          onEdit={mockOnEdit}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error parsing JWT token:',
          expect.any(Error)
        );
        expect(screen.queryByText('Annehmen')).not.toBeInTheDocument();
        expect(screen.queryByText('Ablehnen')).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });
});