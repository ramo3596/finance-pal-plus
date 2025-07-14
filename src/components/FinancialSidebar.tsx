import { useState } from "react"
import { NavLink } from "react-router-dom"
import {
  Home,
  List,
  TrendingUp,
  BarChart3,
  Calendar,
  CreditCard,
  Target,
  Coins,
  ShoppingCart,
  Shield,
  PiggyBank,
  ArrowLeftRight,
  Users,
  MoreHorizontal
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
  { title: "Presupuestos", url: "/budgets", icon: CreditCard },
  { title: "Deudas", url: "/debts", icon: Target },
  { title: "Objetivos", url: "/goals", icon: Coins },
  { title: "Monedero para tu negocio", url: "/business-wallet", icon: PiggyBank },
  { title: "Listas de compra", url: "/shopping-lists", icon: ShoppingCart },
  { title: "Garantías", url: "/warranties", icon: Shield },
  { title: "Tarjetas de fidelización", url: "/loyalty-cards", icon: CreditCard },
  { title: "Tipo de cambio", url: "/exchange-rates", icon: ArrowLeftRight },
  { title: "Compartir en grupo", url: "/group-sharing", icon: Users },
  { title: "Otros", url: "/others", icon: MoreHorizontal },
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

        {/* Plan activo section at bottom */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            {open && (
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">Plan activo</p>
                <p className="text-xs text-sidebar-foreground/70">Licencia de por vida</p>
              </div>
            )}
            <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
              Premium
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}