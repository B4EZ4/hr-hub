import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function SectorsList() {
  const navigate = useNavigate();
  const { canManageSH } = useRoles();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('sh_sectors')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sh-sectors'] });
      toast.success('Sector eliminado correctamente');
    },
    onError: (error: any) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  const { data: sectors = [], isLoading } = useQuery({
    queryKey: ['sh-sectors'],
    queryFn: async () => {
      const { data: sectorsData, error } = await (supabase as any)
        .from('sh_sectors')
        .select('*')
        .order('name');

      if (error) throw error;

      // Obtener responsables
      const responsibleIds = sectorsData
        ?.map((s: any) => s.responsible_id)
        .filter(Boolean) || [];

      let responsiblesMap: Record<string, any> = {};
      
      if (responsibleIds.length > 0) {
        const { data: responsibles } = await (supabase as any)
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', responsibleIds);

        responsiblesMap = (responsibles || []).reduce((acc: any, r: any) => {
          acc[r.user_id] = r;
          return acc;
        }, {});
      }

      return (sectorsData || []).map((sector: any) => ({
        ...sector,
        responsible: sector.responsible_id ? responsiblesMap[sector.responsible_id] : null,
      }));
    },
  });

  const riskMap: Record<string, { label: string; variant: any }> = {
    bajo: { label: 'Bajo', variant: 'success' },
    medio: { label: 'Medio', variant: 'default' },
    alto: { label: 'Alto', variant: 'destructive' },
  };

  const columns = [
    {
      header: 'Nombre',
      accessorKey: 'name',
    },
    {
      header: 'Descripción',
      accessorKey: 'description',
      cell: (value: string) => value || '-',
    },
    {
      header: 'Nivel de Riesgo',
      accessorKey: 'risk_level',
      cell: (value: string) => {
        const risk = riskMap[value] || { label: value, variant: 'default' };
        return <Badge variant={risk.variant}>{risk.label}</Badge>;
      },
    },
    {
      header: 'Responsable',
      accessorKey: 'responsible',
      cell: (value: any) => value?.full_name || 'Sin asignar',
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sectores</h1>
            <p className="text-muted-foreground">Gestión de sectores de seguridad e higiene</p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/seguridad-higiene/sectores/new')}
          disabled={!canManageSH}
          title={canManageSH ? undefined : 'Requiere rol Oficial S&H o Superadmin'}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Sector
        </Button>
      </div>

      <DataTable
        data={sectors}
        columns={columns}
        searchable
        searchPlaceholder="Buscar sectores..."
        emptyMessage="No hay sectores registrados."
        onRowClick={(row) => navigate(`/seguridad-higiene/sectores/${row.id}/edit`)}
        actions={(row) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/seguridad-higiene/sectores/${row.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/seguridad-higiene/inspecciones?sector=${row.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver inspecciones
            </Button>
            {canManageSH ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar sector?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente el sector.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate(row.id)}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button variant="ghost" size="sm" disabled title="Requiere rol Oficial S&H o Superadmin">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            )}
          </div>
        )}
      />
    </div>
  );
}
