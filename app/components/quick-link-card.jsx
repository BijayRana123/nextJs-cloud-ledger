import { Card, CardContent } from "@/components/ui/card"

export function QuickLinkCard({ title, category, icon }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex flex-col">
            <span className="font-medium">{title}</span>
            {category && <span className="text-sm text-gray-500">{category}</span>}
          </div>
          <div className="flex items-center">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
