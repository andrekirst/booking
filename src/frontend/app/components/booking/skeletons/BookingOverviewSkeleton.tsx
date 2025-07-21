export default function BookingOverviewSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="h-6 bg-gray-200 rounded w-24 mb-6 animate-pulse"></div>
      
      {/* Hauptinformation Skeleton */}
      <div className="text-center mb-6">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 bg-purple-200 rounded mr-2 animate-pulse"></div>
          <div className="h-8 bg-gray-300 rounded w-32 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-8 mx-2 animate-pulse"></div>
          <div className="w-6 h-6 bg-green-200 rounded mr-2 animate-pulse"></div>
          <div className="h-8 bg-gray-300 rounded w-24 animate-pulse"></div>
        </div>
      </div>
      
      {/* Buchungs-ID Skeleton */}
      <div className="text-center pt-4 border-t border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
      </div>
    </div>
  );
}