import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Play, CheckCircle, XCircle } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function InspectionsList() {
  const navigate = useNavigate();
  const { canManageSH } = useRoles();
  const queryClient = useQueryClient();

  // Mutación para iniciar inspección
  const startInspectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('sh_inspections')
        .update({
          status: 'en_progreso',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sh-inspections'] });
      toast.success('Inspección iniciada');
    },
    onError: (error: any) => {
      toast.error('Error al iniciar inspección: ' + error.message);
    },
  });

  // Mutación para completar inspección
  const completeInspectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('sh_inspections')
        .update({
          status: 'completada',
          completed_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sh-inspections'] });
      toast.success('Inspección completada');
    },
    onError: (error: any) => {
      toast.error('Error al completar inspección: ' + error.message);
    },
  });

  // Mutación para cancelar inspección
  const cancelInspectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('sh_inspections')
        .update({
          status: 'cancelada',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sh-inspections'] });
      toast.success('Inspección cancelada');
    },
    onError: (error: any) => {
      toast.error('Error al cancelar inspección: ' + error.message);
    },
  });

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['sh-inspections'],
    queryFn: async () => {
      const { data: inspectionsData, error: inspError } = await (supabase as any)
        .from('sh_inspections')
        .select(`
          *,
          sector:sector_id (id, name),
          inspector:inspector_id (id, full_name)
        `)
        .order('scheduled_date', { ascending: false });

      if (inspError) throw inspError;
      return inspectionsData || [];
    },
  });

  const statusMap: Record<string, { label: string; variant: any }> = {
    programada: { label: 'Programada', variant: 'default' },
    en_progreso: { label: 'En Progreso', variant: 'secondary' },
    completada: { label: 'Completada', variant: 'success' },
    cancelada: { label: 'Cancelada', variant: 'outline' },
  };

  const columns = [
    {
      header: 'Sector',
      accessorKey: 'sector',
      cell: (value: any) => value?.name || 'Sin asignar',
    },
    {
      header: 'Inspector',
      accessorKey: 'inspector',
      cell: (value: any) => value?.full_name || '-',
    },
    {
      header: 'Fecha Programada',
      accessorKey: 'scheduled_date',
      cell: (value: string) => new Date(value).toLocaleDateString('es-ES'),
    },
    {
      header: 'Fecha Completada',
      accessorKey: 'completed_date',
      cell: (value: string) => value ? new Date(value).toLocaleDateString('es-ES') : '-',
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: (value: string) => {
        const status = statusMap[value] || { label: value, variant: 'default' };
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
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
          <h1 className="text-3xl font-bold tracking-tight">Inspecciones de Seguridad</h1>
          <p className="text-muted-foreground">Gestión de inspecciones y auditorías</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/seguridad-higiene/sectores')}>
            Sectores
          </Button>
          <Button
            onClick={() => navigate('/seguridad-higiene/inspecciones/new')}
            disabled={!canManageSH}
            title={canManageSH ? undefined : 'Requiere rol Oficial S&H o Superadmin'}
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear Inspección
          </Button>
        </div>
      </div>

      <DataTable
        data={inspections}
        columns={columns}
        searchable
        searchPlaceholder="Buscar inspecciones..."
        emptyMessage="No hay inspecciones programadas."
        onRowClick={(row) => navigate(`/seguridad-higiene/inspecciones/${row.id}`)}
        actions={(row: any) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/seguridad-higiene/inspecciones/${row.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver
            </Button>

            {canManageSH && (
              <>
                {row.status === 'programada' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/seguridad-higiene/inspecciones/${row.id}/edit`)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startInspectionMutation.mutate(row.id)}
                      disabled={startInspectionMutation.isPending}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelInspectionMutation.mutate(row.id)}
                      disabled={cancelInspectionMutation.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </>
                )}

                {row.status === 'en_progreso' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => completeInspectionMutation.mutate(row.id)}
                      disabled={completeInspectionMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Completar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelInspectionMutation.mutate(row.id)}
                      disabled={cancelInspectionMutation.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      />
    </div>
  );
}