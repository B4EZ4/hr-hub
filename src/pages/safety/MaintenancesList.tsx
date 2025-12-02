import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Wrench, Play, CheckCircle, XCircle } from 'lucide-react';
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
import { MaintenanceActionDialog } from '@/components/maintenance/MaintenanceActionDialog';

export default function MaintenancesList() {
  const navigate = useNavigate();
  const { canManageSH } = useRoles();
  const queryClient = useQueryClient();

  // Estados para los diálogos
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'complete' | 'cancel' | null;
    maintenanceId: string | null;
  }>({ open: false, type: null, maintenanceId: null });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Mutación para eliminar
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
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast.error('Error al eliminar: ' + error.message);
      setDeleteConfirmId(null);
    },
  });

  // Mutación para iniciar
  const startMaintenanceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('inventory_maintenance')
        .update({
          status: 'en_proceso',
          start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-maintenance'] });
      toast.success('Mantenimiento iniciado');
    },
    onError: (error: any) => {
      toast.error('Error al iniciar mantenimiento: ' + error.message);
    },
  });

  // Mutación para completar - VERSIÓN CORREGIDA
  const completeMaintenanceMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      // Obtener el mantenimiento actual para calcular duración
      const { data: currentMaintenance } = await (supabase as any)
        .from('inventory_maintenance')
        .select('start_date')
        .eq('id', id)
        .single();

      const actualDuration = currentMaintenance?.start_date
        ? Math.ceil((new Date().getTime() - new Date(currentMaintenance.start_date).getTime()) / (1000 * 60 * 60 * 24))
        : 1;

      const { error } = await (supabase as any)
        .from('inventory_maintenance')
        .update({
          status: 'completado',
          completion_notes: notes,
          end_date: new Date().toISOString(), // CORREGIDO: usar end_date en lugar de completed_date
          updated_at: new Date().toISOString(),
          actual_duration: actualDuration
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-maintenance'] });
      toast.success('Mantenimiento completado');
      setActionDialog({ open: false, type: null, maintenanceId: null });
    },
    onError: (error: any) => {
      toast.error('Error al completar mantenimiento: ' + error.message);
      setActionDialog({ open: false, type: null, maintenanceId: null });
    },
  });

  // Mutación para cancelar
  const cancelMaintenanceMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await (supabase as any)
        .from('inventory_maintenance')
        .update({
          status: 'cancelado',
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
          end_date: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-maintenance'] });
      toast.success('Mantenimiento cancelado');
      setActionDialog({ open: false, type: null, maintenanceId: null });
    },
    onError: (error: any) => {
      toast.error('Error al cancelar mantenimiento: ' + error.message);
      setActionDialog({ open: false, type: null, maintenanceId: null });
    },
  });

  // Consulta de mantenimientos
  const { data: maintenances = [], isLoading } = useQuery({
    queryKey: ['inventory-maintenance'],
    queryFn: async () => {
      const { data: maintenancesData, error: maintError } = await (supabase as any)
        .from('inventory_maintenance')
        .select(`
          *,
          item:item_id (id, name, category),
          profile:performed_by (user_id, full_name)
        `)
        .order('scheduled_date', { ascending: false });

      if (maintError) throw maintError;
      return maintenancesData || [];
    },
  });

  const statusMap: Record<string, { label: string; variant: any }> = {
    pendiente: { label: 'Pendiente', variant: 'default' },
    en_proceso: { label: 'En Proceso', variant: 'secondary' },
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

  // Columnas actualizadas con duración real
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
      header: 'Fecha Inicio',
      accessorKey: 'start_date',
      cell: (value: string) => value ? new Date(value).toLocaleDateString('es-ES') : '-',
    },
    {
      header: 'Duración',
      accessorKey: 'status',
      cell: (value: string, row: any) => {
        if (value === 'completado' && row.actual_duration) {
          return `${row.actual_duration} día${row.actual_duration > 1 ? 's' : ''}`;
        }
        if (row.estimated_duration) {
          return `Est: ${row.estimated_duration} día${row.estimated_duration > 1 ? 's' : ''}`;
        }
        return '-';
      },
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
      header: 'Responsable',
      accessorKey: 'profile',
      cell: (value: any) => value?.full_name || '-',
    },
  ];

  // Función para manejar acciones
  const handleAction = (type: 'complete' | 'cancel', id: string) => {
    setActionDialog({
      open: true,
      type,
      maintenanceId: id,
    });
  };

  const handleConfirmAction = (notes: string) => {
    if (!actionDialog.maintenanceId || !actionDialog.type) return;

    if (actionDialog.type === 'complete') {
      completeMaintenanceMutation.mutate({
        id: actionDialog.maintenanceId,
        notes
      });
    } else if (actionDialog.type === 'cancel') {
      cancelMaintenanceMutation.mutate({
        id: actionDialog.maintenanceId,
        reason: notes
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Diálogo para acciones */}
      <MaintenanceActionDialog
        open={actionDialog.open}
        onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}
        actionType={actionDialog.type!}
        onConfirm={handleConfirmAction}
        isLoading={
          completeMaintenanceMutation.isPending ||
          cancelMaintenanceMutation.isPending
        }
      />

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
                {/* Acciones para mantenimientos pendientes */}
                {row.status === 'pendiente' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/seguridad-higiene/mantenimientos/${row.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startMaintenanceMutation.mutate(row.id)}
                      disabled={startMaintenanceMutation.isPending}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAction('cancel', row.id)}
                      disabled={cancelMaintenanceMutation.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </>
                )}

                {/* Acciones para mantenimientos en proceso */}
                {row.status === 'en_proceso' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAction('complete', row.id)}
                      disabled={completeMaintenanceMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Terminar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAction('cancel', row.id)}
                      disabled={cancelMaintenanceMutation.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </>
                )}

                {/* Para mantenimientos completados o cancelados, solo mostrar eliminar */}
                {(row.status === 'completado' || row.status === 'cancelado') && (
                  <AlertDialog
                    open={deleteConfirmId === row.id}
                    onOpenChange={(open) => setDeleteConfirmId(open ? row.id : null)}
                  >
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
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(row.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* Para pendiente y en_proceso también mostrar botón de eliminar */}
                {(row.status === 'pendiente' || row.status === 'en_proceso') && (
                  <AlertDialog
                    open={deleteConfirmId === row.id}
                    onOpenChange={(open) => setDeleteConfirmId(open ? row.id : null)}
                  >
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
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(row.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </div>
        )}
      />
    </div>
  );
}