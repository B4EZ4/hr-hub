import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, MapPin, User, AlertTriangle, ClipboardCheck, FileText } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';

export default function SectorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManageSH } = useRoles();

  const { data: sector, isLoading: sectorLoading } = useQuery({
    queryKey: ['sector-detail', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sh_sectors')
        .select(`
          *,
          responsible:responsible_id (full_name, email, position)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['sector-inspections', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sh_inspections')
        .select('id, scheduled_date, status, inspector:inspector_id(full_name)')
        .eq('sector_id', id)
        .order('scheduled_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['sector-evaluations', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sh_area_evaluations')
        .select('id, evaluation_date, average_score, evaluator:evaluated_by(full_name)')
        .eq('sector_id', id)
        .order('evaluation_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  const riskMap: Record<string, { label: string; variant: any; icon: string }> = {
    bajo: { label: 'Riesgo Bajo', variant: 'success', icon: '✅' },
    medio: { label: 'Riesgo Medio', variant: 'default', icon: '⚠️' },
    alto: { label: 'Riesgo Alto', variant: 'destructive', icon: '🔴' },
  };

  const statusMap: Record<string, { label: string; variant: any }> = {
    programada: { label: 'Programada', variant: 'default' },
    en_curso: { label: 'En Curso', variant: 'default' },
    completada: { label: 'Completada', variant: 'success' },
    cancelada: { label: 'Cancelada', variant: 'outline' },
  };

  if (sectorLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sector) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <MapPin className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Sector no encontrado</h2>
        <Button onClick={() => navigate('/seguridad-higiene/sectores')}>
          Volver a Sectores
        </Button>
      </div>
    );
  }

  const risk = sector.risk_level ? riskMap[sector.risk_level] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/sectores')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MapPin className="h-8 w-8 text-primary" />
              {sector.name}
            </h1>
            {risk && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl">{risk.icon}</span>
                <Badge variant={risk.variant}>{risk.label}</Badge>
              </div>
            )}
          </div>
        </div>
        {canManageSH && (
          <Button onClick={() => navigate(`/seguridad-higiene/sectores/${id}/edit`)}>
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
              Información del Sector
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sector.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                <p className="mt-1 whitespace-pre-wrap">{sector.description}</p>
              </div>
            )}

            {risk && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Nivel de Riesgo
                </label>
                <div className="mt-2">
                  <Badge variant={risk.variant} className="text-base px-3 py-1">
                    {risk.icon} {risk.label}
                  </Badge>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha de Creación</label>
              <p className="mt-1 text-sm">
                {new Date(sector.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Responsable del Sector
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sector.responsible ? (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                  <p className="mt-1 font-medium text-lg">{sector.responsible.full_name}</p>
                </div>
                {sector.responsible.position && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cargo</label>
                    <p className="mt-1">{sector.responsible.position}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="mt-1 text-sm">{sector.responsible.email}</p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No hay responsable asignado</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Últimas Inspecciones ({inspections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inspections.length > 0 ? (
            <div className="space-y-3">
              {inspections.map((inspection: any) => (
                <div 
                  key={inspection.id} 
                  className="flex items-center justify-between p-3 border rounded hover:bg-accent cursor-pointer"
                  onClick={() => navigate(`/seguridad-higiene/inspecciones/${inspection.id}`)}
                >
                  <div>
                    <p className="font-medium">
                      {new Date(inspection.scheduled_date).toLocaleDateString('es-ES')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Inspector: {inspection.inspector?.full_name || 'No asignado'}
                    </p>
                  </div>
                  <Badge variant={statusMap[inspection.status]?.variant || 'default'}>
                    {statusMap[inspection.status]?.label || inspection.status}
                  </Badge>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/seguridad-higiene/inspecciones')}
              >
                Ver Todas las Inspecciones
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay inspecciones registradas para este sector</p>
              {canManageSH && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/seguridad-higiene/inspecciones/new')}
                >
                  Crear Primera Inspección
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Últimas Evaluaciones de Área ({evaluations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {evaluations.length > 0 ? (
            <div className="space-y-3">
              {evaluations.map((evaluation: any) => (
                <div 
                  key={evaluation.id} 
                  className="flex items-center justify-between p-3 border rounded hover:bg-accent cursor-pointer"
                  onClick={() => navigate(`/seguridad-higiene/evaluaciones/${evaluation.id}`)}
                >
                  <div>
                    <p className="font-medium">
                      {new Date(evaluation.evaluation_date).toLocaleDateString('es-ES')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Evaluador: {evaluation.evaluator?.full_name || 'No asignado'}
                    </p>
                  </div>
                  {evaluation.average_score && (
                    <Badge variant={evaluation.average_score >= 7 ? 'success' : 'destructive'}>
                      {evaluation.average_score}/10
                    </Badge>
                  )}
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/seguridad-higiene/evaluaciones')}
              >
                Ver Todas las Evaluaciones
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay evaluaciones registradas para este sector</p>
              {canManageSH && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/seguridad-higiene/evaluaciones/new')}
                >
                  Crear Primera Evaluación
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate('/seguridad-higiene/sectores')}>
          Volver a Sectores
        </Button>
      </div>
    </div>
  );
}
