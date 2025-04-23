import { Search, Headphones, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function TopNavbar({ children }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-[#2a2f4a] px-4">
      <div className="flex items-center">
        {children}
        <div className="text-white font-bold text-2xl mr-6">tigg</div>
        <div className="relative w-64 lg:w-96">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search..."
            className="pl-8 bg-[#3a3f5a] border-none text-white placeholder:text-gray-400"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">Ctrl + /</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="text-white gap-2">
          <Headphones className="h-5 w-5" />
          <span>Support</span>
          <span className="ml-1 h-2 w-2 rounded-full bg-green-500"></span>
        </Button>
        <Button variant="ghost" className="text-white">
          <Calendar className="h-5 w-5 mr-2" />
          <span>This Fiscal Year to Date</span>
        </Button>
      </div>
    </header>
  )
}
