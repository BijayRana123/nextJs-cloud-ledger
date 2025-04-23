import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Assuming lucide-react is installed for icons
import { Package, DollarSign, CreditCard } from "lucide-react";

const iconMap = {
  revenue: DollarSign,
  expenses: CreditCard,
  stock: Package,
};

export default function StatsCard({ title, value, type }) {
  const Icon = iconMap[type] || DollarSign; // Default icon

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {/* Tooltip placeholder */}
        {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
      </CardContent>
    </Card>
  );
}
