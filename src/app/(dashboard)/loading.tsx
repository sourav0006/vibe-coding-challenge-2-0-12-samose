import { LoadingState } from "@/components/ui/loading-state";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F4EBD8] flex items-center justify-center p-8">
      <LoadingState message="Loading One Academy..." size="lg" />
    </div>
  );
}

