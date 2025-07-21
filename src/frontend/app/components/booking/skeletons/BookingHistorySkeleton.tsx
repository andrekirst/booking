export default function BookingHistorySkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="h-6 bg-gray-200 rounded w-16 mb-4 animate-pulse"></div>
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded mr-2 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}