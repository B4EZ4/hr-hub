import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-with-auth';
import { signup } from '../../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ShieldAlert, CheckCircle2, CalendarClock, Pencil, Trash2, Loader2, Clock4 } from 'lucide-react';
import { toast } from 'sonner';

import type { Tables } from '@/integrations/supabase/types';
import { useRoles } from '@/hooks/useRoles';
import { ScheduleInterviewDialog } from './ScheduleInterviewDialog';
import { UpdateInterviewDialog } from './UpdateInterviewDialog';
import { UpdateCandidateDialog } from './UpdateCandidateDialog';

type CandidateRow = Tables<'recruitment_candidates'>;
type ApplicationRow = Tables<'recruitment_applications'> & {
  position?: Tables<'recruitment_positions'> | null;
};
type InterviewRow = Tables<'recruitment_interviews'>;

interface CandidateDetailData extends CandidateRow {
  recruitment_applications: Array<
    ApplicationRow & {
      recruitment_interviews: InterviewRow[];
    }
  >;
}

interface CandidateDetailResponse {
  candidate: CandidateDetailData;
  has_completed_positive_interview: boolean;
}

const fetchCandidateDetail = async (candidateId: string): Promise<CandidateDetailResponse> => {
  const query = (supabase as any)
    .from('recruitment_candidates')
    .select(`
      *,
      recruitment_applications (
        id,
        status,
        current_stage,
        priority,
        salary_expectation,
        availability_date,
        position_id,
        position:recruitment_positions!recruitment_applications_position_id_fkey (
          id,
          title,
          department,
          location,
          seniority,
          status,
          work_start_time,
          work_end_time
        ),
          recruitment_interviews (
            id,
            interview_type,
            status,
            scheduled_at,
            feedback_summary,
            next_steps,
            decision
          )
      )
    `)
    .eq('id', candidateId)
    .order('created_at', { foreignTable: 'recruitment_applications', ascending: false })
    .order('scheduled_at', { foreignTable: 'recruitment_applications.recruitment_interviews', ascending: false });

  const { data, error } = await query.single();

  if (error) throw error;

  const applications = (data?.recruitment_applications || []) as CandidateDetailData['recruitment_applications'];

  const hasApprovedDecision = applications.some((application) =>
    (application.recruitment_interviews || []).some(
      (interview) => interview.status === 'completada' && interview.decision === 'aprobado'
    )
  );

  const hasPositiveFeedback = applications.some((application) =>
    (application.recruitment_interviews || []).some((interview) => {
      if (interview.status !== 'completada') return false;
      const feedback = interview.feedback_summary?.toLowerCase() ?? '';
      const nextSteps = interview.next_steps?.toLowerCase() ?? '';
      return feedback.includes('aprob') || nextSteps.includes('contratar');
    })
  );

  const hasCompletedPositiveInterview = hasApprovedDecision || hasPositiveFeedback;

  const candidateDetail: CandidateDetailData = {
    ...(data as CandidateRow),
    recruitment_applications: applications,
  };

  return {
    candidate: candidateDetail,
    has_completed_positive_interview: hasCompletedPositiveInterview,
  };
};

const formatSchedule = (start?: string | null, end?: string | null) => {
  if (!start && !end) return null;
  if (!start || !end) return 'Horario incompleto';
  return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
};

