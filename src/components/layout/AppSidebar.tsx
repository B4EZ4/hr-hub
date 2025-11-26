import {
  LayoutDashboard,
  Users,
  Calendar,
  AlertTriangle,
  Shield,
  FolderOpen,
  Settings,
  Briefcase,
  Clock8,
  Building2,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useRoles } from '@/hooks/useRoles';

export const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { canManageUsers, canManageSH, canViewAuditLogs } = useRoles();
  const collapsed = state === 'collapsed';

  const mainItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, show: true },
    { title: 'Áreas y Asignaciones', url: '/areas', icon: Building2, show: true },
    { title: 'Contratos', url: '/reclutamiento', icon: Briefcase, show: true },
    { title: 'Asistencia', url: '/asistencia', icon: Clock8, show: true },
    { title: 'Vacaciones', url: '/vacaciones', icon: Calendar, show: true },
    { title: 'Incidencias y Despidos', url: '/incidencias', icon: AlertTriangle, show: true },
    { title: 'Seguridad e Higiene', url: '/seguridad-higiene', icon: Shield, show: true },
    { title: 'Documentos', url: '/documentos', icon: FolderOpen, show: true },
  ];

  const settingsItems = [
    { title: 'Configuración', url: '/settings', icon: Settings, show: canManageUsers || canViewAuditLogs },
    { title: 'Usuarios', url: '/usuarios', icon: Users, show: canManageUsers },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <Sidebar className={collapsed ? 'w-16' : 'w-64'}>
      <SidebarContent>
        <div className="px-3 py-4">
          <h2 className={`text-lg font-bold text-primary ${collapsed ? 'hidden' : 'block'}`}>
            Sistema RRHH
          </h2>
          {collapsed && (
            <div className="flex items-center justify-center">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'hidden' : 'block'}>
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.filter(item => item.show).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'hidden' : 'block'}>
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.filter(item => item.show).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
