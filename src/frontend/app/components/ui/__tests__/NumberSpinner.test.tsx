import { render, screen, fireEvent } from '@testing-library/react';
import NumberSpinner from '../NumberSpinner';

describe('NumberSpinner', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<NumberSpinner value={5} onChange={mockOnChange} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByLabelText('Verringern')).toBeInTheDocument();
    expect(screen.getByLabelText('Erhöhen')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(
      <NumberSpinner 
        value={3} 
        onChange={mockOnChange} 
        label="Test Label" 
      />
    );

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows min-max range information', () => {
    render(
      <NumberSpinner 
        value={5} 
        onChange={mockOnChange} 
        min={1} 
        max={10} 
        label="Personen"
      />
    );

    expect(screen.getByText('1 - 10 personen')).toBeInTheDocument();
  });

  it('increments value when plus button is clicked', () => {
    render(<NumberSpinner value={5} onChange={mockOnChange} min={1} max={10} />);

    const incrementButton = screen.getByLabelText('Erhöhen');
    fireEvent.click(incrementButton);

    expect(mockOnChange).toHaveBeenCalledWith(6);
  });

  it('decrements value when minus button is clicked', () => {
    render(<NumberSpinner value={5} onChange={mockOnChange} min={1} max={10} />);

    const decrementButton = screen.getByLabelText('Verringern');
    fireEvent.click(decrementButton);

    expect(mockOnChange).toHaveBeenCalledWith(4);
  });

  it('disables decrement button at minimum value', () => {
    render(<NumberSpinner value={1} onChange={mockOnChange} min={1} max={10} />);

    const decrementButton = screen.getByLabelText('Verringern');
    expect(decrementButton).toBeDisabled();

    fireEvent.click(decrementButton);
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('disables increment button at maximum value', () => {
    render(<NumberSpinner value={10} onChange={mockOnChange} min={1} max={10} />);

    const incrementButton = screen.getByLabelText('Erhöhen');
    expect(incrementButton).toBeDisabled();

    fireEvent.click(incrementButton);
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('animates number display when value changes', () => {
    const { rerender } = render(<NumberSpinner value={5} onChange={mockOnChange} min={1} max={10} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    
    rerender(<NumberSpinner value={7} onChange={mockOnChange} min={1} max={10} />);
    
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('uses custom step value', () => {
    render(<NumberSpinner value={5} onChange={mockOnChange} min={1} max={20} step={5} />);

    const incrementButton = screen.getByLabelText('Erhöhen');
    fireEvent.click(incrementButton);

    expect(mockOnChange).toHaveBeenCalledWith(10);
  });

  it('disables all controls when disabled prop is true', () => {
    render(
      <NumberSpinner 
        value={5} 
        onChange={mockOnChange} 
        min={1} 
        max={10} 
        disabled={true} 
      />
    );

    const incrementButton = screen.getByLabelText('Erhöhen');
    const decrementButton = screen.getByLabelText('Verringern');

    expect(incrementButton).toBeDisabled();
    expect(decrementButton).toBeDisabled();
    expect(screen.getByText('5')).toBeInTheDocument();

    fireEvent.click(incrementButton);
    fireEvent.click(decrementButton);
    
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(
      <NumberSpinner 
        value={5} 
        onChange={mockOnChange} 
        label="Anzahl Personen"
      />
    );

    const incrementButton = screen.getByLabelText('Erhöhen');
    const decrementButton = screen.getByLabelText('Verringern');

    expect(incrementButton).toHaveAttribute('title', 'Erhöhen');
    expect(decrementButton).toHaveAttribute('title', 'Verringern');
    expect(screen.getByText('Anzahl Personen')).toBeInTheDocument();
  });

  it('supports custom className', () => {
    render(
      <NumberSpinner 
        value={5} 
        onChange={mockOnChange} 
        className="custom-class"
      />
    );

    const container = screen.getByText('5').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });

  describe('Animation Features', () => {
    it('renders AnimatedNumber component for value display', () => {
      render(<NumberSpinner value={42} onChange={mockOnChange} />);
      
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('updates animated display when value changes via increment', () => {
      const { rerender } = render(<NumberSpinner value={1} onChange={mockOnChange} min={1} max={5} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
      
      rerender(<NumberSpinner value={2} onChange={mockOnChange} min={1} max={5} />);
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('handles multiple rapid value changes', () => {
      const { rerender } = render(<NumberSpinner value={1} onChange={mockOnChange} min={1} max={10} />);
      
      [2, 3, 4, 5].forEach(value => {
        rerender(<NumberSpinner value={value} onChange={mockOnChange} min={1} max={10} />);
        expect(screen.getByText(value.toString())).toBeInTheDocument();
      });
    });
  });
});