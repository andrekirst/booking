import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ViewToggle, { useViewMode } from '../ViewToggle';
import { renderHook, act } from '@testing-library/react';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

describe('ViewToggle', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('renders both view buttons', () => {
    const mockOnViewChange = jest.fn();
    render(
      <ViewToggle currentView="list" onViewChange={mockOnViewChange} />
    );

    expect(screen.getByText('Liste')).toBeInTheDocument();
    expect(screen.getByText('Kalender')).toBeInTheDocument();
  });

  it('shows correct active state for list view', () => {
    const mockOnViewChange = jest.fn();
    render(
      <ViewToggle currentView="list" onViewChange={mockOnViewChange} />
    );

    const listButton = screen.getByText('Liste').closest('button');
    const calendarButton = screen.getByText('Kalender').closest('button');

    expect(listButton).toHaveClass('bg-blue-100', 'text-blue-700');
    expect(calendarButton).toHaveClass('text-gray-600');
  });

  it('shows correct active state for calendar view', () => {
    const mockOnViewChange = jest.fn();
    render(
      <ViewToggle currentView="calendar" onViewChange={mockOnViewChange} />
    );

    const listButton = screen.getByText('Liste').closest('button');
    const calendarButton = screen.getByText('Kalender').closest('button');

    expect(calendarButton).toHaveClass('bg-blue-100', 'text-blue-700');
    expect(listButton).toHaveClass('text-gray-600');
  });

  it('calls onViewChange when clicking list button', () => {
    const mockOnViewChange = jest.fn();
    render(
      <ViewToggle currentView="calendar" onViewChange={mockOnViewChange} />
    );

    fireEvent.click(screen.getByText('Liste'));
    expect(mockOnViewChange).toHaveBeenCalledWith('list');
  });

  it('calls onViewChange when clicking calendar button', () => {
    const mockOnViewChange = jest.fn();
    render(
      <ViewToggle currentView="list" onViewChange={mockOnViewChange} />
    );

    fireEvent.click(screen.getByText('Kalender'));
    expect(mockOnViewChange).toHaveBeenCalledWith('calendar');
  });

  it('has correct accessibility attributes', () => {
    const mockOnViewChange = jest.fn();
    render(
      <ViewToggle currentView="list" onViewChange={mockOnViewChange} />
    );

    const listButton = screen.getByText('Liste').closest('button');
    const calendarButton = screen.getByText('Kalender').closest('button');

    expect(listButton).toBeEnabled();
    expect(calendarButton).toBeEnabled();
  });
});

describe('useViewMode hook', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('returns a view mode and setter function', () => {
    const { result } = renderHook(() => useViewMode());
    const [viewMode, setViewMode] = result.current;
    
    expect(typeof viewMode).toBe('string');
    expect(typeof setViewMode).toBe('function');
    expect(['list', 'calendar']).toContain(viewMode);
  });

  it('updates view mode when setter is called', () => {
    const { result } = renderHook(() => useViewMode());
    const [initialViewMode, setViewMode] = result.current;
    
    act(() => {
      setViewMode('calendar');
    });
    
    const [updatedViewMode] = result.current;
    expect(updatedViewMode).toBe('calendar');
    expect(updatedViewMode).not.toBe(initialViewMode);
  });

  it('toggles between list and calendar views', () => {
    const { result } = renderHook(() => useViewMode());
    const [, setViewMode] = result.current;
    
    act(() => {
      setViewMode('list');
    });
    
    let [currentViewMode] = result.current;
    expect(currentViewMode).toBe('list');
    
    act(() => {
      setViewMode('calendar');
    });
    
    [currentViewMode] = result.current;
    expect(currentViewMode).toBe('calendar');
  });
});