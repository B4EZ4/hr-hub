import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Wrench, Calendar, DollarSign, User, FileText } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';

export default function MaintenanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManageSH } = useRoles();

  const { data: maintenance, isLoading } = useQuery({
    queryKey: ['maintenance-detail', id],
    queryFn: async () => {
      const { data: mainData, error } = await (supabase as any)
        .from('inventory_maintenance')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!mainData) return null;

      // Obtener ítem del inventario
      if (mainData.item_id) {
        const { data: item } = await (supabase as any)
          .from('inventory_items')
          .select('id, name, category, location')
          .eq('id', mainData.item_id)
          .maybeSingle();
        mainData.item = item;
      }

      // Obtener quien realizó el mantenimiento
      if (mainData.performed_by) {
        const { data: performer } = await (supabase as any)
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', mainData.performed_by)
          .maybeSingle();
        mainData.performer = performer;
      }

      return mainData;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!maintenance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Wrench className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Mantenimiento no encontrado</h2>
        <Button onClick={() => navigate('/seguridad-higiene/mantenimientos')}>
          Volver a Mantenimientos
        </Button>
      </div>
    );
  }

  const status = statusMap[maintenance.status] || { label: maintenance.status, variant: 'default' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/mantenimientos')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Wrench className="h-8 w-8 text-primary" />
              Detalle de Mantenimiento
            </h1>
            <p className="text-muted-foreground">
              {typeMap[maintenance.maintenance_type]} - {maintenance.item?.name}
            </p>
          </div>
        </div>
        {canManageSH && (
          <Button onClick={() => navigate(`/seguridad-higiene/mantenimientos/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <div className="mt-1">
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipo de Mantenimiento</label>
              <p className="mt-1 font-medium">{typeMap[maintenance.maintenance_type]}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Ítem</label>
              <p className="mt-1 font-medium">{maintenance.item?.name || 'No especificado'}</p>
              {maintenance.item?.category && (
                <p className="text-sm text-muted-foreground capitalize">{maintenance.item.category}</p>
              )}
              {maintenance.item?.location && (
                <p className="text-sm text-muted-foreground">{maintenance.item.location}</p>
              )}
            </div>

            {maintenance.cost && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Costo
                </label>
                <p className="mt-1 font-medium text-lg">
                  ${maintenance.cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            {maintenance.completion_notes && maintenance.status === 'completado' && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notas de Finalización</label>
                <p className="mt-1 whitespace-pre-wrap">{maintenance.completion_notes}</p>
              </div>
            )}

            {maintenance.cancellation_reason && maintenance.status === 'cancelado' && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Razón de Cancelación</label>
                <p className="mt-1 whitespace-pre-wrap">{maintenance.cancellation_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fechas y Responsable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {maintenance.scheduled_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha Programada</label>
                <p className="mt-1 font-medium">
                  {new Date(maintenance.scheduled_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {maintenance.start_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha de Inicio</label>
                <p className="mt-1 font-medium">
                  {new Date(maintenance.start_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {maintenance.end_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {maintenance.status === 'completado' ? 'Fecha de Finalización' : 'Fecha de Fin'}
                </label>
                <p className="mt-1 font-medium">
                  {new Date(maintenance.end_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {maintenance.estimated_duration && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Duración Estimada</label>
                <p className="mt-1 font-medium">
                  {maintenance.estimated_duration} día{maintenance.estimated_duration > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {maintenance.actual_duration && maintenance.status === 'completado' && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Duración Real</label>
                <p className="mt-1 font-medium">
                  {maintenance.actual_duration} día{maintenance.actual_duration > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {maintenance.performer && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Realizado por
                </label>
                <p className="mt-1 font-medium">{maintenance.performer.full_name}</p>
                <p className="text-sm text-muted-foreground">{maintenance.performer.email}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">Registro Creado</label>
              <p className="mt-1 text-sm">
                {new Date(maintenance.created_at).toLocaleString('es-ES')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {maintenance.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descripción del Trabajo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{maintenance.description}</p>
          </CardContent>
        </Card>
      )}

      {maintenance.observations && (
        <Card>
          <CardHeader>
            <CardTitle>
              {maintenance.status === 'en_proceso' ? 'Progreso del Mantenimiento' : 'Observaciones'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="whitespace-pre-wrap">{maintenance.observations}</p>

              {maintenance.status === 'en_proceso' && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-sm">Mantenimiento en Progreso</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Este mantenimiento está actualmente en ejecución. Las tareas marcadas con ✓ han sido completadas,
                    mientras que las marcadas con ⏳ están pendientes o en proceso.
                  </p>
                </div>
              )}

              {maintenance.status === 'completado' && (
                <div className="mt-4 p-4 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 bg-success rounded-full"></div>
                    <span className="font-medium text-sm text-success">Mantenimiento Completado</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Este mantenimiento fue completado exitosamente. Todos los trabajos especificados han sido realizados y verificados.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {maintenance.file_paths && maintenance.file_paths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Archivos Adjuntos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {maintenance.file_paths.map((path: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{path}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate('/seguridad-higiene/mantenimientos')}>
          Volver a Mantenimientos
        </Button>
        {maintenance.item?.id && (
          <Button variant="outline" onClick={() => navigate(`/seguridad-higiene/inventario/${maintenance.item.id}`)}>
            Ver Ítem de Inventario
          </Button>
        )}
      </div>
    </div>
  );
}