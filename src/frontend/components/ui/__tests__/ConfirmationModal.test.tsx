import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmationModal from '../ConfirmationModal';

describe('ConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Test Title',
    message: 'Test message',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility', () => {
    it('should render when isOpen is true', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<ConfirmationModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  describe('Button Text Customization', () => {
    it('should show default button texts', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      expect(screen.getByText('Bestätigen')).toBeInTheDocument();
      expect(screen.getByText('Abbrechen')).toBeInTheDocument();
    });

    it('should show custom button texts', () => {
      render(
        <ConfirmationModal
          {...defaultProps}
          confirmText="Custom Confirm"
          cancelText="Custom Cancel"
        />
      );
      
      expect(screen.getByText('Custom Confirm')).toBeInTheDocument();
      expect(screen.getByText('Custom Cancel')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      const confirmButton = screen.getByText('Bestätigen');
      fireEvent.click(confirmButton);
      
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is clicked', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      const cancelButton = screen.getByText('Abbrechen');
      fireEvent.click(cancelButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      // Find backdrop by class (the overlay div)
      const backdrop = document.querySelector('.bg-gray-500.bg-opacity-75');
      expect(backdrop).toBeInTheDocument();
      
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Modal Types', () => {
    it('should show danger styling for danger type', () => {
      render(<ConfirmationModal {...defaultProps} type="danger" />);
      
      // Check for red icon container
      const iconContainer = document.querySelector('.bg-red-100');
      expect(iconContainer).toBeInTheDocument();
      
      // Check for red confirm button
      const confirmButton = screen.getByText('Bestätigen');
      expect(confirmButton).toHaveClass('bg-red-600');
    });

    it('should show info styling for info type', () => {
      render(<ConfirmationModal {...defaultProps} type="info" />);
      
      // Check for blue icon container
      const iconContainer = document.querySelector('.bg-blue-100');
      expect(iconContainer).toBeInTheDocument();
      
      // Check for blue confirm button
      const confirmButton = screen.getByText('Bestätigen');
      expect(confirmButton).toHaveClass('bg-blue-600');
    });

    it('should show warning styling for warning type (default)', () => {
      render(<ConfirmationModal {...defaultProps} type="warning" />);
      
      // Check for yellow icon container
      const iconContainer = document.querySelector('.bg-yellow-100');
      expect(iconContainer).toBeInTheDocument();
      
      // Check for yellow confirm button
      const confirmButton = screen.getByText('Bestätigen');
      expect(confirmButton).toHaveClass('bg-yellow-600');
    });

    it('should default to warning type when no type is specified', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      // Check for yellow icon container (default warning)
      const iconContainer = document.querySelector('.bg-yellow-100');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      const confirmButton = screen.getByRole('button', { name: 'Bestätigen' });
      const cancelButton = screen.getByRole('button', { name: 'Abbrechen' });
      
      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it('should focus be manageable with keyboard', () => {
      render(<ConfirmationModal {...defaultProps} />);
      
      const confirmButton = screen.getByText('Bestätigen');
      const cancelButton = screen.getByText('Abbrechen');
      
      // Both buttons should be focusable
      expect(confirmButton).toHaveAttribute('type', 'button');
      expect(cancelButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when modal opens', () => {
      const originalOverflow = document.body.style.overflow;
      
      render(<ConfirmationModal {...defaultProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
      
      // Cleanup
      document.body.style.overflow = originalOverflow;
    });

    it('should restore body scroll when modal closes', () => {
      const originalOverflow = document.body.style.overflow;
      
      const { rerender } = render(<ConfirmationModal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<ConfirmationModal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('unset');
      
      // Cleanup
      document.body.style.overflow = originalOverflow;
    });
  });
});