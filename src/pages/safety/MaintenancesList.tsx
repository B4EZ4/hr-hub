import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Wrench } from 'lucide-react';
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

export default function MaintenancesList() {
  const navigate = useNavigate();
  const { canManageSH } = useRoles();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('inventory_maintenance')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-maintenance'] });
      toast.success('Mantenimiento eliminado correctamente');
    },
    onError: (error: any) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  const { data: maintenances = [], isLoading } = useQuery({
    queryKey: ['inventory-maintenance'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inventory_maintenance')
        .select(`
          *,
          item:item_id (name, category)
        `)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const statusMap: Record<string, { label: string; variant: any }> = {
    pendiente: { label: 'Pendiente', variant: 'default' },
    en_proceso: { label: 'En Proceso', variant: 'default' },
    completado: { label: 'Completado', variant: 'success' },
    cancelado: { label: 'Cancelado', variant: 'outline' },
  };

  const typeMap: Record<string, string> = {
    preventivo: 'Preventivo',
    correctivo: 'Correctivo',
    calibracion: 'Calibración',
    limpieza: 'Limpieza',
    otro: 'Otro',
  };

  const columns = [
    {
      header: 'Ítem',
      accessorKey: 'item',
      cell: (value: any) => value?.name || '-',
    },
    {
      header: 'Tipo',
      accessorKey: 'maintenance_type',
      cell: (value: string) => typeMap[value] || value,
    },
    {
      header: 'Fecha Programada',
      accessorKey: 'scheduled_date',
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Wrench className="h-8 w-8 text-primary" />
              Mantenimientos
            </h1>
            <p className="text-muted-foreground">Gestión de mantenimientos de equipos</p>
          </div>
        </div>
          <Button
            onClick={() => navigate('/seguridad-higiene/mantenimientos/new')}
            disabled={!canManageSH}
            title={canManageSH ? undefined : 'Requiere rol Oficial S&H o Superadmin'}
          >
            <Plus className="mr-2 h-4 w-4" />
            Registrar Mantenimiento
          </Button>
      </div>

      <DataTable
        data={maintenances}
        columns={columns}
        searchable
        searchPlaceholder="Buscar mantenimientos..."
        emptyMessage="No hay mantenimientos registrados."
        actions={(row) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/seguridad-higiene/mantenimientos/${row.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver
            </Button>
            {canManageSH && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/seguridad-higiene/mantenimientos/${row.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar mantenimiento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el registro.
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
              </>
            )}
          </div>
        )}
      />
    </div>
  );
}