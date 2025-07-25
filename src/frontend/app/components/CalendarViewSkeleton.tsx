'use client';

export default function CalendarViewSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 animate-pulse">
      {/* Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="w-16 h-10 bg-gray-200 rounded-lg"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        </div>
        
        <div className="w-32 h-6 bg-gray-200 rounded"></div>
        
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <div className="w-12 h-6 bg-gray-200 rounded"></div>
          <div className="w-12 h-6 bg-gray-200 rounded"></div>
          <div className="w-8 h-6 bg-gray-200 rounded"></div>
        </div>
      </div>
      
      {/* Calendar Grid Skeleton */}
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded text-center"></div>
          ))}
        </div>
        
        {/* Calendar Body */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded border border-gray-200 p-1">
              {/* Some days have booking rectangles */}
              {Math.random() > 0.7 && (
                <div className="h-4 bg-gray-300 rounded mb-1"></div>
              )}
              {Math.random() > 0.8 && (
                <div className="h-4 bg-gray-300 rounded mb-1"></div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend Skeleton */}
      <div className="mt-4 flex flex-wrap gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded mr-2"></div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}