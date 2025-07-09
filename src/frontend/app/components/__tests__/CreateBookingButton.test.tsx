import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateBookingButton from '../CreateBookingButton'

describe('CreateBookingButton', () => {
  const mockOnClick = jest.fn()

  beforeEach(() => {
    mockOnClick.mockClear()
  })

  describe('Large variant (default)', () => {
    it('renders large button with correct text', () => {
      render(<CreateBookingButton onClick={mockOnClick} />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('Neue Buchung erstellen')).toBeInTheDocument()
    })

    it('renders large button with explicit variant prop', () => {
      render(<CreateBookingButton variant="large" onClick={mockOnClick} />)
      
      expect(screen.getByText('Neue Buchung erstellen')).toBeInTheDocument()
    })

    it('has correct CSS classes for large variant', () => {
      render(<CreateBookingButton variant="large" onClick={mockOnClick} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-6', 'py-3', 'font-semibold', 'rounded-2xl', 'shadow-lg')
    })

    it('has correct icon size for large variant', () => {
      render(<CreateBookingButton variant="large" onClick={mockOnClick} />)
      
      const icon = screen.getByRole('button').querySelector('svg')
      expect(icon).toHaveClass('w-5', 'h-5')
    })
  })

  describe('Compact variant', () => {
    it('renders compact button with correct text', () => {
      render(<CreateBookingButton variant="compact" onClick={mockOnClick} />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('Neue Buchung')).toBeInTheDocument()
    })

    it('has correct CSS classes for compact variant', () => {
      render(<CreateBookingButton variant="compact" onClick={mockOnClick} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm', 'rounded-xl', 'shadow-md')
    })

    it('has correct icon size for compact variant', () => {
      render(<CreateBookingButton variant="compact" onClick={mockOnClick} />)
      
      const icon = screen.getByRole('button').querySelector('svg')
      expect(icon).toHaveClass('w-4', 'h-4')
    })
  })

  describe('Common functionality', () => {
    it('calls onClick handler when clicked', async () => {
      const user = userEvent.setup()
      render(<CreateBookingButton onClick={mockOnClick} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('has correct button type', () => {
      render(<CreateBookingButton onClick={mockOnClick} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
    })

    it('has plus icon', () => {
      render(<CreateBookingButton onClick={mockOnClick} />)
      
      const icon = screen.getByRole('button').querySelector('svg')
      expect(icon).toBeInTheDocument()
      
      const path = icon?.querySelector('path')
      expect(path).toHaveAttribute('d', 'M12 4v16m8-8H4')
    })

    it('has common base CSS classes', () => {
      render(<CreateBookingButton onClick={mockOnClick} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'bg-gradient-to-r',
        'from-green-600',
        'to-emerald-600',
        'text-white',
        'font-medium'
      )
    })
  })

  describe('Props handling', () => {
    it('can be disabled', () => {
      render(<CreateBookingButton onClick={mockOnClick} disabled={true} />)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    })

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup()
      render(<CreateBookingButton onClick={mockOnClick} disabled={true} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('accepts additional className prop', () => {
      const customClass = 'custom-class'
      render(<CreateBookingButton onClick={mockOnClick} className={customClass} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass(customClass)
    })

    it('handles empty className prop', () => {
      render(<CreateBookingButton onClick={mockOnClick} className="" />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper focus styles', () => {
      render(<CreateBookingButton onClick={mockOnClick} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-green-500/50')
    })

    it('has proper hover styles', () => {
      render(<CreateBookingButton onClick={mockOnClick} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:from-green-700', 'hover:to-emerald-700')
    })

    it('has proper transition styles', () => {
      render(<CreateBookingButton onClick={mockOnClick} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('transition-all', 'duration-200')
    })
  })
})