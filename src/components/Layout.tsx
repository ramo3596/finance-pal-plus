import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { FinancialSidebar } from "@/components/FinancialSidebar"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <FinancialSidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}