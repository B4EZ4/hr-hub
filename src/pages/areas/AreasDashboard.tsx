import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckSquare, FileText, TrendingUp, Users, Briefcase, Bell, StickyNote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const AreasDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['areas-dashboard-stats'],
    queryFn: async () => {
      const [positionsRes, vacanciesRes, promotionsRes, activitiesRes] = await Promise.all([
        supabase.from('positions').select('*', { count: 'exact' }).eq('status', 'active'),
        supabase.from('recruitment_positions').select('*', { count: 'exact' }).eq('status', 'abierta'),
        supabase.from('promotions').select('*', { count: 'exact' }).eq('status', 'propuesta'),
        supabase.from('employee_activities').select('*', { count: 'exact' }).eq('status', 'pendiente'),
      ]);

      return {
        activePositions: positionsRes.count || 0,
        openVacancies: vacanciesRes.count || 0,
        pendingPromotions: promotionsRes.count || 0,
        pendingActivities: activitiesRes.count || 0,
      };
    },
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['pending-notifications'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  const saveNotes = () => {
    toast.success('Notas guardadas');
    // Aquí podrías persistir las notas en localStorage o BD
    localStorage.setItem('areas-dashboard-notes', notes);
  };

  // Cargar notas del localStorage al montar
  useState(() => {
    const savedNotes = localStorage.getItem('areas-dashboard-notes');
    if (savedNotes) setNotes(savedNotes);
  });

  // Datos de ejemplo para la gráfica
  const chartData = [
    { name: 'Vacantes', valor: stats?.openVacancies || 0, fill: 'hsl(var(--chart-1))' },
    { name: 'Promociones', valor: stats?.pendingPromotions || 0, fill: 'hsl(var(--chart-2))' },
    { name: 'Actividades', valor: stats?.pendingActivities || 0, fill: 'hsl(var(--chart-3))' },
    { name: 'Posiciones', valor: stats?.activePositions || 0, fill: 'hsl(var(--chart-4))' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Áreas y Asignaciones</h1>
        <p className="text-muted-foreground mt-2">
          Panel de control para gestión de estructura organizacional y personal
        </p>
      </div>

      {/* Panel de Control Superior */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Calendario */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendario
            </CardTitle>
            <CardDescription>Selector de fechas importantes</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="pointer-events-auto rounded-md border"
              locale={es}
            />
          </CardContent>
        </Card>

        {/* Panel de Notificaciones */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Acciones Pendientes
              {notifications.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {notifications.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Notificaciones y tareas pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notif: any) => (
                  <div key={notif.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-xs text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notif.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay acciones pendientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica de Desempeño y Notas */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfica de Métricas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Métricas del Módulo
            </CardTitle>
            <CardDescription>Resumen de datos relevantes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Panel de Notas Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Notas Rápidas
            </CardTitle>
            <CardDescription>Apuntes y recordatorios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Tus notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Escribe tus apuntes aquí..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={8}
                  className="mt-2"
                />
              </div>
              <Button onClick={saveNotes} className="w-full">
                Guardar Notas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Widgets - Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Posiciones Activas</CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats?.activePositions}</div>
            <p className="text-xs text-muted-foreground mt-1">Catálogo de puestos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-chart-1/10 to-chart-1/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Vacantes Abiertas</CardTitle>
            <Briefcase className="w-5 h-5 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.openVacancies}</div>
            <p className="text-xs text-muted-foreground mt-1">Posiciones disponibles</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-chart-2/10 to-chart-2/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Promociones Pendientes</CardTitle>
            <TrendingUp className="w-5 h-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.pendingPromotions}</div>
            <p className="text-xs text-muted-foreground mt-1">En revisión</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-chart-3/10 to-chart-3/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Actividades Pendientes</CardTitle>
            <CheckSquare className="w-5 h-5 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.pendingActivities}</div>
            <p className="text-xs text-muted-foreground mt-1">Tareas asignadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accede a las secciones principales del módulo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link to="/reclutamiento/posiciones">
              <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-primary/5">
                <Users className="mr-3 h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Gestionar Áreas</div>
                  <div className="text-xs text-muted-foreground">Estructura organizacional</div>
                </div>
              </Button>
            </Link>
            <Link to="/reclutamiento/posiciones?status=abierta">
              <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-chart-1/5">
                <Briefcase className="mr-3 h-5 w-5 text-chart-1" />
                <div className="text-left">
                  <div className="font-semibold">Vacantes</div>
                  <div className="text-xs text-muted-foreground">Posiciones abiertas</div>
                </div>
              </Button>
            </Link>
            <Link to="/areas/promociones">
              <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-chart-2/5">
                <TrendingUp className="mr-3 h-5 w-5 text-chart-2" />
                <div className="text-left">
                  <div className="font-semibold">Promociones</div>
                  <div className="text-xs text-muted-foreground">Ascensos y movimientos</div>
                </div>
              </Button>
            </Link>
            <Link to="/areas/personal">
              <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-chart-3/5">
                <Users className="mr-3 h-5 w-5 text-chart-3" />
                <div className="text-left">
                  <div className="font-semibold">Personal</div>
                  <div className="text-xs text-muted-foreground">Desarrollo y evaluación</div>
                </div>
              </Button>
            </Link>
            <Link to="/areas/capacitacion">
              <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-chart-4/5">
                <FileText className="mr-3 h-5 w-5 text-chart-4" />
                <div className="text-left">
                  <div className="font-semibold">Capacitación</div>
                  <div className="text-xs text-muted-foreground">Programas de formación</div>
                </div>
              </Button>
            </Link>
            <Link to="/areas/actividades">
              <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-chart-5/5">
                <CheckSquare className="mr-3 h-5 w-5 text-chart-5" />
                <div className="text-left">
                  <div className="font-semibold">Actividades</div>
                  <div className="text-xs text-muted-foreground">Tareas y seguimiento</div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
