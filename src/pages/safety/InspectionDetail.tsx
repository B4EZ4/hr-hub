import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, FileText } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';

export default function InspectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManageSH } = useRoles();

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['sh-inspection', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sh_inspections')
        .select(`
          *,
          sector:sector_id (name, description, risk_level),
          inspector:inspector_id (full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const statusMap: Record<string, { label: string; variant: any }> = {
    programada: { label: 'Programada', variant: 'default' },
    en_progreso: { label: 'En Progreso', variant: 'default' },
    completada: { label: 'Completada', variant: 'success' },
    cancelada: { label: 'Cancelada', variant: 'outline' },
  };

  const riskMap: Record<string, { label: string; variant: any }> = {
    bajo: { label: 'Bajo', variant: 'success' },
    medio: { label: 'Medio', variant: 'default' },
    alto: { label: 'Alto', variant: 'destructive' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!inspection) {
    return <div>Inspección no encontrada</div>;
  }

  const status = statusMap[inspection.status] || { label: inspection.status, variant: 'default' };
  const risk = inspection.sector?.risk_level
    ? riskMap[inspection.sector.risk_level] || { label: inspection.sector.risk_level, variant: 'default' }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/inspecciones')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalle de Inspección</h1>
            <p className="text-muted-foreground">
              {new Date(inspection.scheduled_date).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
        {canManageSH && (
          <Button onClick={() => navigate(`/seguridad-higiene/inspecciones/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <div className="mt-1">
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Sector</label>
              <p className="mt-1 font-medium">{inspection.sector?.name || 'Sin asignar'}</p>
              {inspection.sector?.description && (
                <p className="text-sm text-muted-foreground">{inspection.sector.description}</p>
              )}
            </div>
            {risk && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nivel de Riesgo</label>
                <div className="mt-1">
                  <Badge variant={risk.variant}>{risk.label}</Badge>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Inspector</label>
              <p className="mt-1 font-medium">{inspection.inspector?.full_name || '-'}</p>
              {inspection.inspector?.email && (
                <p className="text-sm text-muted-foreground">{inspection.inspector.email}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fechas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha Programada</label>
              <p className="mt-1 font-medium">
                {new Date(inspection.scheduled_date).toLocaleDateString('es-ES')}
              </p>
            </div>
            {inspection.completed_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha Completada</label>
                <p className="mt-1 font-medium">
                  {new Date(inspection.completed_date).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Creada</label>
              <p className="mt-1 text-sm">
                {new Date(inspection.created_at).toLocaleString('es-ES')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {inspection.findings && (
        <Card>
          <CardHeader>
            <CardTitle>Hallazgos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{inspection.findings}</p>
          </CardContent>
        </Card>
      )}

      {inspection.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle>Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{inspection.recommendations}</p>
          </CardContent>
        </Card>
      )}

      {inspection.file_paths && inspection.file_paths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Archivos Adjuntos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inspection.file_paths.map((path: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1">{path.split('/').pop()}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const { data } = supabase.storage.from('inspections').getPublicUrl(path);
                      window.open(data.publicUrl, '_blank');
                    }}
                  >
                    Ver
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
