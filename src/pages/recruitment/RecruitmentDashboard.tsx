import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Briefcase,
  Users,
  CalendarClock,
  KanbanSquare,
  Target,
  ArrowRight,
  UserPlus,
  ClipboardList,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRoles } from '@/hooks/useRoles';

type Position = Database['public']['Tables']['recruitment_positions']['Row'];
type Candidate = Database['public']['Tables']['recruitment_candidates']['Row'];
type Application = Database['public']['Tables']['recruitment_applications']['Row'];
type Interview = Database['public']['Tables']['recruitment_interviews']['Row'];

interface RecruitmentData {
  positions: Position[];
  candidates: Candidate[];
  applications: Application[];
  interviews: Interview[];
}

async function fetchRecruitmentData(): Promise<RecruitmentData> {
  const [positionsRes, candidatesRes, applicationsRes, interviewsRes] = await Promise.all([
    (supabase as any).from('recruitment_positions').select('*'),
    (supabase as any).from('recruitment_candidates').select('*'),
    (supabase as any).from('recruitment_applications').select('*'),
    (supabase as any)
      .from('recruitment_interviews')
      .select('*')
      .gte('scheduled_at', new Date().toISOString().split('T')[0]) // Filter from today onwards
      .order('scheduled_at', { ascending: true })
      .limit(5),
  ]);

  if (positionsRes.error) throw positionsRes.error;
  if (candidatesRes.error) throw candidatesRes.error;
  if (applicationsRes.error) throw applicationsRes.error;
  if (interviewsRes.error) throw interviewsRes.error;

  return {
    positions: positionsRes.data || [],
    candidates: candidatesRes.data || [],
    applications: applicationsRes.data || [],
    interviews: interviewsRes.data || [],
  };
}

const statusLabels: Record<string, string> = {
  abierta: 'Abierta',
  en_proceso: 'En proceso',
  en_revision: 'En revisión',
  entrevista: 'Entrevista',
  oferta: 'Oferta',
  contratado: 'Contratado',
  cerrado: 'Cerrado',
  rechazado: 'Rechazado',
};

const pipelineStages = [
  { id: 'nuevo', label: 'Nuevos' },
  { id: 'en_revision', label: 'En revisión' },
  { id: 'entrevista', label: 'Entrevistas' },
  { id: 'oferta', label: 'Ofertas' },
  { id: 'contratado', label: 'Contratados' },
];

