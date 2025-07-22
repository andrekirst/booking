export default function BookingActionMenuSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
        <div className="h-10 bg-red-200 rounded-lg w-full sm:w-32 animate-pulse"></div>
        <div className="h-10 bg-blue-200 rounded-lg w-full sm:w-32 animate-pulse"></div>
      </div>
    </div>
  );
}