import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, FileText, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';

export default function VacationsDashboard() {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['vacation-stats'],
    queryFn: async () => {
      const [requestsRes, balancesRes] = await Promise.all([
        supabase
          .from('vacation_requests')
          .select('status, days_requested', { count: 'exact' }),
        supabase
          .from('vacation_balances')
          .select('total_days, used_days', { count: 'exact' })
      ]);

      const requests = requestsRes.data || [];
      const balances = balancesRes.data || [];

      return {
        totalRequests: requestsRes.count || 0,
        pendingRequests: requests.filter(r => r.status === 'pendiente').length,
        approvedRequests: requests.filter(r => r.status === 'aprobado').length,
        sentToDocumentation: requests.filter(r => r.status === 'enviado_documentacion').length,
        totalDaysEarned: balances.reduce((sum, b) => sum + Number(b.total_days), 0),
        totalDaysTaken: balances.reduce((sum, b) => sum + Number(b.used_days), 0),
        employeesWithBalance: balancesRes.count || 0
      };
    }
  });

  const { data: recentRequests } = useQuery({
    queryKey: ['recent-vacation-requests'],
    queryFn: async () => {
      const { data } = await supabase
        .from('vacation_requests')
        .select(`
          id,
          request_number,
          start_date,
          end_date,
          days_requested,
          status,
          created_at,
          profiles:profile_id (full_name, employee_number)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    }
  });

  const statusColors: Record<string, any> = {
    pendiente: 'default',
    aprobado: 'success',
    rechazado: 'destructive',
    enviado_documentacion: 'secondary',
    cancelado: 'outline'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Vacaciones</h1>
          <p className="text-muted-foreground">
            Sistema de solicitudes según Ley Federal del Trabajo (Vacaciones Dignas 2023)
          </p>
        </div>
        <Button onClick={() => navigate('/vacaciones/buscar')}>
          <Users className="mr-2 h-4 w-4" />
          Buscar Empleado
        </Button>
      </div>

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingRequests || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requieren revisión
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approvedRequests || 0}</div>
            <p className="text-xs text-muted-foreground">
              Listas para documentación
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Días Disponibles</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalDaysEarned || 0) - (stats?.totalDaysTaken || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              De {stats?.totalDaysEarned || 0} días ganados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.employeesWithBalance || 0}</div>
            <p className="text-xs text-muted-foreground">
              Con balance activo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => navigate('/vacaciones/buscar')}
          >
            <Users className="mb-2 h-5 w-5" />
            <span className="font-semibold">Buscar Empleado</span>
            <span className="text-xs text-muted-foreground">
              Consultar balance y crear solicitud
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => navigate('/vacaciones/calendario')}
          >
            <Calendar className="mb-2 h-5 w-5" />
            <span className="font-semibold">Calendario Global</span>
            <span className="text-xs text-muted-foreground">
              Ver días festivos y ocupados
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => navigate('/vacaciones/historial')}
          >
            <FileText className="mb-2 h-5 w-5" />
            <span className="font-semibold">Historial</span>
            <span className="text-xs text-muted-foreground">
              Ver todas las solicitudes
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => navigate('/vacaciones/solicitudes')}
          >
            <AlertCircle className="mb-2 h-5 w-5" />
            <span className="font-semibold">Pendientes</span>
            <span className="text-xs text-muted-foreground">
              {stats?.pendingRequests || 0} solicitudes por revisar
            </span>
          </Button>
        </CardContent>
      </Card>

      {/* Solicitudes Recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentRequests?.map((request: any) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/vacaciones/solicitud/${request.id}`)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{request.profiles?.full_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {request.profiles?.employee_number}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(request.start_date).toLocaleDateString('es-MX')} -{' '}
                    {new Date(request.end_date).toLocaleDateString('es-MX')} ({request.days_requested} días)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Folio: {request.request_number}
                  </p>
                </div>
                <Badge variant={statusColors[request.status] || 'default'}>
                  {request.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            ))}

            {(!recentRequests || recentRequests.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                No hay solicitudes recientes
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
