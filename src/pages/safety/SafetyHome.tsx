import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, ClipboardList, Package, CheckSquare, AlertTriangle, Wrench, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { useRoles } from '@/hooks/useRoles';

export default function SafetyHome() {
  const navigate = useNavigate();
  const { canManageSH } = useRoles();

  const { data: stats } = useQuery({
    queryKey: ['sh-stats'],
    queryFn: async () => {
      const [inspections, alerts, maintenances, evaluations] = await Promise.all([
        (supabase as any).from('sh_inspections').select('*', { count: 'exact', head: true }),
        (supabase as any).from('inventory_alerts').select('*', { count: 'exact', head: true }).eq('is_resolved', false),
        (supabase as any).from('inventory_maintenance').select('*', { count: 'exact', head: true }).eq('status', 'pendiente'),
        (supabase as any).from('sh_area_evaluations').select('average_score'),
      ]);

      const avgScore = evaluations.data?.length > 0
        ? Math.round(evaluations.data.reduce((sum: number, e: any) => sum + e.average_score, 0) / evaluations.data.length)
        : 0;

      return {
        totalInspections: inspections.count || 0,
        activeAlerts: alerts.count || 0,
        pendingMaintenance: maintenances.count || 0,
        complianceScore: avgScore,
      };
    },
  });

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Seguridad e Higiene
          </h1>
          <p className="text-muted-foreground">Centro de control integral de S&H</p>
        </div>
      </header>

      {/* Indicadores Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inspecciones</p>
                <div className="text-2xl font-bold">{stats?.totalInspections || 0}</div>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertas Activas</p>
                <div className="text-2xl font-bold">{stats?.activeAlerts || 0}</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mantenimientos Pendientes</p>
                <div className="text-2xl font-bold">{stats?.pendingMaintenance || 0}</div>
              </div>
              <Wrench className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cumplimiento General</p>
                <div className="text-2xl font-bold">{stats?.complianceScore || 0}%</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Módulos */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Inspecciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Planificación, ejecución y seguimiento de inspecciones.</p>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => navigate('/seguridad-higiene/inspecciones')}>Ver</Button>
              <Button variant="outline" onClick={() => navigate('/seguridad-higiene/sectores')}>Sectores</Button>
              {canManageSH && (
                <Button variant="outline" onClick={() => navigate('/seguridad-higiene/inspecciones/new')}>Nueva</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" /> Checklists
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Listas de verificación reutilizables para inspecciones.</p>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => navigate('/seguridad-higiene/checklists')}>Ver</Button>
              {canManageSH && (
                <Button variant="outline" onClick={() => navigate('/seguridad-higiene/checklists/new')}>Crear</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Inventario S&H
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Gestión de EPP, herramientas y equipos vinculados a S&H.</p>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => navigate('/seguridad-higiene/inventario')}>Ver</Button>
              {canManageSH && (
                <>
                  <Button variant="outline" onClick={() => navigate('/seguridad-higiene/inventario/asignar')}>Asignar</Button>
                  <Button variant="outline" onClick={() => navigate('/seguridad-higiene/inventario/new')}>Agregar</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Evaluaciones de Áreas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Análisis de condiciones de seguridad e higiene por sector.</p>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => navigate('/seguridad-higiene/evaluaciones')}>Ver</Button>
              {canManageSH && (
                <Button variant="outline" onClick={() => navigate('/seguridad-higiene/evaluaciones/new')}>Nueva</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" /> Mantenimientos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Registro y seguimiento de mantenimientos de equipos.</p>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => navigate('/seguridad-higiene/mantenimientos')}>Ver</Button>
              {canManageSH && (
                <Button variant="outline" onClick={() => navigate('/seguridad-higiene/mantenimientos/new')}>Registrar</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Alertas de stock, mantenimiento y revisiones pendientes.</p>
            <div className="flex items-center justify-between">
              <Button onClick={() => navigate('/seguridad-higiene/alertas')}>Ver Alertas</Button>
              {(stats?.activeAlerts || 0) > 0 && (
                <Badge variant="destructive">{stats?.activeAlerts} activas</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
