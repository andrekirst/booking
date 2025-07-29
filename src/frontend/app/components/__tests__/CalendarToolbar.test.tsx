import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarToolbar from '../CalendarToolbar';

describe('CalendarToolbar', () => {
  const defaultProps = {
    label: 'Juli 2025',
    onNavigate: jest.fn(),
    onView: jest.fn(),
    view: 'month'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render all navigation buttons', () => {
      render(<CalendarToolbar {...defaultProps} />);

      expect(screen.getByLabelText('Vorheriger Zeitraum')).toBeInTheDocument();
      expect(screen.getByLabelText('Nächster Zeitraum')).toBeInTheDocument();
      expect(screen.getByText('Heute')).toBeInTheDocument();
    });

    it('should display the provided label', () => {
      render(<CalendarToolbar {...defaultProps} />);
      
      expect(screen.getByText('Juli 2025')).toBeInTheDocument();
    });

    it('should render all view buttons', () => {
      render(<CalendarToolbar {...defaultProps} />);

      expect(screen.getByText('Monat')).toBeInTheDocument();
      expect(screen.getByText('Woche')).toBeInTheDocument();
      expect(screen.getByText('Tag')).toBeInTheDocument();
    });

    it('should highlight the active view', () => {
      render(<CalendarToolbar {...defaultProps} view="month" />);

      const monthButton = screen.getByText('Monat');
      const weekButton = screen.getByText('Woche');
      const dayButton = screen.getByText('Tag');

      expect(monthButton).toHaveClass('bg-blue-100', 'text-blue-700');
      expect(weekButton).not.toHaveClass('bg-blue-100', 'text-blue-700');
      expect(dayButton).not.toHaveClass('bg-blue-100', 'text-blue-700');
    });

    it('should highlight week view when active', () => {
      render(<CalendarToolbar {...defaultProps} view="week" />);

      const monthButton = screen.getByText('Monat');
      const weekButton = screen.getByText('Woche');
      const dayButton = screen.getByText('Tag');

      expect(monthButton).not.toHaveClass('bg-blue-100', 'text-blue-700');
      expect(weekButton).toHaveClass('bg-blue-100', 'text-blue-700');
      expect(dayButton).not.toHaveClass('bg-blue-100', 'text-blue-700');
    });

    it('should highlight day view when active', () => {
      render(<CalendarToolbar {...defaultProps} view="day" />);

      const monthButton = screen.getByText('Monat');
      const weekButton = screen.getByText('Woche');
      const dayButton = screen.getByText('Tag');

      expect(monthButton).not.toHaveClass('bg-blue-100', 'text-blue-700');
      expect(weekButton).not.toHaveClass('bg-blue-100', 'text-blue-700');
      expect(dayButton).toHaveClass('bg-blue-100', 'text-blue-700');
    });
  });

  describe('Navigation Functionality', () => {
    let user: any;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('should call onNavigate with PREV when previous button is clicked', async () => {
      const mockOnNavigate = jest.fn();
      
      render(
        <CalendarToolbar 
          {...defaultProps} 
          onNavigate={mockOnNavigate} 
        />
      );

      const prevButton = screen.getByLabelText('Vorheriger Zeitraum');
      await user.click(prevButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('PREV');
      expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    });

    it('should call onNavigate with NEXT when next button is clicked', async () => {
      const mockOnNavigate = jest.fn();
      
      render(
        <CalendarToolbar 
          {...defaultProps} 
          onNavigate={mockOnNavigate} 
        />
      );

      const nextButton = screen.getByLabelText('Nächster Zeitraum');
      await user.click(nextButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('NEXT');
      expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    });

    it('should call onNavigate with TODAY when today button is clicked', async () => {
      const mockOnNavigate = jest.fn();
      
      render(
        <CalendarToolbar 
          {...defaultProps} 
          onNavigate={mockOnNavigate} 
        />
      );

      const todayButton = screen.getByText('Heute');
      await user.click(todayButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('TODAY');
      expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    });

    it('should call onView with month when month button is clicked', async () => {
      const mockOnView = jest.fn();
      
      render(
        <CalendarToolbar 
          {...defaultProps} 
          onView={mockOnView}
          view="week" // Start with week view
        />
      );

      const monthButton = screen.getByText('Monat');
      await user.click(monthButton);

      expect(mockOnView).toHaveBeenCalledWith('month');
      expect(mockOnView).toHaveBeenCalledTimes(1);
    });

    it('should call onView with week when week button is clicked', async () => {
      const mockOnView = jest.fn();
      
      render(
        <CalendarToolbar 
          {...defaultProps} 
          onView={mockOnView}
          view="month" // Start with month view
        />
      );

      const weekButton = screen.getByText('Woche');
      await user.click(weekButton);

      expect(mockOnView).toHaveBeenCalledWith('week');
      expect(mockOnView).toHaveBeenCalledTimes(1);
    });

    it('should call onView with day when day button is clicked', async () => {
      const mockOnView = jest.fn();
      
      render(
        <CalendarToolbar 
          {...defaultProps} 
          onView={mockOnView}
          view="month" // Start with month view
        />
      );

      const dayButton = screen.getByText('Tag');
      await user.click(dayButton);

      expect(mockOnView).toHaveBeenCalledWith('day');
      expect(mockOnView).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Design', () => {
    it('should render with responsive classes', () => {
      const { container } = render(<CalendarToolbar {...defaultProps} />);

      const toolbar = container.firstChild as HTMLElement;
      expect(toolbar).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'sm:items-center', 'sm:justify-between');
    });

    it('should render navigation buttons with proper spacing', () => {
      render(<CalendarToolbar {...defaultProps} />);

      const navContainer = screen.getByLabelText('Vorheriger Zeitraum').parentElement;
      expect(navContainer).toHaveClass('flex', 'items-center', 'space-x-2');
    });

    it('should render view buttons with proper styling', () => {
      render(<CalendarToolbar {...defaultProps} />);

      const viewButtonsContainer = screen.getByText('Monat').parentElement;
      expect(viewButtonsContainer).toHaveClass(
        'flex', 
        'items-center', 
        'space-x-1', 
        'bg-white', 
        'border', 
        'border-gray-300', 
        'rounded-lg', 
        'p-1'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for navigation buttons', () => {
      render(<CalendarToolbar {...defaultProps} />);

      expect(screen.getByLabelText('Vorheriger Zeitraum')).toBeInTheDocument();
      expect(screen.getByLabelText('Nächster Zeitraum')).toBeInTheDocument();
    });

    it('should have focusable navigation buttons', () => {
      render(<CalendarToolbar {...defaultProps} />);

      const prevButton = screen.getByLabelText('Vorheriger Zeitraum');
      const nextButton = screen.getByLabelText('Nächster Zeitraum');
      const todayButton = screen.getByText('Heute');

      // Buttons should be button elements (default type)
      expect(prevButton.tagName).toBe('BUTTON');
      expect(nextButton.tagName).toBe('BUTTON');
      expect(todayButton.tagName).toBe('BUTTON');
    });

    it('should have focusable view buttons', () => {
      render(<CalendarToolbar {...defaultProps} />);

      const monthButton = screen.getByText('Monat');
      const weekButton = screen.getByText('Woche');
      const dayButton = screen.getByText('Tag');

      // Buttons should be button elements (default type)
      expect(monthButton.tagName).toBe('BUTTON');
      expect(weekButton.tagName).toBe('BUTTON');
      expect(dayButton.tagName).toBe('BUTTON');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<CalendarToolbar {...defaultProps} />);

      const prevButton = screen.getByLabelText('Vorheriger Zeitraum');
      
      // Focus the first button
      prevButton.focus();
      expect(prevButton).toHaveFocus();

      // Tab through buttons
      await user.tab();
      expect(screen.getByText('Heute')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Nächster Zeitraum')).toHaveFocus();
    });
  });

  describe('Visual States', () => {
    it('should show hover states on navigation buttons', () => {
      render(<CalendarToolbar {...defaultProps} />);

      const prevButton = screen.getByLabelText('Vorheriger Zeitraum');
      const nextButton = screen.getByLabelText('Nächster Zeitraum');
      const todayButton = screen.getByText('Heute');

      expect(prevButton).toHaveClass('hover:bg-gray-50');
      expect(nextButton).toHaveClass('hover:bg-gray-50');
      expect(todayButton).toHaveClass('hover:bg-gray-50');
    });

    it('should show hover states on view buttons', () => {
      render(<CalendarToolbar {...defaultProps} view="week" />);

      const monthButton = screen.getByText('Monat');
      const dayButton = screen.getByText('Tag');

      // Inactive buttons should have hover styles
      expect(monthButton).toHaveClass('hover:text-black', 'hover:bg-gray-50');
      expect(dayButton).toHaveClass('hover:text-black', 'hover:bg-gray-50');
    });

    it('should show transition effects', () => {
      render(<CalendarToolbar {...defaultProps} />);

      const prevButton = screen.getByLabelText('Vorheriger Zeitraum');
      const monthButton = screen.getByText('Monat');

      expect(prevButton).toHaveClass('transition-colors');
      expect(monthButton).toHaveClass('transition-colors');
    });
  });

  describe('Icon Rendering', () => {
    it('should render previous arrow icon', () => {
      render(<CalendarToolbar {...defaultProps} />);

      const prevButton = screen.getByLabelText('Vorheriger Zeitraum');
      const svg = prevButton.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-4', 'h-4');
    });

    it('should render next arrow icon', () => {
      render(<CalendarToolbar {...defaultProps} />);

      const nextButton = screen.getByLabelText('Nächster Zeitraum');
      const svg = nextButton.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-4', 'h-4');
    });

    it('should render SVG paths correctly', () => {
      render(<CalendarToolbar {...defaultProps} />);

      const prevButton = screen.getByLabelText('Vorheriger Zeitraum');
      const nextButton = screen.getByLabelText('Nächster Zeitraum');

      const prevPath = prevButton.querySelector('path');
      const nextPath = nextButton.querySelector('path');

      expect(prevPath).toHaveAttribute('d', 'M15 19l-7-7 7-7');
      expect(nextPath).toHaveAttribute('d', 'M9 5l7 7-7 7');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty label', () => {
      render(<CalendarToolbar {...defaultProps} label="" />);
      
      // Should still render the toolbar structure
      expect(screen.getByText('Heute')).toBeInTheDocument();
    });

    it('should handle unknown view value', () => {
      render(<CalendarToolbar {...defaultProps} view="unknown" />);

      // Should not crash and still render all buttons
      expect(screen.getByText('Monat')).toBeInTheDocument();
      expect(screen.getByText('Woche')).toBeInTheDocument();
      expect(screen.getByText('Tag')).toBeInTheDocument();
    });

    it('should handle multiple rapid clicks', async () => {
      const mockOnNavigate = jest.fn();
      const user = userEvent.setup();
      
      render(<CalendarToolbar {...defaultProps} onNavigate={mockOnNavigate} />);

      const todayButton = screen.getByText('Heute');
      
      // Rapidly click multiple times
      await user.click(todayButton);
      await user.click(todayButton);
      await user.click(todayButton);

      expect(mockOnNavigate).toHaveBeenCalledTimes(3);
      expect(mockOnNavigate).toHaveBeenCalledWith('TODAY');
    });

    it('should handle different label formats', () => {
      const labels = [
        'Januar 2025',
        '01.01. - 07.01.2025',
        'Montag, 01.01.2025',
        'Very Long Month Name That Might Overflow 2025'
      ];

      labels.forEach(label => {
        const { unmount } = render(<CalendarToolbar {...defaultProps} label={label} />);
        expect(screen.getByText(label)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('German Localization', () => {
    it('should display German navigation labels', () => {
      render(<CalendarToolbar {...defaultProps} />);

      expect(screen.getByText('Heute')).toBeInTheDocument();
      expect(screen.getByLabelText('Vorheriger Zeitraum')).toBeInTheDocument();
      expect(screen.getByLabelText('Nächster Zeitraum')).toBeInTheDocument();
    });

    it('should display German view labels', () => {
      render(<CalendarToolbar {...defaultProps} />);

      expect(screen.getByText('Monat')).toBeInTheDocument();
      expect(screen.getByText('Woche')).toBeInTheDocument();
      expect(screen.getByText('Tag')).toBeInTheDocument();
    });
  });
});