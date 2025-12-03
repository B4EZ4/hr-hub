import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Briefcase, Filter, Pencil, Plus, Trash2, Calendar, MapPin, Clock, Building, User, FileText, Users, Mail, Phone, ExternalLink } from 'lucide-react';
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
import { useSearchParams } from 'react-router-dom';

type RecruitmentPosition = Tables<'recruitment_positions'> & {
  areas?: Tables<'areas'>;
};

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

interface PositionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: RecruitmentPosition | null;
}

function PositionDetailsDialog({ open, onOpenChange, position }: PositionDetailsDialogProps) {
  const { data: assignedPositions = [] } = useQuery({
    queryKey: ['assigned-positions', position?.areas?.id],
    queryFn: async () => {
      if (!position?.areas?.id) return [];

      const { data, error } = await (supabase as any)
        .from('positions')
        .select(`
          *,
          profiles!inner (
            full_name,
            email,
            status
          )
        `)
        .eq('area_id', position.areas.id)
        .eq('status', 'activo')
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!position?.areas?.id,
  });

  const { data: hiringManager } = useQuery({
    queryKey: ['hiring-manager', position?.hiring_manager],
    queryFn: async () => {
      if (!position?.hiring_manager) return null;

      const { data, error } = await (supabase as any)
        .from('users')
        .select('full_name, email, phone, position')
        .eq('id', position.hiring_manager)
        .single();

      if (error) {
        console.error('Error fetching hiring manager:', error);
        return null;
      }
      return data;
    },
    enabled: !!position?.hiring_manager,
  });

  if (!position) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{position.title}</DialogTitle>
              <DialogDescription className="mt-2">
                {position.department} • {position.location}
              </DialogDescription>
            </div>
            <Badge variant={
              position.status === 'abierta' ? 'default' :
                position.status === 'en_proceso' ? 'secondary' :
                  position.status === 'pausada' ? 'outline' : 'destructive'
            }>
              {statusLabels[position.status] || position.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nivel</p>
                  <p className="font-medium">{position.seniority || 'No especificado'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Horario</p>
                  <p className="font-medium">
                    {position.work_start_time && position.work_end_time
                      ? `${position.work_start_time.slice(0, 5)} - ${position.work_end_time.slice(0, 5)}`
                      : 'No definido'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Ubicación</p>
                  <p className="font-medium">{position.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Publicado</p>
                  <p className="font-medium">{new Date(position.created_at).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información del Área */}
          {position.areas && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Información del Área
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre del Área</p>
                      <p className="font-medium">{position.areas.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <Badge variant={position.areas.status === 'activo' ? 'default' : 'outline'}>
                        {position.areas.status === 'activo' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    {position.areas.description && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Descripción</p>
                        <p className="text-sm">{position.areas.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Responsable de Contratación */}
          {hiringManager && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Responsable de Contratación
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{hiringManager.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <p className="font-medium">{hiringManager.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Posición</p>
                      <p className="font-medium">{hiringManager.position || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Asignaciones en el Área */}
          {assignedPositions.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personal Asignado al Área
                </h3>
                <div className="space-y-3">
                  {assignedPositions.map((assigned: any) => (
                    <div key={assigned.id} className="bg-muted/50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Posición</p>
                          <p className="font-medium">{assigned.title}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Persona Asignada</p>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <p className="font-medium">{assigned.profiles?.full_name || 'No asignado'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Estado</p>
                          <Badge variant={assigned.profiles?.status === 'activo' ? 'default' : 'outline'}>
                            {assigned.profiles?.status === 'activo' ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Descripción del puesto */}
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Descripción del Puesto
            </h3>
            <div className="prose prose-sm max-w-none">
              {position.description ? (
                <div className="whitespace-pre-wrap bg-muted/50 rounded-lg p-4">
                  {position.description}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No hay descripción disponible</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RecruitmentPositionsList() {
  const { canManageRecruitment } = useRoles();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<RecruitmentPosition | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<RecruitmentPosition | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<RecruitmentPosition | null>(null);

  const { data: positions = [], isLoading } = useQuery<RecruitmentPosition[]>({
    queryKey: ['recruitment-positions'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('recruitment_positions')
        .select(`
          *,
          areas!left (
            id,
            name,
            description,
            status,
            parent_area_id
          )
        `)
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
    {
      header: 'Departamento',
      accessorKey: 'department',
      cell: (value: string) => value || '-'
    },
    {
      header: 'Ubicación',
      accessorKey: 'location',
      cell: (value: string) => value || '-'
    },
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
    {
      header: 'Área',
      accessorKey: 'areas.name',
      cell: (value: string) => value || 'Sin área asignada',
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
          <h1 className="text-3xl font-bold tracking-tight">Posiciones de Reclutamiento</h1>
          <p className="text-muted-foreground">Vacantes vigentes con información detallada de áreas y asignaciones</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <CardDescription>Supervisión detallada del estado de cada búsqueda con información de áreas</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredPositions}
            columns={columns}
            searchable
            searchPlaceholder="Buscar por título, departamento, ubicación o área"
            emptyMessage="Todavía no hay vacantes registradas."
            actions={(row) => (
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPosition(row)}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
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
                      className="flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive flex items-center gap-2"
                      onClick={() => setPositionToDelete(row)}
                    >
                      <Trash2 className="h-4 w-4" />
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

      <PositionDetailsDialog
        open={!!selectedPosition}
        onOpenChange={(open) => {
          if (!open) setSelectedPosition(null);
        }}
        position={selectedPosition}
      />

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
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}