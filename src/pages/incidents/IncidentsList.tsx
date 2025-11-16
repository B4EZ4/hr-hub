import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye } from 'lucide-react';

export default function IncidentsList() {
  const navigate = useNavigate();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('incidents')
        .select(`
          *,
          reporter:reported_by (full_name),
          assignee:assigned_to (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const statusMap: Record<string, { label: string; variant: any }> = {
    abierto: { label: 'Abierto', variant: 'default' },
    en_progreso: { label: 'En Progreso', variant: 'default' },
    resuelto: { label: 'Resuelto', variant: 'success' },
    cerrado: { label: 'Cerrado', variant: 'outline' },
  };

  const severityMap: Record<string, { label: string; variant: any }> = {
    baja: { label: 'Baja', variant: 'default' },
    media: { label: 'Media', variant: 'default' },
    alta: { label: 'Alta', variant: 'destructive' },
    critica: { label: 'Crítica', variant: 'destructive' },
  };

  const columns = [
    {
      header: 'Título',
      accessorKey: 'title',
    },
    {
      header: 'Tipo',
      accessorKey: 'incident_type',
      cell: (value: string) => {
        const types: Record<string, string> = {
          accidente: 'Accidente',
          incidente: 'Incidente',
          casi_accidente: 'Casi Accidente',
          condicion_insegura: 'Condición Insegura',
        };
        return types[value] || value;
      },
    },
    {
      header: 'Severidad',
      accessorKey: 'severity',
      cell: (value: string) => {
        const severity = severityMap[value] || { label: value, variant: 'default' };
        return <Badge variant={severity.variant}>{severity.label}</Badge>;
      },
    },
    {
      header: 'Reportado por',
      accessorKey: 'reporter',
      cell: (value: any) => value?.full_name || '-',
    },
    {
      header: 'Asignado a',
      accessorKey: 'assignee',
      cell: (value: any) => value?.full_name || 'Sin asignar',
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: (value: string) => {
        const status = statusMap[value] || { label: value, variant: 'default' };
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      header: 'Fecha',
      accessorKey: 'created_at',
      cell: (value: string) => new Date(value).toLocaleDateString('es-ES'),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidencias</h1>
          <p className="text-muted-foreground">Registro y seguimiento de incidencias</p>
        </div>
        <Button onClick={() => navigate('/incidencias/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Reportar Incidencia
        </Button>
      </div>

      <DataTable
        data={incidents}
        columns={columns}
        searchable
        searchPlaceholder="Buscar incidencias..."
        emptyMessage="No hay incidencias registradas."
        onRowClick={(row) => navigate(`/incidencias/${row.id}`)}
        actions={(row) => (
          <Button variant="ghost" size="sm" onClick={() => navigate(`/incidencias/${row.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalle
          </Button>
        )}
      />
    </div>
  );
}
