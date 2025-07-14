import { useState } from "react"
import { NavLink } from "react-router-dom"
import {
  Home,
  List,
  TrendingUp,
  BarChart3,
  Calendar,
  Target,
  Users,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const menuItems = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Registros", url: "/records", icon: List },
  { title: "Inversiones", url: "/investments", icon: TrendingUp },
  { title: "Estadística", url: "/statistics", icon: BarChart3 },
  { title: "Pagos programados", url: "/scheduled-payments", icon: Calendar },
  { title: "Deudas", url: "/debts", icon: Target },
  { title: "Compartir en grupo", url: "/group-sharing", icon: Users },
]

export function FinancialSidebar() {
  const { open } = useSidebar()

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-primary font-medium" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground"

  return (
    <Sidebar
      className={open ? "w-72" : "w-14"}
      collapsible="icon"
    >
      <SidebarTrigger className="m-4 self-end" />

      <SidebarContent className="px-2">
        <SidebarGroup className="space-y-1">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink to={item.url} end className={getNavClassName}>
                      <item.icon className="h-5 w-5 shrink-0" />
                      {open && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  )
}