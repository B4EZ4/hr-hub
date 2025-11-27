import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, UserPlus, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRoles } from '@/hooks/useRoles';
import { useNavigate } from 'react-router-dom';
import { NewCandidateDialog } from './NewCandidateDialog';
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

interface RecruitmentCandidate {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  source: string | null;
  seniority: string | null;
  status: string;
  assigned_recruiter: string | null;
  resume_url: string | null;
  current_location: string | null;
  updated_at: string | null;
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  nuevo: 'secondary',
  en_proceso: 'default',
  entrevista: 'outline',
  oferta: 'outline',
  contratado: 'default',
  rechazado: 'destructive',
};

const statusLabels: Record<string, string> = {
  nuevo: 'Nuevo',
  en_proceso: 'En proceso',
  entrevista: 'Entrevista',
  oferta: 'Oferta',
  contratado: 'Contratado',
  rechazado: 'Rechazado',
};

export default function RecruitmentCandidatesList() {
  const { canManageRecruitment } = useRoles();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<RecruitmentCandidate | null>(null);

  const { data: candidates = [], isLoading } = useQuery<RecruitmentCandidate[]>({
    queryKey: ['recruitment-candidates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('recruitment_candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      const { error } = await (supabase as any)
        .from('recruitment_candidates')
        .delete()
        .eq('id', candidateId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Candidato eliminado');
      queryClient.invalidateQueries({ queryKey: ['recruitment-candidates'] });
      setCandidateToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'No se pudo eliminar el candidato');
    },
  });

  const columns = [
    { header: 'Nombre', accessorKey: 'full_name' },
    { header: 'Email', accessorKey: 'email' },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: (value: string) => (
        <Badge variant={statusVariants[value] || 'secondary'}>
          {statusLabels[value] || value}
        </Badge>
      ),
    },
    { header: 'Nivel', accessorKey: 'seniority' },
    { header: 'Fuente', accessorKey: 'source' },
    {
      header: 'Ubicación',
      accessorKey: 'current_location',
      cell: (value: string) => value || '-',
    },
    {
      header: 'Última actualización',
      accessorKey: 'updated_at',
      cell: (value: string) => (value ? new Date(value).toLocaleDateString() : '-'),
    },
  ];

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
          <h1 className="text-3xl font-bold tracking-tight">Candidatos</h1>
          <p className="text-muted-foreground">Listado maestro de talento en proceso</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => toast.info('Exportaremos el listado en una siguiente iteración')}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          {canManageRecruitment && (
            <Button onClick={() => setDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo candidato
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Base activa
          </CardTitle>
          <CardDescription>Consulta perfiles y fuentes de adquisición</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={candidates}
            columns={columns}
            searchable
            searchPlaceholder="Buscar por nombre, email o fuente"
            emptyMessage="No hay candidatos cargados."
            actions={(row) => (
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/reclutamiento/candidatos/${row.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalle
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => row.resume_url ? window.open(row.resume_url, '_blank') : toast.info('Sin CV adjunto aún')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Ver CV
                </Button>
                {canManageRecruitment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setCandidateToDelete(row)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                )}
              </div>
            )}
          />
        </CardContent>
      </Card>

      {canManageRecruitment && (
        <>
          <NewCandidateDialog
            open={isDialogOpen}
            onOpenChange={setDialogOpen}
            onCreated={(candidate) => navigate(`/reclutamiento/candidatos/${candidate.id}`)}
          />

          <AlertDialog
            open={Boolean(candidateToDelete)}
            onOpenChange={(open) => {
              if (!open && !deleteMutation.isPending) {
                setCandidateToDelete(null);
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar candidato</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará al candidato y sus registros asociados. ¿Deseas continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteMutation.isPending}
                  onClick={() => candidateToDelete && deleteMutation.mutate(candidateToDelete.id)}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