export default function RecruitmentDashboard() {
  const navigate = useNavigate();
  const { canManageRecruitment } = useRoles();

  const { data, isLoading } = useQuery<RecruitmentData>({
    queryKey: ['recruitment-dashboard'],
    queryFn: fetchRecruitmentData,
  });

  const stats = useMemo(() => {
    if (!data) {
      return {
        openPositions: 0,
        activeCandidates: 0,
        pipeline: pipelineStages.map((stage) => ({ ...stage, count: 0 })),
        upcomingInterviews: [] as Array<Interview & { candidateName: string; positionTitle: string }>,
        interviewsThisWeek: 0,
      };
    }

    const openPositions = data.positions.filter((position: Position) =>
      ['abierta', 'en_proceso'].includes(position.status || '')
    ).length;

    const activeCandidates = data.candidates.filter((candidate: Candidate) => candidate.status !== 'archivado').length;

    const pipeline = pipelineStages.map((stage) => ({
      ...stage,
      count: data.applications.filter((application: Application) => application.status === stage.id).length,
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day to include today's interviews
    const weekAhead = new Date(today);
    weekAhead.setDate(today.getDate() + 7);

    const positionsMap = new Map(data.positions.map((position: Position) => [position.id, position]));
    const candidatesMap = new Map(data.candidates.map((candidate: Candidate) => [candidate.id, candidate]));
    const applicationsMap = new Map(data.applications.map((application: Application) => [application.id, application]));

    const upcomingInterviews = (data.interviews as Interview[]).map((interview) => {
      const application = applicationsMap.get(interview.application_id);
      const candidate = application ? candidatesMap.get(application.candidate_id) : undefined;
      const position = application && application.position_id
        ? positionsMap.get(application.position_id)
        : undefined;

      return {
        ...interview,
        candidateName: candidate?.full_name || 'Candidato sin nombre',
        positionTitle: position?.title || 'Posición sin título',
      };
    });

    const interviewsThisWeek = upcomingInterviews.filter((interview) => {
      if (!interview.scheduled_at) return false;
      const date = new Date(interview.scheduled_at);
      return date >= today && date <= weekAhead;
    }).length;

    return {
      openPositions,
      activeCandidates,
      pipeline,
      upcomingInterviews,
      interviewsThisWeek,
    };
  }, [data]);

  const pipelineTotal = stats.pipeline.reduce((acc, current) => acc + current.count, 0);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-background to-background p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase text-muted-foreground tracking-[0.3em]">Módulo</p>
            <h1 className="text-4xl font-bold tracking-tight">Contratos</h1>
            <p className="text-muted-foreground">
              Controla vacantes abiertas, candidatos activos y entrevistas próximas en un solo lugar.
            </p>
          </div>
          {canManageRecruitment && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigate('/reclutamiento/posiciones')}>
                <Briefcase className="mr-2 h-4 w-4" />
                Ver posiciones
              </Button>
              <Button variant="secondary" onClick={() => navigate('/reclutamiento/candidatos')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Ver candidatos
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posiciones abiertas</CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.openPositions}</div>
            <p className="text-xs text-muted-foreground">en etapas activa y abierta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatos activos</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeCandidates}</div>
            <p className="text-xs text-muted-foreground">excluyendo archivados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrevistas (7 días)</CardTitle>
            <CalendarClock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.interviewsThisWeek}</div>
            <p className="text-xs text-muted-foreground">programadas para los próximos días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Embudo activo</CardTitle>
            <KanbanSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.pipeline.reduce((acc, stage) => acc + stage.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">aplicaciones en curso</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Pipeline de aplicaciones
            </CardTitle>
            <CardDescription>Distribución por etapa actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.pipeline.map((stage) => (
              <div key={stage.id}>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{stage.label}</span>
                  <span>{stage.count}</span>
                </div>
                <Progress
                  value={pipelineTotal === 0 ? 0 : (stage.count * 100) / pipelineTotal}
                  className="mt-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Próximas entrevistas
            </CardTitle>
            <CardDescription>Resumen de las siguientes reuniones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.upcomingInterviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay entrevistas programadas.</p>
            ) : (
              stats.upcomingInterviews.map((interview) => (
                <div key={interview.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{interview.candidateName}</p>
                      <p className="text-sm text-muted-foreground">{interview.positionTitle}</p>
                    </div>
                    {interview.status && (
                      <Badge variant="outline">{statusLabels[interview.status] || interview.status}</Badge>
                    )}
                  </div>
                  <Separator className="my-2" />
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {interview.scheduled_at && (
                      <span>
                        {format(new Date(interview.scheduled_at), 'dd MMM yyyy HH:mm')} ({interview.interview_type})
                      </span>
                    )}
                    {interview.location && <span>• {interview.location}</span>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Acciones rápidas
          </CardTitle>
          <CardDescription>Accesos directos para gestionar el embudo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto justify-start gap-3 py-4"
              onClick={() => navigate('/reclutamiento/candidatos')}
            >
              <UserPlus className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-semibold">Candidatos</p>
                <p className="text-sm text-muted-foreground">Ver y actualizar perfiles</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-auto justify-start gap-3 py-4"
              onClick={() => navigate('/reclutamiento/posiciones')}
            >
              <Briefcase className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-semibold">Posiciones</p>
                <p className="text-sm text-muted-foreground">Seguimiento de vacantes</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-auto justify-start gap-3 py-4"
              onClick={() => navigate('/reclutamiento/entrevistas')}
            >
              <CalendarClock className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-semibold">Calendario</p>
                <p className="text-sm text-muted-foreground">Coordina entrevistas</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-auto justify-start gap-3 py-4"
              onClick={() => navigate('/documentos')}
            >
              <ClipboardList className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-semibold">Documentación</p>
                <p className="text-sm text-muted-foreground">Checklist de onboarding</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
