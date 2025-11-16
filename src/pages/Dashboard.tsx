import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, AlertTriangle, Shield, Users, Package } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { canManageUsers, canManageSH, roles } = useRoles();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single() as any;
      return data;
    },
    enabled: !!user,
  });

  const { data: contractsCount } = useQuery({
    queryKey: ['contracts-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'por_vencer') as any;
      return count || 0;
    },
  });

  const { data: vacationRequestsCount } = useQuery({
    queryKey: ['vacation-requests-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('vacation_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendiente') as any;
      return count || 0;
    },
  });

  const { data: incidentsCount } = useQuery({
    queryKey: ['incidents-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .in('status', ['abierto', 'en_progreso']) as any;
      return count || 0;
    },
  });

  const { data: inspectionsCount } = useQuery({
    queryKey: ['inspections-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('sh_inspections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'programada') as any;
      return count || 0;
    },
    enabled: canManageSH,
  });

  const widgets = [
    {
      title: 'Contratos por Vencer',
      description: 'Contratos próximos a expirar',
      value: contractsCount || 0,
      icon: FileText,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      action: () => navigate('/contratos'),
      show: true,
    },
    {
      title: 'Solicitudes de Vacaciones',
      description: 'Pendientes de aprobación',
      value: vacationRequestsCount || 0,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      action: () => navigate('/vacaciones/solicitudes'),
      show: true,
    },
    {
      title: 'Incidencias Abiertas',
      description: 'Requieren atención',
      value: incidentsCount || 0,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      action: () => navigate('/incidencias'),
      show: true,
    },
    {
      title: 'Inspecciones Programadas',
      description: 'Próximas inspecciones S&H',
      value: inspectionsCount || 0,
      icon: Shield,
      color: 'text-success',
      bgColor: 'bg-success/10',
      action: () => navigate('/seguridad-higiene/inspecciones'),
      show: canManageSH,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido/a, {(profile as any)?.full_name || user?.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {widgets.filter(w => w.show).map((widget) => (
          <Card key={widget.title} className="cursor-pointer transition-all hover:shadow-md" onClick={widget.action}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {widget.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${widget.bgColor}`}>
                <widget.icon className={`h-4 w-4 ${widget.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{widget.value}</div>
              <p className="text-xs text-muted-foreground">
                {widget.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
            <CardDescription>Acciones frecuentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/vacaciones/solicitar')}>
              <Calendar className="mr-2 h-4 w-4" />
              Solicitar Vacaciones
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/incidencias/nueva')}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Reportar Incidencia
            </Button>
            {canManageUsers && (
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/usuarios/new')}>
                <Users className="mr-2 h-4 w-4" />
                Agregar Usuario
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tu Perfil</CardTitle>
            <CardDescription>Información personal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">Departamento</p>
              <p className="text-sm text-muted-foreground">{(profile as any)?.department || 'No asignado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Puesto</p>
              <p className="text-sm text-muted-foreground">{(profile as any)?.position || 'No asignado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Roles</p>
              <p className="text-sm text-muted-foreground">{roles.join(', ') || 'Sin roles asignados'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>Información general</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Sistema</span>
              <span className="text-sm font-medium text-success">Operativo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Base de Datos</span>
              <span className="text-sm font-medium text-success">Conectada</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Autenticación</span>
              <span className="text-sm font-medium text-success">Activa</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
