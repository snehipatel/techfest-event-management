import {
    LayoutDashboard,
    Users,
    Calendar,
    ClipboardList,
    CheckSquare,
    Share2,
    CreditCard,
    Bell,
    Activity,
    Mail,
  } from "lucide-react";
  import { NavLink } from "@/components/Navbar";
  import { useAuth } from "@/contexts/AuthContext";
  import { hasAccess } from "@/lib/roles";
  import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
    useSidebar,
  } from "@/components/ui/sidebar";
  
  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Users", url: "/users", icon: Users },
    { title: "Invites", url: "/invites", icon: Mail },
    { title: "Events", url: "/events", icon: Calendar },
    { title: "Registrations", url: "/registrations", icon: ClipboardList },
    { title: "Tasks", url: "/tasks", icon: CheckSquare },
    { title: "Referrals", url: "/referrals", icon: Share2 },
    { title: "Payments", url: "/payments", icon: CreditCard },
    { title: "Activity Logs", url: "/activity-logs", icon: Activity },
  ];
  
  export function AppSidebar() {
    const { state } = useSidebar();
    const collapsed = state === "collapsed";
    const { user } = useAuth();
  
    const visibleItems = menuItems.filter(
      (item) => user && hasAccess(user.role, item.url)
    );
  
    return (
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              TF
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-foreground">Tech Fest</span>
                <span className="text-xs text-muted-foreground">Admin Panel</span>
              </div>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-sidebar-accent/50 transition-colors duration-200"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-3">
          {!collapsed && (
            <p className="text-xs text-muted-foreground text-center">© 2026 Tech Fest</p>
          )}
        </SidebarFooter>
      </Sidebar>
    );
  }
  