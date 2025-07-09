interface NumberSpinnerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
  step?: number;
}

export default function NumberSpinner({
  value,
  onChange,
  min = 1,
  max = 100,
  label,
  disabled = false,
  className = '',
  step = 1,
}: NumberSpinnerProps) {
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + step);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - step);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const canDecrement = value > min && !disabled;
  const canIncrement = value < max && !disabled;

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={!canDecrement}
          className="flex items-center justify-center w-10 h-10 text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors duration-200"
          aria-label="Verringern"
          title="Verringern"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="flex-1 px-3 py-2 text-center text-gray-900 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset disabled:bg-gray-50 disabled:text-gray-500"
          aria-label={label || "Anzahl"}
        />
        
        <button
          type="button"
          onClick={handleIncrement}
          disabled={!canIncrement}
          className="flex items-center justify-center w-10 h-10 text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors duration-200"
          aria-label="Erhöhen"
          title="Erhöhen"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      <div className="mt-1 text-xs text-gray-500">
        {min} - {max} {label?.toLowerCase() || 'Anzahl'}
      </div>
    </div>
  );
}