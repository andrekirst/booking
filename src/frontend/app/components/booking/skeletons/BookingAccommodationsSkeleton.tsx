export default function BookingAccommodationsSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="h-6 bg-gray-200 rounded w-40 mb-6 animate-pulse"></div>
      <div className="grid gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="ml-4">
                  <div className="h-5 bg-gray-300 rounded w-32 animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex items-center px-3 py-1.5 bg-white rounded-full shadow-sm border border-indigo-200">
                  <div className="w-4 h-4 bg-indigo-200 rounded mr-2 animate-pulse"></div>
                  <div className="h-4 bg-indigo-200 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}