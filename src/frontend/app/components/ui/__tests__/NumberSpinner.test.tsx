import { render, screen, fireEvent } from '@testing-library/react';
import NumberSpinner from '../NumberSpinner';

describe('NumberSpinner', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<NumberSpinner value={5} onChange={mockOnChange} />);

    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
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
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
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

  it('handles direct input changes within bounds', () => {
    render(<NumberSpinner value={5} onChange={mockOnChange} min={1} max={10} />);

    const input = screen.getByDisplayValue('5');
    fireEvent.change(input, { target: { value: '7' } });

    expect(mockOnChange).toHaveBeenCalledWith(7);
  });

  it('ignores direct input changes outside bounds', () => {
    render(<NumberSpinner value={5} onChange={mockOnChange} min={1} max={10} />);

    const input = screen.getByDisplayValue('5');
    fireEvent.change(input, { target: { value: '15' } });

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('ignores invalid input values', () => {
    render(<NumberSpinner value={5} onChange={mockOnChange} min={1} max={10} />);

    const input = screen.getByDisplayValue('5');
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(mockOnChange).not.toHaveBeenCalled();
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
    const input = screen.getByDisplayValue('5');

    expect(incrementButton).toBeDisabled();
    expect(decrementButton).toBeDisabled();
    expect(input).toBeDisabled();

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
    const input = screen.getByLabelText('Anzahl Personen');

    expect(incrementButton).toHaveAttribute('title', 'Erhöhen');
    expect(decrementButton).toHaveAttribute('title', 'Verringern');
    expect(input).toHaveAttribute('aria-label', 'Anzahl Personen');
  });

  it('supports custom className', () => {
    render(
      <NumberSpinner 
        value={5} 
        onChange={mockOnChange} 
        className="custom-class"
      />
    );

    const container = screen.getByDisplayValue('5').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });
});