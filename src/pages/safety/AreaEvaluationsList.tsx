import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Eye, Edit, Trash2, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
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

export default function AreaEvaluationsList() {
  const navigate = useNavigate();
  const { canManageSH } = useRoles();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('sh_area_evaluations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-evaluations'] });
      toast.success('Evaluación eliminada correctamente');
    },
    onError: (error: any) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ['area-evaluations'],
    queryFn: async () => {
      const { data: evaluationsData, error: evalError } = await (supabase as any)
        .from('sh_area_evaluations')
        .select('*')
        .order('evaluation_date', { ascending: false });

      if (evalError) throw evalError;
      if (!evaluationsData || evaluationsData.length === 0) return [];

      // Obtener sectores
      const sectorIds = [...new Set(evaluationsData.map((e: any) => e.sector_id).filter(Boolean))];
      let sectorsMap: Record<string, any> = {};
      if (sectorIds.length > 0) {
        const { data: sectors } = await (supabase as any)
          .from('sh_sectors')
          .select('id, name')
          .in('id', sectorIds);
        sectorsMap = (sectors || []).reduce((acc: any, s: any) => ({ ...acc, [s.id]: s }), {});
      }

      // Obtener evaluadores (profiles)
      const evaluatorIds = [...new Set(evaluationsData.map((e: any) => e.evaluated_by).filter(Boolean))];
      let evaluatorsMap: Record<string, any> = {};
      if (evaluatorIds.length > 0) {
        const { data: profiles } = await (supabase as any)
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', evaluatorIds);
        evaluatorsMap = (profiles || []).reduce((acc: any, p: any) => ({ ...acc, [p.user_id]: p }), {});
      }

      return evaluationsData.map((evaluation: any) => ({
        ...evaluation,
        sector: evaluation.sector_id ? sectorsMap[evaluation.sector_id] : null,
        evaluator: evaluation.evaluated_by ? evaluatorsMap[evaluation.evaluated_by] : null,
      }));
    },
  });

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'default';
    return 'destructive';
  };

  const columns = [
    {
      header: 'Sector',
      accessorKey: 'sector',
      cell: (value: any) => value?.name || 'Sin asignar',
    },
    {
      header: 'Fecha',
      accessorKey: 'evaluation_date',
      cell: (value: string) => new Date(value).toLocaleDateString('es-ES'),
    },
    {
      header: 'Evaluador',
      accessorKey: 'evaluator',
      cell: (value: any) => value?.full_name || '-',
    },
    {
      header: 'Puntuación',
      accessorKey: 'average_score',
      cell: (value: number) => (
        <Badge variant={getScoreVariant(value)}>
          {Number(value.toFixed(2))}%
        </Badge>
      ),
    },
  ];

  const stats = {
    total: evaluations.length,
    avgScore: evaluations.length > 0
      ? Math.round(evaluations.reduce((sum: number, e: any) => sum + e.average_score, 0) / evaluations.length)
      : 0,
    lastMonth: evaluations.filter((e: any) => {
      const date = new Date(e.evaluation_date);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return date >= monthAgo;
    }).length,
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Evaluaciones de Áreas</h1>
            <p className="text-muted-foreground">Análisis de condiciones de seguridad e higiene</p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/seguridad-higiene/evaluaciones/new')}
          disabled={!canManageSH}
          title={canManageSH ? undefined : 'Requiere rol Oficial S&H o Superadmin'}
        >
          <Plus className="mr-2 h-4 w-4" />
          Evaluar área
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Evaluaciones Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{stats.avgScore}%</div>
              {stats.avgScore >= 70 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">Promedio General</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.lastMonth}</div>
            <p className="text-xs text-muted-foreground">Último Mes</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={evaluations}
        columns={columns}
        searchable
        searchPlaceholder="Buscar evaluaciones..."
        emptyMessage="No hay evaluaciones registradas."
        onRowClick={(row) => navigate(`/seguridad-higiene/evaluaciones/${row.id}`)}
        actions={(row) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/seguridad-higiene/evaluaciones/${row.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver
            </Button>
            {canManageSH && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/seguridad-higiene/evaluaciones/${row.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar evaluación?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente la evaluación.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(row.id)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        )}
      />
    </div>
  );
}