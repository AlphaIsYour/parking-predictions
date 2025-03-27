export default function ChartSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>

      {/* Chart Area */}
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>

      {/* Label */}
      <div className="flex gap-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
    </div>
  );
}
