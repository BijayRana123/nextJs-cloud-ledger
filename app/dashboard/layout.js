import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function DashboardLayoutWrapper({ children }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