const renderInfoRow = (label: string, value: string | null) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="font-medium">{value || '—'}</span>
  </div>
);

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManageRecruitment } = useRoles();
  const queryClient = useQueryClient();
  const [isScheduleOpen, setScheduleOpen] = useState(false);
  const [isUpdateOpen, setUpdateOpen] = useState(false);
  const [isUpdateCandidateOpen, setUpdateCandidateOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<InterviewRow | null>(null);
  const [interviewToDelete, setInterviewToDelete] = useState<InterviewRow | null>(null);
  const [isConfirmHireOpen, setConfirmHireOpen] = useState(false);

  const generateTempPassword = () => {
    const randomSegment = Math.random().toString(36).slice(-8);
    return `Hr-${Date.now().toString().slice(-4)}${randomSegment}!1`;
  };

  const handleOpenUpdate = (interview: InterviewRow) => {
    setSelectedInterview(interview);
    setUpdateOpen(true);
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recruitment-candidate-detail', id],
    queryFn: () => fetchCandidateDetail(id as string),
    enabled: Boolean(id),
    retry: false,
  });

  const candidate = data?.candidate;
  const hasCompletedPositiveInterview = data?.has_completed_positive_interview ?? false;
  const latestApplication = candidate?.recruitment_applications?.[0];
  const interviews = latestApplication?.recruitment_interviews || [];
  const hasFinalDecision = interviews.some((interview) =>
    ['aprobado', 'rechazado'].includes(interview.decision || '')
  );
  const hasRejectedDecision = interviews.some((interview) => interview.decision === 'rechazado');
  const scheduleDisabledReason = hasFinalDecision
    ? 'Ya existe una entrevista con decisión final (aprobado o rechazado).'
    : undefined;
  const isAlreadyHired = candidate?.status === 'contratado';
  const hireDisabledReason = !latestApplication
    ? 'El candidato no tiene una aplicación activa.'
    : isAlreadyHired
      ? 'El candidato ya fue contratado.'
      : !hasCompletedPositiveInterview
        ? 'Se requiere una entrevista aprobada.'
        : hasRejectedDecision
          ? 'El candidato fue rechazado y no puede ser contratado.'
          : undefined;

  useEffect(() => {
    if (hasFinalDecision && isScheduleOpen) {
      setScheduleOpen(false);
    }
  }, [hasFinalDecision, isScheduleOpen]);

  const deleteMutation = useMutation({
    mutationFn: async (interviewId: string) => {
      const { error } = await (supabase as any)
        .from('recruitment_interviews')
        .delete()
        .eq('id', interviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Entrevista eliminada');
      setInterviewToDelete(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'No se pudo eliminar la entrevista');
    },
  });

  const alertConfig = useMemo(() => {
    if (candidate?.status === 'contratado') {
      return {
        variant: 'default' as const,
        title: '🟢 Candidato contratado',
        description: 'Este perfil ya forma parte del staff activo.',
        icon: CheckCircle2,
      };
    }
    if (hasRejectedDecision) {
      return {
        variant: 'destructive' as const,
        title: '❌ Candidato rechazado',
        description: 'No se permiten nuevas acciones de contratación.',
        icon: ShieldAlert,
      };
    }
    if (hasCompletedPositiveInterview) {
      return {
        variant: 'default' as const,
        title: '✅ Entrevista aprobada',
        description: 'Listo para proceder con la contratación.',
        icon: CheckCircle2,
      };
    }
    return {
      variant: 'destructive' as const,
      title: '⚠️ Entrevistas pendientes',
      description: 'Se requiere al menos una entrevista aprobada antes de continuar.',
      icon: ShieldAlert,
    };
  }, [candidate?.status, hasCompletedPositiveInterview, hasRejectedDecision]);

  type ConfirmHirePayload = {
    candidate: CandidateDetailData;
    application: CandidateDetailData['recruitment_applications'][number];
  };

  const confirmHireMutation = useMutation({
    mutationFn: async ({ candidate, application }: ConfirmHirePayload) => {
      const position = application.position;

      // Resolve area_id and position_id from text values
      let areaId: string | null = null;
      let positionId: string | null = null;

      if (position?.department) {
        const { data: areaData } = await (supabase as any)
          .from('areas')
          .select('id')
          .ilike('name', position.department)
          .maybeSingle();

        if (areaData) {
          areaId = areaData.id;
        } else {
          // Optional: Create area if it doesn't exist, or just leave null
          // For now, we'll try to create it to ensure data consistency
          const { data: newArea } = await (supabase as any)
            .from('areas')
            .insert({ name: position.department, status: 'active' })
            .select('id')
            .single();
          if (newArea) areaId = newArea.id;
        }
      }

      if (position?.title) {
        const { data: posData } = await (supabase as any)
          .from('positions')
          .select('id')
          .ilike('title', position.title)
          .maybeSingle();

        if (posData) {
          positionId = posData.id;
        } else {
          // Optional: Create position if it doesn't exist
          const { data: newPos } = await (supabase as any)
            .from('positions')
            .insert({ title: position.title, area_id: areaId, status: 'active' })
            .select('id')
            .single();
          if (newPos) positionId = newPos.id;
        }
      }

      // Check if user exists in public.users (NOT auth.users)
      const { data: existingUser, error: userLookupError } = await (supabase as any)
        .from('users')
        .select('id')
        .eq('email', candidate.email.trim())
        .maybeSingle();

      if (userLookupError) throw userLookupError;

      let userId = existingUser?.id as string | undefined;
      let tempPassword: string | null = null;

      if (!userId) {
        const generatedPassword = generateTempPassword();
        try {
          // Use custom signup function to create user in public.users
          const { user } = await signup({
            username: candidate.email.trim(),
            email: candidate.email.trim(),
            password: generatedPassword,
            full_name: candidate.full_name,
            phone: candidate.phone || undefined,
            department: position?.department || undefined,
            position: position?.title || undefined,
          });

          if (!user?.id) {
            throw new Error('No se pudo crear el usuario del empleado.');
          }

          userId = user.id;
          tempPassword = generatedPassword;
        } catch (error: any) {
          // Handle case where user might have been created in race condition
          if (error.message?.includes('ya está registrado')) {
            const { data: retryUser } = await (supabase as any)
              .from('users')
              .select('id')
              .eq('email', candidate.email.trim())
              .maybeSingle();

            if (retryUser) {
              userId = retryUser.id;
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
      }

      const hireDate = new Date().toISOString().split('T')[0];

      const profilePayload = {
        full_name: candidate.full_name,
        email: candidate.email.trim(),
        phone: candidate.phone,
        department: position?.department, // Keep for backward compatibility
        position: position?.title,       // Keep for backward compatibility
        area_id: areaId,
        position_id: positionId,
        status: 'activo',
        hire_date: hireDate,
        address: candidate.current_location,
        must_change_password: true,
      };

      // Check if profile exists
      const { data: existingProfile, error: profileLookupError } = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileLookupError) throw profileLookupError;

      let profileId = existingProfile?.id;

      if (profileId) {
        const { error: updateProfileError } = await (supabase as any)
          .from('profiles')
          .update(profilePayload)
          .eq('id', profileId);

        if (updateProfileError) throw updateProfileError;
      } else {
        const { data: insertedProfile, error: insertProfileError } = await (supabase as any)
          .from('profiles')
          .insert([
            {
              ...profilePayload,
              user_id: userId,
            },
          ])
          .select('id')
          .single();

        if (insertProfileError) throw insertProfileError;
        profileId = insertedProfile.id;
      }

      const { error: roleError } = await (supabase as any)
        .from('user_roles')
        .upsert(
          [{ user_id: userId, role: 'empleado' }],
          { onConflict: 'user_id,role' }
        );

      if (roleError) throw roleError;

      const { error: candidateError } = await (supabase as any)
        .from('recruitment_candidates')
        .update({ status: 'contratado' })
        .eq('id', candidate.id);

      if (candidateError) throw candidateError;

      const { error: applicationError } = await (supabase as any)
        .from('recruitment_applications')
        .update({ status: 'contratado', current_stage: 'contratado' })
        .eq('id', application.id);

      if (applicationError) throw applicationError;

      // Create contract record (match DB schema: requires contract_number and `type`)
      const contractNumber = `CNT-${Date.now().toString().slice(-6)}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;

      const { data: newContract, error: contractError } = await (supabase as any)
        .from('contracts')
        .insert({
          user_id: userId,
          contract_number: contractNumber,
          type: 'indefinido',
          start_date: hireDate,
          status: 'activo',
          department: position?.department || null,
          position: position?.title || 'Sin especificar',
          salary: application.salary_expectation || null,
        })
        .select('id')
        .single();

      if (contractError) {
        console.error('Error creating contract:', contractError);
        // Don't fail the whole process if contract creation fails, but log it
        toast.error('Empleado contratado, pero hubo un error al crear el registro de contrato.');
      } else if (newContract?.id) {
        // Generate PDF contract
        try {
          const { getSessionToken } = await import('@/lib/auth');
          const token = getSessionToken();

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-contract`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                'x-session-token': token || '',
              },
              body: JSON.stringify({
                contract_id: newContract.id,
              }),
            }
          );

          if (response.ok) {
            const { file_url } = await response.json();
            console.log('Contract PDF generated:', file_url);
          } else {
            console.error('Error generating PDF:', await response.text());
          }
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
          // No interrumpir el flujo si falla el PDF
        }
      }

      await (supabase as any)
        .from('vacation_balances')
        .upsert(
          [
            {
              user_id: userId,
              total_days: 15,
              used_days: 0,
              available_days: 15,
              year: new Date().getFullYear(),
            },
          ],
          { onConflict: 'user_id' }
        );

      return { tempPassword };
    },
    onSuccess: async ({ tempPassword }) => {
      if (tempPassword) {
        toast.success(`Candidato contratado. Contraseña temporal: ${tempPassword}`);
      } else {
        toast.success('Candidato contratado y vinculado al empleado existente.');
      }
      setConfirmHireOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['users-select'] }),
        queryClient.invalidateQueries({ queryKey: ['profiles'] }),
        queryClient.invalidateQueries({ queryKey: ['recruitment-candidates'] }),
      ]);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'No se pudo completar la contratación');
    },
  });

  const handleConfirmHire = () => {
    if (!candidate || !latestApplication) {
      toast.error('No hay una aplicación activa para este candidato.');
      return;
    }
    confirmHireMutation.mutate({ candidate, application: latestApplication });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (isError || !candidate) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>No pudimos cargar al candidato</CardTitle>
            <CardDescription>Verifica el enlace o inténtalo nuevamente.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="px-0 hover:bg-transparent" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a candidatos
      </Button>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{candidate.full_name}</h1>
          <p className="text-muted-foreground">{candidate.current_location || 'Ubicación no definida'}</p>
        </div>
        {canManageRecruitment && (
          <TooltipProvider delayDuration={200}>
            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      variant="outline"
                      disabled={Boolean(scheduleDisabledReason)}
                      onClick={() => setScheduleOpen(true)}
                    >
                      <CalendarClock className="mr-2 h-4 w-4" />
                      Programar entrevista
                    </Button>
                    <div className="flex items-center gap-2">
                      <Clock4 className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatSchedule(
                          latestApplication?.position?.work_start_time,
                          latestApplication?.position?.work_end_time
                        ) || 'Horario no definido'}
                      </span>
                    </div>
                  </span>
                </TooltipTrigger>
                {scheduleDisabledReason && (
                  <TooltipContent>
                    <p>{scheduleDisabledReason}</p>
                  </TooltipContent>
                )}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      size="lg"
                      disabled={Boolean(hireDisabledReason) || confirmHireMutation.isPending}
                      onClick={() => setConfirmHireOpen(true)}
                    >
                      {confirmHireMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Confirmar Contratación
                    </Button>
                  </span>
                </TooltipTrigger>
                {hireDisabledReason && (
                  <TooltipContent>
                    <p>{hireDisabledReason}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </div>

      <Alert variant={alertConfig.variant}>
        <alertConfig.icon className="h-4 w-4" />
        <AlertTitle>{alertConfig.title}</AlertTitle>
        <AlertDescription>{alertConfig.description}</AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Información general</CardTitle>
              <CardDescription>Datos básicos y seguimiento del candidato.</CardDescription>
            </div>
            {canManageRecruitment && (
              <Button variant="ghost" size="icon" onClick={() => setUpdateCandidateOpen(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 pt-4">
            {renderInfoRow('Email', candidate.email)}
            {renderInfoRow('Teléfono', candidate.phone)}
            {renderInfoRow('Fuente', candidate.source)}
            {renderInfoRow('Nivel / Experiencia', candidate.seniority)}
            {renderInfoRow('Estado', candidate.status)}
            {renderInfoRow('Reclutador asignado', candidate.assigned_recruiter)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aplicación activa</CardTitle>
            <CardDescription>Última postulación registrada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestApplication ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Vacante</span>
                    <Badge variant="outline">
                      {latestApplication.position?.status || 'sin estado'}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">
                      {latestApplication.position?.title || 'Vacante no asignada'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {latestApplication.position?.department || 'Depto. no definido'} ·{' '}
                      {latestApplication.position?.location || 'Ubicación no definida'}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Etapa actual</span>
                    <Badge>{latestApplication.current_stage || 'Sin etapa'}</Badge>
                  </div>
                  <p><span className="text-muted-foreground">Prioridad:</span> {latestApplication.priority || 'Media'}</p>
                  <p><span className="text-muted-foreground">Estado:</span> {latestApplication.status}</p>
                  <p>
                    <span className="text-muted-foreground">Disponibilidad:</span>{' '}
                    {latestApplication.availability_date ? new Date(latestApplication.availability_date).toLocaleDateString() : 'No definida'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock4 className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatSchedule(
                        latestApplication.position?.work_start_time,
                        latestApplication.position?.work_end_time
                      ) || 'Horario no definido'}
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin aplicaciones registradas.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de entrevistas</CardTitle>
          <CardDescription>Seguimiento por tipo y estado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestApplication && latestApplication.recruitment_interviews?.length ? (
            latestApplication.recruitment_interviews.map((interview) => {
              const isCompleted = interview.status === 'completada';
              const isDeletingThis = deleteMutation.isPending && interviewToDelete?.id === interview.id;
              return (
                <div key={interview.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{interview.interview_type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(interview.scheduled_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={isCompleted ? 'default' : 'secondary'}>
                          {interview.status}
                        </Badge>
                        {interview.decision && (
                          <Badge variant={interview.decision === 'aprobado' ? 'default' : 'outline'}>
                            {interview.decision}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {canManageRecruitment && (
                      <div className="flex items-center gap-1">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenUpdate(interview)}
                                  disabled={isCompleted}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Actualizar
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {isCompleted && (
                              <TooltipContent>
                                <p>No se puede editar una entrevista completada.</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setInterviewToDelete(interview)}
                          disabled={isDeletingThis}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                  {interview.feedback_summary && (
                    <p className="mt-2 text-sm text-muted-foreground">{interview.feedback_summary}</p>
                  )}
                  {interview.next_steps && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Próximos pasos:</span> {interview.next_steps}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No hay entrevistas registradas todavía.</p>
          )}
        </CardContent>
      </Card>

      {canManageRecruitment && (
        <ScheduleInterviewDialog
          open={isScheduleOpen}
          onOpenChange={setScheduleOpen}
          candidateId={candidate.id}
          applications={candidate.recruitment_applications || []}
          onScheduled={() => refetch()}
        />
      )}

      {canManageRecruitment && selectedInterview && (
        <UpdateInterviewDialog
          open={isUpdateOpen}
          onOpenChange={(open) => {
            setUpdateOpen(open);
            if (!open) setSelectedInterview(null);
          }}
          interview={selectedInterview}
          onUpdated={() => refetch()}
        />
      )}

      {canManageRecruitment && (
        <UpdateCandidateDialog
          open={isUpdateCandidateOpen}
          onOpenChange={setUpdateCandidateOpen}
          candidate={candidate}
          onUpdated={() => refetch()}
        />
      )}

      {canManageRecruitment && (
        <AlertDialog
          open={Boolean(interviewToDelete)}
          onOpenChange={(open) => {
            if (!open && !deleteMutation.isPending) {
              setInterviewToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar entrevista</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará la entrevista seleccionada de forma permanente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => interviewToDelete && deleteMutation.mutate(interviewToDelete.id)}
                disabled={deleteMutation.isPending}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {canManageRecruitment && (
        <AlertDialog
          open={isConfirmHireOpen}
          onOpenChange={(open) => {
            if (!confirmHireMutation.isPending) {
              setConfirmHireOpen(open);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar contratación</AlertDialogTitle>
              <AlertDialogDescription>
                Se creará o actualizará el usuario interno y se marcará al candidato como contratado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="font-medium">{candidate?.full_name}</p>
              <p className="text-muted-foreground">{candidate?.email}</p>
              <p className="mt-2">
                Vacante: {latestApplication?.position?.title || 'Sin asignar'}
              </p>
              <p>
                Departamento: {latestApplication?.position?.department || 'No definido'}
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={confirmHireMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmHire}
                disabled={confirmHireMutation.isPending}
              >
                {confirmHireMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
