'use client';

export default function CompactBookingListSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full max-h-[600px] xl:max-h-[600px] lg:max-h-[400px] animate-pulse">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="w-32 h-6 bg-gray-200 rounded"></div>
      </div>
      
      <div className="overflow-y-auto flex-1 max-h-[calc(600px-60px)] xl:max-h-[calc(600px-60px)] lg:max-h-[calc(400px-60px)]">
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  </div>
                  
                  <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                  
                  <div className="flex items-center text-xs space-x-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-200 rounded mr-1"></div>
                      <div className="w-4 h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-200 rounded mr-1"></div>
                      <div className="w-6 h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-200 rounded mr-1"></div>
                      <div className="w-4 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
                
                <div className="w-4 h-4 bg-gray-200 rounded flex-shrink-0 ml-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}