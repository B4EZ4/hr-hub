import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

export default function IncidentsDashboard() {
  // Obtener estadísticas generales
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['incidents-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('status, severity, incident_type');
      
      if (error) throw error;
      
      const total = data.length;
      const abiertos = data.filter(i => i.status === 'abierto').length;
      const enProceso = data.filter(i => i.status === 'en_progreso').length;
      const cerrados = data.filter(i => i.status === 'cerrado').length;
      
      return { total, abiertos, enProceso, cerrados };
    },
  });

  // Obtener incidencias agrupadas por tipo
  const { data: byType, isLoading: typeLoading } = useQuery({
    queryKey: ['incidents-by-type'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('incident_type');
      
      if (error) throw error;
      
      const typeCount = data.reduce((acc: any, item) => {
        acc[item.incident_type] = (acc[item.incident_type] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(typeCount).map(([name, value]) => ({
        name,
        value: value as number,
      }));
    },
  });

  // Obtener incidencias agrupadas por severidad
  const { data: bySeverity, isLoading: severityLoading } = useQuery({
    queryKey: ['incidents-by-severity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('severity');
      
      if (error) throw error;
      
      const severityCount = data.reduce((acc: any, item) => {
        acc[item.severity] = (acc[item.severity] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(severityCount).map(([name, value]) => ({
        name,
        value: value as number,
      }));
    },
  });

  if (statsLoading || typeLoading || severityLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidencias</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abiertas</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.abiertos || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats?.enProceso || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cerradas</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats?.cerrados || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Incidencias por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--primary))" name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incidencias por Severidad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bySeverity}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bySeverity?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
