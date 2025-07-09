interface CreateBookingButtonProps {
  variant?: 'compact' | 'large';
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export default function CreateBookingButton({
  variant = 'large',
  onClick,
  disabled = false,
  className = '',
}: CreateBookingButtonProps) {
  const baseClasses = 'inline-flex items-center bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]';
  
  const variantClasses = {
    compact: 'px-4 py-2 text-sm rounded-xl shadow-md shadow-green-500/25 hover:shadow-green-500/40',
    large: 'px-6 py-3 font-semibold rounded-2xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40'
  };
  
  const iconClasses = {
    compact: 'w-4 h-4 mr-2',
    large: 'w-5 h-5 mr-2'
  };
  
  const text = {
    compact: 'Neue Buchung',
    large: 'Neue Buchung erstellen'
  };
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
    >
      <svg className={iconClasses[variant]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {text[variant]}
    </button>
  );
}