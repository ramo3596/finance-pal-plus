import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { FinancialSidebar } from "@/components/FinancialSidebar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { NotificationDropdown } from "@/components/NotificationDropdown"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <FinancialSidebar />
        <main className="flex-1 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          <div className="p-4">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}