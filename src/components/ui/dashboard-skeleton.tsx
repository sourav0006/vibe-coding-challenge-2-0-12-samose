export function DashboardContentSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard content..."
      className="space-y-6 animate-pulse w-full"
    >
      {/* Top Breadcrumb & Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2D7C3]/60">
        <div className="space-y-2">
          <div className="h-7 w-48 sm:w-64 bg-[#E2D7C3]/70 rounded-md" />
          <div className="h-4 w-32 sm:w-44 bg-[#E2D7C3]/40 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-24 sm:w-28 bg-[#E2D7C3]/50 rounded-lg shrink-0" />
        </div>
      </div>

      {/* 4-Card Metric Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-[#FAF6EE] border border-[#E2D7C3] rounded-xl p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 bg-[#E2D7C3]/70 rounded" />
              <div className="w-8 h-8 rounded-lg bg-[#E2D7C3]/50 shrink-0" />
            </div>
            <div className="h-8 w-24 bg-[#11262C]/15 rounded" />
            <div className="h-3 w-32 bg-[#E2D7C3]/40 rounded" />
          </div>
        ))}
      </div>

      {/* Content Table / Card Panel Skeleton */}
      <div className="bg-[#FAF6EE] border border-[#E2D7C3] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E2D7C3]/60">
          <div className="h-5 w-40 bg-[#11262C]/20 rounded" />
          <div className="h-9 w-full sm:w-56 bg-[#E2D7C3]/40 rounded-lg" />
        </div>

        {/* List / Table Rows Skeleton */}
        <div className="space-y-3 pt-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 rounded-lg border border-[#E2D7C3]/40 bg-white/40"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E2D7C3]/60 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 sm:w-48 bg-[#11262C]/15 rounded" />
                  <div className="h-3 w-20 sm:w-32 bg-[#E2D7C3]/40 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-16 sm:w-20 rounded-full bg-[#E2D7C3]/50" />
                <div className="w-7 h-7 rounded bg-[#E2D7C3]/30 hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading dashboard content...</span>
    </div>
  );
}

export function DashboardShellSkeleton() {
  return (
    <div className="min-h-screen bg-[#F5EBD8] text-[#132B32] flex flex-col md:flex-row">
      {/* Desktop Sidebar Placeholder */}
      <aside className="hidden md:flex flex-col shrink-0 w-64 bg-[#11262C] border-r border-[#1B3B44] sticky top-0 h-screen p-4 space-y-6">
        <div className="h-8 w-36 bg-white/10 rounded" />
        <div className="space-y-2 pt-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-full bg-white/5 rounded-lg" />
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Placeholder */}
        <header className="h-16 bg-[#FAF6EE] border-b border-[#DACBB4] px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="h-5 w-32 bg-[#E2D7C3]/60 rounded" />
          <div className="flex items-center gap-3">
            <div className="h-6 w-20 rounded-full bg-[#E2D7C3]/60" />
            <div className="w-8 h-8 rounded-full bg-[#E2D7C3]/60" />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <DashboardContentSkeleton />
        </main>
      </div>
    </div>
  );
}

