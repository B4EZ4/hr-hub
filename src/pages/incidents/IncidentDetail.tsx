import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle, MapPin, Calendar, User } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

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
                  <div key={idx} className="border rounded p-2">
                    <p className="text-sm truncate">{path.split('/').pop()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
