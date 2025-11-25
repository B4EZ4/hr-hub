import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

export default function TerminationsDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['terminations-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('despidos')
        .select('estado, tipo_despido');
      
      if (error) throw error;
      
      const total = data.length;
      const pendientes = data.filter(d => d.estado === 'pendiente').length;
      const enProceso = data.filter(d => d.estado === 'en_proceso').length;
      const completados = data.filter(d => d.estado === 'completado').length;
      const cancelados = data.filter(d => d.estado === 'cancelado').length;
      
      return { total, pendientes, enProceso, completados, cancelados };
    },
  });

  const { data: byType, isLoading: typeLoading } = useQuery({
    queryKey: ['terminations-by-type'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('despidos')
        .select('tipo_despido');
      
      if (error) throw error;
      
      const tipoLabels: Record<string, string> = {
        voluntario: 'Voluntario',
        involuntario: 'Involuntario',
        mutuo_acuerdo: 'Mutuo Acuerdo',
        termino_contrato: 'Término Contrato'
      };
      
      const typeCount = data.reduce((acc: any, item) => {
        const label = tipoLabels[item.tipo_despido] || item.tipo_despido;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(typeCount).map(([name, value]) => ({
        name,
        value: value as number,
      }));
    },
  });

  const { data: byStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['terminations-by-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('despidos')
        .select('estado');
      
      if (error) throw error;
      
      const estadoLabels: Record<string, string> = {
        pendiente: 'Pendiente',
        en_proceso: 'En Proceso',
        completado: 'Completado',
        cancelado: 'Cancelado'
      };
      
      const statusCount = data.reduce((acc: any, item) => {
        const label = estadoLabels[item.estado] || item.estado;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(statusCount).map(([name, value]) => ({
        name,
        value: value as number,
      }));
    },
  });

  if (statsLoading || typeLoading || statusLoading) {
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
            <CardTitle className="text-sm font-medium">Total Despidos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats?.pendientes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.enProceso || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats?.completados || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Despidos por Tipo</CardTitle>
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
            <CardTitle>Despidos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {byStatus?.map((entry, index) => (
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
