import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle, MapPin, Calendar, User, Download } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editSeverity, setEditSeverity] = useState('');
  const [saving, setSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('incidents')
        .select(`
          *,
          reporter:reported_by (full_name, email),
          assignee:assigned_to (full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">Incidencia no encontrada</p>
        <Button onClick={() => navigate('/incidencias')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

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

  const typeMap: Record<string, string> = {
    accidente: 'Accidente',
    incidente: 'Incidente',
    casi_accidente: 'Casi Accidente',
    condicion_insegura: 'Condición Insegura',
  };

  const status = statusMap[incident.status] || { label: incident.status, variant: 'default' };
  const severity = severityMap[incident.severity] || { label: incident.severity, variant: 'default' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/incidencias')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{incident.title}</h1>
            <p className="text-muted-foreground">{typeMap[incident.incident_type]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={severity.variant}>{severity.label}</Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Initialize edit form from current incident and open modal
              setEditTitle(incident.title || '');
              setEditDescription(incident.description || '');
              setEditStatus(incident.status || 'abierto');
              setEditSeverity(incident.severity || 'baja');
              setIsEditOpen(true);
            }}
          >
            Editar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Incidencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {incident.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Ubicación</p>
                  <p className="font-medium">{incident.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Reporte</p>
                <p className="font-medium">
                  {new Date(incident.created_at).toLocaleString('es-ES')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Severidad</p>
                <p className="font-medium">{severity.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personas Involucradas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Reportado por</p>
                <p className="font-medium">{incident.reporter?.full_name}</p>
                <p className="text-sm text-muted-foreground">{incident.reporter?.email}</p>
              </div>
            </div>

            {incident.assignee && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Asignado a</p>
                  <p className="font-medium">{incident.assignee.full_name}</p>
                  <p className="text-sm text-muted-foreground">{incident.assignee.email}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{incident.description}</p>
          </CardContent>
        </Card>

        {incident.resolution && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Resolución</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{incident.resolution}</p>
              {incident.resolved_at && (
                <p className="text-sm text-muted-foreground mt-2">
                  Resuelto el: {new Date(incident.resolved_at).toLocaleString('es-ES')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {incident.file_paths && incident.file_paths.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Evidencias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-3">
                {incident.file_paths.map((path: string, idx: number) => (
                  <div key={idx} className="border rounded p-2 flex items-center justify-between">
                    <p className="text-sm truncate mr-2">{path.split('/').pop()}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            // Bucket for incident files is `documents` with path stored in `path`
                            const { data } = supabase.storage.from('documents').getPublicUrl(path);
                            const publicUrl = (data as any)?.publicUrl;
                            if (publicUrl) {
                              window.open(publicUrl, '_blank');
                              return;
                            }

                            // Fallback: try createSignedUrl for short-lived access
                            const { data: signedData, error: signedError } = await supabase.storage
                              .from('documents')
                              .createSignedUrl(path, 60);
                            if (signedError) throw signedError;
                            if (signedData?.signedUrl) {
                              window.open(signedData.signedUrl, '_blank');
                              return;
                            }

                            toast.error('No se pudo obtener la URL del archivo');
                          } catch (err: any) {
                            console.error('Error opening file', err);
                            toast.error(err?.message || 'Error al abrir el archivo');
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar Incidencia</AlertDialogTitle>
            <AlertDialogDescription>Modifica los campos y guarda los cambios.</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Título</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Descripción</label>
              <Textarea rows={4} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Estado</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abierto">Abierto</SelectItem>
                    <SelectItem value="en_progreso">En Progreso</SelectItem>
                    <SelectItem value="resuelto">Resuelto</SelectItem>
                    <SelectItem value="cerrado">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Severidad</label>
                <Select value={editSeverity} onValueChange={setEditSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  setSaving(true);
                  const { error } = await (supabase as any)
                    .from('incidents')
                    .update({
                      title: editTitle,
                      description: editDescription,
                      status: editStatus,
                      severity: editSeverity,
                    })
                    .eq('id', id);

                  if (error) throw error;
                  await queryClient.invalidateQueries({ queryKey: ['incident', id] });
                  await queryClient.invalidateQueries({ queryKey: ['incidents'] });
                  setIsEditOpen(false);
                } catch (e) {
                  console.error('Error updating incident', e);
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-end">
        <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
          Eliminar incidencia
        </Button>
      </div>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar incidencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la incidencia permanentemente. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                  try {
                    setDeleting(true);
                    const { error } = await (supabase as any).from('incidents').delete().eq('id', id);
                    if (error) throw error;
                    // Invalidate queries and wait for cache to update
                    await queryClient.invalidateQueries({ queryKey: ['incidents'] });
                    await queryClient.invalidateQueries({ queryKey: ['incident', id] });
                    // Close dialog first so UI updates, then navigate
                    setIsDeleteOpen(false);
                    toast.success('Incidencia eliminada');
                    // Small delay to ensure toast is visible before navigation
                    setTimeout(() => navigate('/incidencias'), 250);
                  } catch (e: any) {
                    console.error('Error deleting incident', e);
                    toast.error(e?.message || 'Error al eliminar incidencia');
                    // keep dialog open so user can retry or cancel
                  } finally {
                    setDeleting(false);
                  }
                }}
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
