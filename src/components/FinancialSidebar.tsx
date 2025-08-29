import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Home,
  List,
  Package,
  TrendingUp,
  BarChart3,
  Calendar,
  Target,
  Users,
  Settings,
  ChevronDown,
  ShoppingCart,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useIsMobile } from "@/hooks/use-mobile"

const menuItems = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Registros", url: "/records", icon: List },
  { title: "Inventario", url: "/inventory", icon: Package },
  { 
    title: "Estadística", 
    icon: BarChart3,
    submenu: [
      { title: "Transacciones", url: "/statistics", icon: BarChart3 },
      { title: "Venta de productos", url: "/statistics/products", icon: ShoppingCart },
    ]
  },
  { title: "Pagos programados", url: "/scheduled-payments", icon: Calendar },
  { title: "Deudas", url: "/debts", icon: Target },
  { title: "Contactos", url: "/contacts", icon: Users },
  { title: "Inversiones", url: "/investments", icon: TrendingUp },
  { title: "Configuración", url: "/settings", icon: Settings },
]

export function FinancialSidebar() {
  const { open } = useSidebar()
  const isMobile = useIsMobile()
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<string[]>(["Estadística"])

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-primary font-medium" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground"

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  return (
    <Sidebar
      className={isMobile ? (open ? "w-64" : "w-12") : (open ? "w-72" : "w-14")}
      collapsible="icon"
    >
      <SidebarTrigger className="m-4 self-end" />

      <SidebarContent className="px-2">
        <SidebarGroup className="space-y-1">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {'submenu' in item ? (
                    <Collapsible
                      open={expandedItems.includes(item.title)}
                      onOpenChange={() => toggleExpanded(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className={isMobile ? "h-10" : "h-12"}>
                          <item.icon className={isMobile ? "h-4 w-4 shrink-0" : "h-5 w-5 shrink-0"} />
                          {open && <span className="ml-3">{item.title}</span>}
                          {open && (
                            <ChevronDown 
                              className={`ml-auto h-4 w-4 transition-transform ${
                                expandedItems.includes(item.title) ? 'rotate-180' : ''
                              }`}
                            />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {open && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.submenu.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <NavLink to={subItem.url} end className={getNavClassName}>
                                    <subItem.icon className="h-4 w-4 shrink-0" />
                                    <span className="ml-2">{subItem.title}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild className={isMobile ? "h-10" : "h-12"}>
                      <NavLink to={item.url} end className={getNavClassName}>
                        <item.icon className={isMobile ? "h-4 w-4 shrink-0" : "h-5 w-5 shrink-0"} />
                        {open && <span className="ml-3">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  )
}