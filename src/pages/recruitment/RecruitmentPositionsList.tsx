import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Filter, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRoles } from '@/hooks/useRoles';
import { NewPositionDialog } from './NewPositionDialog';
import type { Tables } from '@/integrations/supabase/types';
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

type RecruitmentPosition = Tables<'recruitment_positions'>;

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  abierta: 'default',
  en_proceso: 'secondary',
  pausada: 'outline',
  cerrada: 'destructive',
};

const statusLabels: Record<string, string> = {
  abierta: 'Abierta',
  en_proceso: 'En proceso',
  pausada: 'En pausa',
  cerrada: 'Cerrada',
};

const formatSchedule = (start?: string | null, end?: string | null) => {
  if (!start && !end) return 'No definido';
  if (!start || !end) return 'Incompleto';
  const format = (value: string) => value?.slice(0, 5) || value;
  return `${format(start)} - ${format(end)}`;
};

import { useSearchParams } from 'react-router-dom';

export default function RecruitmentPositionsList() {
  const { canManageRecruitment } = useRoles();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<RecruitmentPosition | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<RecruitmentPosition | null>(null);

  const { data: positions = [], isLoading } = useQuery<RecruitmentPosition[]>({
    queryKey: ['recruitment-positions'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('recruitment_positions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredPositions = positions.filter(position =>
    statusFilter ? position.status === statusFilter : true
  );

  const columns = [
    { header: 'Título', accessorKey: 'title' },
    { header: 'Departamento', accessorKey: 'department' },
    { header: 'Ubicación', accessorKey: 'location' },
    {
      header: 'Nivel',
      accessorKey: 'seniority',
      cell: (value: string) => value || '-',
    },
    {
      header: 'Horario',
      accessorKey: 'work_start_time',
      cell: (_value: string, row: RecruitmentPosition) => formatSchedule(row.work_start_time, row.work_end_time),
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: (value: string) => (
        <Badge variant={statusVariants[value] || 'outline'}>
          {statusLabels[value] || value}
        </Badge>
      ),
    },
  ];

  const deleteMutation = useMutation({
    mutationFn: async (positionId: string) => {
      const { error } = await (supabase as any)
        .from('recruitment_positions')
        .delete()
        .eq('id', positionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Posición eliminada');
      queryClient.invalidateQueries({ queryKey: ['recruitment-positions'] });
      queryClient.invalidateQueries({ queryKey: ['recruitment-positions', 'open-list'] });
      setPositionToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'No se pudo eliminar la posición');
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posiciones</h1>
          <p className="text-muted-foreground">Vacantes vigentes y su estado</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => toast.info('Los filtros avanzados estarán disponibles pronto')}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          {canManageRecruitment && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva posición
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Pipeline de vacantes
          </CardTitle>
          <CardDescription>Supervisión rápida del estado de cada búsqueda</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredPositions}
            columns={columns}
            searchable
            searchPlaceholder="Buscar por título, departamento o ubicación"
            emptyMessage="Todavía no hay vacantes registradas."
            actions={(row) => (
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toast.info(`Seguimiento detallado para "${row.title}" pronto disponible`)}
                >
                  Ver detalles
                </Button>
                {canManageRecruitment && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingPosition(row);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setPositionToDelete(row)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </>
                )}
              </div>
            )}
          />
        </CardContent>
      </Card>

      {canManageRecruitment && (
        <NewPositionDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingPosition(null);
          }}
          position={editingPosition}
        />
      )}

      {canManageRecruitment && (
        <AlertDialog
          open={Boolean(positionToDelete)}
          onOpenChange={(open) => {
            if (!open && !deleteMutation.isPending) {
              setPositionToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar posición</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará la vacante y sus postulaciones asociadas. ¿Confirmas?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
                onClick={() => positionToDelete && deleteMutation.mutate(positionToDelete.id)}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
