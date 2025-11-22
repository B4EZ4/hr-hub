import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarClock, ClipboardSignature } from 'lucide-react';
import { toast } from 'sonner';

interface InterviewRow {
  id: string;
  application_id: string;
  interview_type: string;
  status: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  location: string | null;
  meeting_url: string | null;
  created_at: string | null;
}

interface EnrichedInterview extends InterviewRow {
  candidateName: string;
  positionTitle: string;
  currentStage: string;
}

const statusLabels: Record<string, string> = {
  programada: 'Programada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

async function fetchInterviews(): Promise<EnrichedInterview[]> {
  const { data, error } = await supabase
    .from('recruitment_interviews')
    .select('*')
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  const interviews: InterviewRow[] = data || [];

  if (interviews.length === 0) {
    return [];
  }

  const applicationIds = Array.from(new Set(interviews.map((interview) => interview.application_id)));

  const { data: applicationsData, error: applicationsError } = await supabase
    .from('recruitment_applications')
    .select('id, candidate_id, position_id, current_stage')
    .in('id', applicationIds);

  if (applicationsError) throw applicationsError;

  const candidatesIds = Array.from(new Set((applicationsData || []).map((application: any) => application.candidate_id)));
  const positionIds = Array.from(new Set((applicationsData || []).map((application: any) => application.position_id).filter(Boolean)));

  const [candidatesRes, positionsRes] = await Promise.all([
    candidatesIds.length
      ? supabase
          .from('recruitment_candidates')
          .select('id, full_name')
          .in('id', candidatesIds)
      : Promise.resolve({ data: [], error: null }),
    positionIds.length
      ? supabase
          .from('recruitment_positions')
          .select('id, title')
          .in('id', positionIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (candidatesRes.error) throw candidatesRes.error;
  if (positionsRes.error) throw positionsRes.error;

  const candidatesMap = new Map(
    (candidatesRes.data || []).map((candidate: { id: string; full_name: string }) => [candidate.id, candidate.full_name])
  );

  const positionsMap = new Map(
    (positionsRes.data || []).map((position: { id: string; title: string }) => [position.id, position.title])
  );

  const applicationsMap = new Map(
    (applicationsData || []).map((application: any) => [application.id, application])
  );

  return interviews.map((interview) => {
    const application = applicationsMap.get(interview.application_id);
    const candidateName = application ? candidatesMap.get(application.candidate_id) : undefined;
    const positionTitle = application ? positionsMap.get(application.position_id) : undefined;

    return {
      ...interview,
      candidateName: candidateName || 'Candidato sin asignar',
      positionTitle: positionTitle || 'Posición no disponible',
      currentStage: application?.current_stage || 'Sin etapa',
    } as EnrichedInterview;
  });
}

export default function RecruitmentInterviewsList() {
  const { data: interviews = [], isLoading } = useQuery<EnrichedInterview[]>({
    queryKey: ['recruitment-interviews'],
    queryFn: fetchInterviews,
  });

  const columns = [
    { header: 'Candidato', accessorKey: 'candidateName' },
    { header: 'Posición', accessorKey: 'positionTitle' },
    {
      header: 'Fecha',
      accessorKey: 'scheduled_at',
      cell: (value: string) => (value ? new Date(value).toLocaleString() : 'Sin programar'),
    },
    {
      header: 'Tipo',
      accessorKey: 'interview_type',
      cell: (value: string) => value || '-',
    },
    {
      header: 'Etapa',
      accessorKey: 'currentStage',
      cell: (value: string) => value || '-',
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: (value: string) => (
        <Badge variant="outline">{statusLabels[value] || value}</Badge>
      ),
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
          <h1 className="text-3xl font-bold tracking-tight">Entrevistas</h1>
          <p className="text-muted-foreground">Agenda y seguimiento de evaluaciones</p>
        </div>
        <Button onClick={() => toast.info('La integración con calendarios se agregará más adelante')}>
          <CalendarClock className="mr-2 h-4 w-4" />
          Programar entrevista
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardSignature className="h-5 w-5 text-primary" />
            Próximas entrevistas
          </CardTitle>
          <CardDescription>Revisa rápidamente lo programado</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={interviews}
            columns={columns}
            searchable
            searchPlaceholder="Buscar por candidato o posición"
            emptyMessage="No hay entrevistas registradas."
            actions={(row) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast.info(`Seguimiento detallado para entrevista ${row.id} próximamente`)}
              >
                Ver detalles
              </Button>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
