'use client';

import { motion, AnimatePresence } from 'framer-motion';

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

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

function AnimatedNumber({ value, className = '' }: AnimatedNumberProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.2
          }}
          className="block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
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


  const canDecrement = value > min && !disabled;
  const canIncrement = value < max && !disabled;

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="flex items-center w-32 border border-gray-300 rounded-lg overflow-hidden bg-white">
        <motion.button
          type="button"
          onClick={handleDecrement}
          disabled={!canDecrement}
          className="flex items-center justify-center w-8 h-8 text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors duration-200"
          aria-label="Verringern"
          title="Verringern"
          whileHover={!disabled && canDecrement ? { scale: 1.1 } : {}}
          whileTap={!disabled && canDecrement ? { scale: 0.9 } : {}}
          whileFocus={{ boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)" }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </motion.button>
        
        <div className="flex-1 px-2 py-1.5 text-center text-gray-900 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset disabled:bg-gray-50 disabled:text-gray-500 min-h-[1.5rem] flex items-center justify-center">
          <AnimatedNumber 
            value={value}
            className="text-center font-medium"
          />
        </div>
        
        <motion.button
          type="button"
          onClick={handleIncrement}
          disabled={!canIncrement}
          className="flex items-center justify-center w-8 h-8 text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors duration-200"
          aria-label="Erhöhen"
          title="Erhöhen"
          whileHover={!disabled && canIncrement ? { scale: 1.1 } : {}}
          whileTap={!disabled && canIncrement ? { scale: 0.9 } : {}}
          whileFocus={{ boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)" }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>
      </div>
      
      <div className="mt-1 text-xs text-gray-500">
        {min} - {max} {label?.toLowerCase() || 'Anzahl'}
      </div>
    </div>
  );
}