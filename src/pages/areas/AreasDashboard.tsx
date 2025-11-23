import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckSquare, FileText, TrendingUp, Users, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export const AreasDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['areas-dashboard-stats'],
    queryFn: async () => {
      const [areasRes, vacanciesRes, promotionsRes, activitiesRes] = await Promise.all([
        supabase.from('areas').select('*', { count: 'exact' }).eq('status', 'activo'),
        supabase.from('job_vacancies').select('*', { count: 'exact' }).eq('status', 'abierta'),
        supabase.from('promotions').select('*', { count: 'exact' }).eq('status', 'propuesta'),
        supabase.from('employee_activities').select('*', { count: 'exact' }).eq('status', 'pendiente'),
      ]);

      return {
        activeAreas: areasRes.count || 0,
        openVacancies: vacanciesRes.count || 0,
        pendingPromotions: promotionsRes.count || 0,
        pendingActivities: activitiesRes.count || 0,
      };
    },
  });

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
          Gestión de estructura organizacional, vacantes y desarrollo de personal
        </p>
      </div>

      {/* Dashboard Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Áreas Activas</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAreas}</div>
            <p className="text-xs text-muted-foreground">Estructura organizacional</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Vacantes Abiertas</CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openVacancies}</div>
            <p className="text-xs text-muted-foreground">Posiciones disponibles</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Promociones Pendientes</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingPromotions}</div>
            <p className="text-xs text-muted-foreground">En revisión</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Actividades Pendientes</CardTitle>
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingActivities}</div>
            <p className="text-xs text-muted-foreground">Tareas asignadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Gestiona las operaciones principales del módulo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link to="/areas/lista">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Gestionar Áreas
              </Button>
            </Link>
            <Link to="/areas/vacantes">
              <Button variant="outline" className="w-full justify-start">
                <Briefcase className="mr-2 h-4 w-4" />
                Vacantes
              </Button>
            </Link>
            <Link to="/areas/promociones">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                Promociones
              </Button>
            </Link>
            <Link to="/areas/capacitacion">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Capacitación
              </Button>
            </Link>
            <Link to="/areas/evaluaciones">
              <Button variant="outline" className="w-full justify-start">
                <CheckSquare className="mr-2 h-4 w-4" />
                Evaluaciones
              </Button>
            </Link>
            <Link to="/areas/actividades">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Actividades
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
