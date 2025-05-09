import { Search, Headphones, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Cookies from 'js-cookie'; // Import js-cookie
import { useOrganization } from "@/lib/context/OrganizationContext" // Import useOrganization

export function TopNavbar({ children }) {
  const router = useRouter()
  const { currentOrganization, loading } = useOrganization() // Use the hook

  const handleLogout = async () => {
    // Clear the authentication cookie
    Cookies.remove('sb-mnvxxmmrlvjgpnhditxc-auth-token');
    Cookies.remove('sb-mnvxxmmrlvjgpnhditxc-auth-token-array'); // Also remove the array format cookie for backward compatibility

    // TODO: If a backend logout API exists, call it here to invalidate the session server-side.

    // Redirect to the select organization page
    router.push("/")
  }

  // Function to get initials from organization name
  const getInitials = (name) => {
    if (!name) return "CN"; // Default fallback
    const words = name.split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-[#2a2f4a] px-4">
      <div className="flex items-center">
        {children}
        <Link className="text-white font-bold text-2xl mr-6" href="/dashboard">tigg</Link>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar>
              {/* Use AvatarFallback with initials */}
              <AvatarFallback>
                {loading ? "..." : getInitials(currentOrganization?.name)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
