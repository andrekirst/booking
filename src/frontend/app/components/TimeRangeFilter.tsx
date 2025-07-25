'use client';

import { TimeRange } from '../../lib/types/api';

interface TimeRangeFilterProps {
  selectedTimeRange: TimeRange;
  onChange: (timeRange: TimeRange) => void;
}

export default function TimeRangeFilter({ selectedTimeRange, onChange }: TimeRangeFilterProps) {
  const timeRangeOptions = [
    { value: TimeRange.Future, label: 'Aktuelle & Zukünftige' },
    { value: TimeRange.All, label: 'Alle Buchungen' },
    { value: TimeRange.Past, label: 'Vergangene' },
    { value: TimeRange.Last30Days, label: 'Letzte 30 Tage' },
    { value: TimeRange.LastYear, label: 'Letztes Jahr' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="timeRange" className="text-sm font-medium text-gray-700">
        Zeitraum:
      </label>
      <select
        id="timeRange"
        value={selectedTimeRange}
        onChange={(e) => onChange(Number(e.target.value) as TimeRange)}
        className="block px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {timeRangeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}