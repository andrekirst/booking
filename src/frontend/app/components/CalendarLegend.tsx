'use client';

export default function CalendarLegend() {
  const legendItems = [
    { color: 'bg-yellow-500', label: 'Ausstehend' },
    { color: 'bg-emerald-500', label: 'Bestätigt/Angenommen' },
    { color: 'bg-red-500', label: 'Storniert/Abgelehnt' },
    { color: 'bg-blue-500', label: 'Abgeschlossen' },
  ];

  return (
    <div className="mt-4 flex flex-wrap gap-4 text-sm">
      {legendItems.map((item, index) => (
        <div key={index} className="flex items-center">
          <div className={`w-3 h-3 ${item.color} rounded mr-2`}></div>
          <span className="text-gray-800 font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  );
}