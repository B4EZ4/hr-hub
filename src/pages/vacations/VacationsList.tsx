import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, X } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { toast } from 'sonner';

export default function VacationsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canApproveVacations } = useRoles();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['vacation-requests'],
    queryFn: async () => {
      const query = (supabase as any)
        .from('vacation_requests')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (!canApproveVacations) {
        query.eq('user_id', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'aprobado' | 'rechazado' }) => {
      const { error } = await (supabase as any)
        .from('vacation_requests')
        .update({
          status,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vacation-requests'] });
      toast.success(
        variables.status === 'aprobado'
          ? 'Solicitud aprobada'
          : 'Solicitud rechazada'
      );
      setSelectedRequest(null);
      setActionType(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al procesar solicitud');
    },
  });

  const statusMap: Record<string, { label: string; variant: any }> = {
    pendiente: { label: 'Pendiente', variant: 'default' },
    aprobado: { label: 'Aprobado', variant: 'success' },
    rechazado: { label: 'Rechazado', variant: 'destructive' },
    cancelado: { label: 'Cancelado', variant: 'outline' },
  };

  const columns = [
    {
      header: 'Empleado',
      accessorKey: 'profiles',
      cell: (value: any) => value?.full_name || '-',
    },
    {
      header: 'Inicio',
      accessorKey: 'start_date',
      cell: (value: string) => new Date(value).toLocaleDateString('es-ES'),
    },
    {
      header: 'Fin',
      accessorKey: 'end_date',
      cell: (value: string) => new Date(value).toLocaleDateString('es-ES'),
    },
    {
      header: 'Días',
      accessorKey: 'days_requested',
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
      header: 'Solicitado',
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
          <h1 className="text-3xl font-bold tracking-tight">Solicitudes de Vacaciones</h1>
          <p className="text-muted-foreground">
            {canApproveVacations
              ? 'Gestiona las solicitudes de vacaciones del equipo'
              : 'Tus solicitudes de vacaciones'}
          </p>
        </div>
        <Button onClick={() => navigate('/vacaciones/solicitar')}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Solicitud
        </Button>
      </div>

      <DataTable
        data={requests}
        columns={columns}
        searchable
        searchPlaceholder="Buscar solicitudes..."
        emptyMessage="No hay solicitudes de vacaciones. Crea tu primera solicitud."
        actions={
          canApproveVacations
            ? (row) =>
                (row as any).status === 'pendiente' ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(row);
                        setActionType('approve');
                      }}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(row);
                        setActionType('reject');
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                ) : null
            : undefined
        }
      />

      <AlertDialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve'
                ? `¿Estás seguro de aprobar la solicitud de ${selectedRequest?.profiles?.full_name} por ${selectedRequest?.days_requested} días?`
                : `¿Estás seguro de rechazar la solicitud de ${selectedRequest?.profiles?.full_name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedRequest && actionType) {
                  approvalMutation.mutate({
                    id: selectedRequest.id,
                    status: actionType === 'approve' ? 'aprobado' : 'rechazado',
                  });
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
