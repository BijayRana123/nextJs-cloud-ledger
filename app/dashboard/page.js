import StatsCard from "@/components/dashboard/StatsCard"; // Import StatsCard

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Dashboard Overview</h1>
      <p className="mt-2 text-gray-600">Welcome to your dashboard. More content will be added here based on the tasks.</p>

      {/* Add Stats Cards */}
      <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Total Revenue" value="$45,231.89" type="revenue" />
        <StatsCard title="Total Expenses" value="$12,345.67" type="expenses" />
        <StatsCard title="Items in Stock" value="1,234" type="stock" />
      </div>
      {/* End Stats Cards */}

    </div>
  );
}
