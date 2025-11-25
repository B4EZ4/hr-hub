import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Edit, ClipboardCheck, MapPin, User, Calendar, FileText } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';

export default function AreaEvaluationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManageSH } = useRoles();

  const { data: evaluation, isLoading } = useQuery({
    queryKey: ['area-evaluation-detail', id],
    queryFn: async () => {
      const { data: evalData, error } = await (supabase as any)
        .from('sh_area_evaluations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!evalData) return null;

      // Obtener sector
      if (evalData.sector_id) {
        const { data: sector } = await (supabase as any)
          .from('sh_sectors')
          .select('name, description, risk_level')
          .eq('id', evalData.sector_id)
          .maybeSingle();
        evalData.sector = sector;
      }

      // Obtener evaluador
      if (evalData.evaluated_by) {
        const { data: evaluator } = await (supabase as any)
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', evalData.evaluated_by)
          .maybeSingle();
        evalData.evaluator = evaluator;
      }

      return evalData;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <ClipboardCheck className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Evaluación no encontrada</h2>
        <Button onClick={() => navigate('/seguridad-higiene/evaluaciones')}>
          Volver a Evaluaciones
        </Button>
      </div>
    );
  }

  const scores = [
    { label: 'Orden', value: evaluation.order_score, icon: '📋' },
    { label: 'Limpieza', value: evaluation.cleanliness_score, icon: '🧹' },
    { label: 'Iluminación', value: evaluation.lighting_score, icon: '💡' },
    { label: 'Ventilación', value: evaluation.ventilation_score, icon: '🌬️' },
    { label: 'Ergonomía', value: evaluation.ergonomics_score, icon: '🪑' },
    { label: 'Señalización', value: evaluation.signage_score, icon: '⚠️' },
    { label: 'Control de Riesgos', value: evaluation.risk_control_score, icon: '🛡️' },
    { label: 'Cumplimiento', value: evaluation.compliance_score, icon: '✅' },
    { label: 'Estado Herramientas', value: evaluation.tools_condition_score, icon: '🔧' },
    { label: 'Estado Mobiliario', value: evaluation.furniture_condition_score, icon: '🛋️' },
    { label: 'Control Mat. Peligrosos', value: evaluation.hazmat_control_score, icon: '☣️' },
  ];

  const validScores = scores.filter(s => s.value !== null && s.value !== undefined);
  const totalScore = validScores.reduce((sum, s) => sum + (s.value || 0), 0);
  const averageScore = validScores.length > 0 ? (totalScore / validScores.length).toFixed(1) : '0';

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600';
    if (score >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreProgress = (score: number) => {
    if (score >= 9) return 'bg-green-600';
    if (score >= 7) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/evaluaciones')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ClipboardCheck className="h-8 w-8 text-primary" />
              Evaluación de Área
            </h1>
            <p className="text-muted-foreground">
              {evaluation.sector?.name} - {new Date(evaluation.evaluation_date).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
        {canManageSH && (
          <Button onClick={() => navigate(`/seguridad-higiene/evaluaciones/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-center">Puntuación Promedio</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className={`text-6xl font-bold ${getScoreColor(Number(averageScore))}`}>
              {averageScore}
            </div>
            <div className="text-2xl text-muted-foreground">/ 10</div>
            <Progress 
              value={Number(averageScore) * 10} 
              className="w-full mt-4"
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Información del Sector
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Sector Evaluado</label>
              <p className="mt-1 font-medium text-lg">{evaluation.sector?.name}</p>
              {evaluation.sector?.description && (
                <p className="text-sm text-muted-foreground mt-1">{evaluation.sector.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Fecha de Evaluación
                </label>
                <p className="mt-1 font-medium">
                  {new Date(evaluation.evaluation_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Evaluador
                </label>
                <p className="mt-1 font-medium">{evaluation.evaluator?.full_name}</p>
                <p className="text-sm text-muted-foreground">{evaluation.evaluator?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Puntuaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validScores.map((score) => (
              <div key={score.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <span>{score.icon}</span>
                    {score.label}
                  </span>
                  <span className={`text-lg font-bold ${getScoreColor(score.value || 0)}`}>
                    {score.value}/10
                  </span>
                </div>
                <Progress 
                  value={(score.value || 0) * 10} 
                  className={getScoreProgress(score.value || 0)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {evaluation.observations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Observaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{evaluation.observations}</p>
          </CardContent>
        </Card>
      )}

      {evaluation.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{evaluation.recommendations}</p>
          </CardContent>
        </Card>
      )}

      {evaluation.file_paths && evaluation.file_paths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Archivos Adjuntos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {evaluation.file_paths.map((path: string, index: number) => (
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
        <Button variant="outline" onClick={() => navigate('/seguridad-higiene/evaluaciones')}>
          Volver a Evaluaciones
        </Button>
      </div>
    </div>
  );
}
