import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Calendar,
  AlertTriangle,
  Shield,
  Package,
  TrendingUp,
  Activity,
  ArrowRight,
  Briefcase,
  CalendarClock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/hooks/useRoles";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type UpcomingInterviewSummary = {
  id: string;
  candidateId?: string;
  candidateName: string;
  positionTitle: string;
  scheduledAt?: string;
  interviewType?: string;
  location?: string;
  status?: string;
};

type RecruitmentSummary = {
  openPositions: number;
  activeCandidates: number;
  pipelineTotal: number;
  upcomingInterviews: UpcomingInterviewSummary[];
  interviewsThisWeek: number;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canManageRecruitment, canManageSH } = useRoles();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*, areas(name), positions(title)')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch recruitment summary to replace contracts module
  const { data: recruitmentStats } = useQuery<RecruitmentSummary>({
    queryKey: ['recruitment-summary-dashboard'],
    queryFn: async () => {
      const nowIso = new Date().toISOString();

      const [positionsRes, candidatesRes, applicationsRes, interviewsRes] = await Promise.all([
        (supabase as any)
          .from('recruitment_positions')
          .select('id,status,title'),
        (supabase as any)
          .from('recruitment_candidates')
          .select('id,status,full_name'),
        (supabase as any)
          .from('recruitment_applications')
          .select('id,status,candidate_id,position_id'),
        (supabase as any)
          .from('recruitment_interviews')
          .select('id,application_id,scheduled_at,interview_type,location,status')
          .gte('scheduled_at', nowIso)
          .order('scheduled_at', { ascending: true })
          .limit(5),
      ]);

      if (positionsRes.error) throw positionsRes.error;
      if (candidatesRes.error) throw candidatesRes.error;
      if (applicationsRes.error) throw applicationsRes.error;
      if (interviewsRes.error) throw interviewsRes.error;

      const positions = positionsRes.data || [];
      const candidates = candidatesRes.data || [];
      const applications = applicationsRes.data || [];
      const interviews = interviewsRes.data || [];

      const openPositions = positions.filter((position: any) =>
        ['abierta', 'en_proceso'].includes(position.status || '')
      ).length;

      const activeCandidates = candidates.filter((candidate: any) => candidate.status !== 'archivado').length;

      const pipelineStatuses = new Set(['nuevo', 'en_revision', 'entrevista', 'oferta', 'contratado']);
      const pipelineTotal = applications.filter((application: any) => pipelineStatuses.has(application.status || '')).length;

      interface Application {
        id: string;
        candidate_id: string;
        position_id?: string;
        status?: string;
      }

      interface Candidate {
        id: string;
        full_name?: string;
        status?: string;
      }

      interface Position {
        id: string;
        title?: string;
        status?: string;
      }

      const applicationsMap = new Map<string, Application>(
        applications.map((application: any) => [application.id, application as Application])
      );
      const candidatesMap = new Map<string, Candidate>(
        candidates.map((candidate: any) => [candidate.id, candidate as Candidate])
      );
      const positionsMap = new Map<string, Position>(
        positions.map((position: any) => [position.id, position as Position])
      );

      const upcomingInterviews = interviews.map((interview: any) => {
        const application = applicationsMap.get(interview.application_id);
        const candidate = application ? candidatesMap.get(application.candidate_id) : undefined;
        const position = application?.position_id ? positionsMap.get(application.position_id) : undefined;

        return {
          id: interview.id,
          candidateId: candidate?.id,
          candidateName: candidate?.full_name || 'Candidato sin nombre',
          positionTitle: position?.title || 'Posición sin título',
          scheduledAt: interview.scheduled_at,
          interviewType: interview.interview_type,
          location: interview.location,
          status: interview.status,
        } as UpcomingInterviewSummary;
      });

      const today = new Date();
      const weekAhead = new Date();
      weekAhead.setDate(today.getDate() + 7);

      const interviewsThisWeek = upcomingInterviews.filter((interview) => {
        if (!interview.scheduledAt) return false;
        const date = new Date(interview.scheduledAt);
        return date >= today && date <= weekAhead;
      }).length;

      return {
        openPositions,
        activeCandidates,
        pipelineTotal,
        upcomingInterviews,
        interviewsThisWeek,
      };
    },
  });

  // Fetch vacations stats
  const { data: vacationsData } = useQuery({
    queryKey: ['vacations-stats'],
    queryFn: async () => {
      const { data: pending } = await (supabase as any)
        .from('vacation_requests')
        .select('*, profiles!vacation_requests_user_id_fkey(full_name)')
        .eq('status', 'pendiente')
        .order('created_at', { ascending: false })
        .limit(5);

      const { count: totalCount } = await (supabase as any)
        .from('vacation_requests')
        .select('*', { count: 'exact', head: true });

      return { total: totalCount || 0, pending: pending || [] };
    },
  });

  // Fetch incidents stats
  const { data: incidentsData } = useQuery({
    queryKey: ['incidents-stats'],
    queryFn: async () => {
      const { data: open } = await (supabase as any)
        .from('incidents')
        .select('*')
        .eq('status', 'abierto')
        .order('created_at', { ascending: false })
        .limit(5);

      const { count: totalCount } = await (supabase as any)
        .from('incidents')
        .select('*', { count: 'exact', head: true });

      return { total: totalCount || 0, open: open || [] };
    },
  });

  // Fetch inventory stats
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const { data: critical } = await (supabase as any)
        .from('inventory_items')
        .select('*')
        .filter('stock_quantity', 'lte', 'min_stock')
        .order('stock_quantity', { ascending: true })
        .limit(5);

      const { count: totalCount } = await (supabase as any)
        .from('inventory_items')
        .select('*', { count: 'exact', head: true });

      return { total: totalCount || 0, critical: critical || [] };
    },
    enabled: canManageSH,
  });

  // Fetch inspections stats
  const { data: inspectionsData } = useQuery({
    queryKey: ['inspections-stats'],
    queryFn: async () => {
      const { data: upcoming } = await (supabase as any)
        .from('sh_inspections')
        .select('*, sh_sectors(name)')
        .eq('status', 'programada')
        .order('scheduled_date', { ascending: true })
        .limit(5);

      const { count: totalCount } = await (supabase as any)
        .from('sh_inspections')
        .select('*', { count: 'exact', head: true });

      return { total: totalCount || 0, upcoming: upcoming || [] };
    },
    enabled: canManageSH,
  });

  // Fetch documents stats
  const { data: documentsData } = useQuery({
    queryKey: ['documents-stats'],
    queryFn: async () => {
      const { data: recent } = await (supabase as any)
        .from('documents')
        .select('*, profiles!documents_uploaded_by_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const { count: totalCount } = await (supabase as any)
        .from('documents')
        .select('*', { count: 'exact', head: true });

      return { total: totalCount || 0, recent: recent || [] };
    },
  });

  const statsCards = [
    {
      title: "Contratos",
      value: recruitmentStats?.openPositions || 0,
      subtitle: `${recruitmentStats?.activeCandidates || 0} candidatos activos`,
      icon: Briefcase,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      borderColor: "border-blue-200 dark:border-blue-800",
      onClick: () => navigate('/reclutamiento'),
      show: true,
    },
    {
      title: "Vacaciones",
      value: vacationsData?.pending?.length || 0,
      subtitle: `${vacationsData?.total || 0} solicitudes totales`,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      borderColor: "border-purple-200 dark:border-purple-800",
      onClick: () => navigate('/vacaciones'),
      show: true,
    },
    {
      title: "Incidencias",
      value: incidentsData?.open?.length || 0,
      subtitle: `${incidentsData?.total || 0} incidencias totales`,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      borderColor: "border-orange-200 dark:border-orange-800",
      onClick: () => navigate('/incidencias'),
      show: true,
    },
    {
      title: "Documentos",
      value: documentsData?.total || 0,
      subtitle: `${documentsData?.recent?.length || 0} recientes`,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      borderColor: "border-green-200 dark:border-green-800",
      onClick: () => navigate('/documentos'),
      show: true,
    },
    {
      title: "Inventario S&H",
      value: inventoryData?.critical?.length || 0,
      subtitle: `${inventoryData?.total || 0} ítems totales`,
      icon: Package,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
      borderColor: "border-red-200 dark:border-red-800",
      onClick: () => navigate('/seguridad-higiene/inventario'),
      show: canManageSH,
    },
    {
      title: "Inspecciones",
      value: inspectionsData?.upcoming?.length || 0,
      subtitle: `${inspectionsData?.total || 0} inspecciones totales`,
      icon: Shield,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
      borderColor: "border-indigo-200 dark:border-indigo-800",
      onClick: () => navigate('/seguridad-higiene/inspecciones'),
      show: canManageSH,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 border border-primary/20">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Bienvenido/a, <span className="font-semibold text-foreground">{profile?.full_name || user?.full_name}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {profile?.positions?.title && `${profile.positions.title} • `}
            {profile?.areas?.name || 'Sistema RRHH'}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsCards.filter(card => card.show).map((card, index) => (
          <Card
            key={index}
            className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${card.borderColor} border-2 group`}
            onClick={card.onClick}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-3 rounded-lg ${card.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className={`text-4xl font-bold ${card.color}`}>
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {card.subtitle}
                </p>
              </div>
            </CardContent>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-primary/5 to-transparent rounded-tl-full" />
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Acciones Rápidas
          </CardTitle>
          <CardDescription>
            Accesos directos a las funciones más utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button
              onClick={() => navigate('/documentos/new')}
              variant="outline"
              className="h-auto py-4 justify-start group hover:border-primary hover:bg-primary/5 transition-all"
            >
              <FileText className="mr-3 h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-semibold">Cargar Documento</p>
                <p className="text-xs text-muted-foreground">Subir nuevo archivo</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>

            {canManageRecruitment && (
              <Button
                onClick={() => navigate('/reclutamiento/candidatos')}
                variant="outline"
                className="h-auto py-4 justify-start group hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Briefcase className="mr-3 h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="font-semibold">Gestionar Contratos</p>
                  <p className="text-xs text-muted-foreground">Vacantes y candidatos</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            )}

            <Button
              onClick={() => navigate('/vacaciones/solicitar')}
              variant="outline"
              className="h-auto py-4 justify-start group hover:border-primary hover:bg-primary/5 transition-all"
            >
              <Calendar className="mr-3 h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-semibold">Solicitar Vacaciones</p>
                <p className="text-xs text-muted-foreground">Nueva solicitud</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>

            <Button
              onClick={() => navigate('/incidencias/new')}
              variant="outline"
              className="h-auto py-4 justify-start group hover:border-primary hover:bg-primary/5 transition-all"
            >
              <AlertTriangle className="mr-3 h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-semibold">Reportar Incidencia</p>
                <p className="text-xs text-muted-foreground">Nueva incidencia</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>

            {canManageSH && (
              <>
                <Button
                  onClick={() => navigate('/seguridad-higiene/inventario/new')}
                  variant="outline"
                  className="h-auto py-4 justify-start group hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <Package className="mr-3 h-5 w-5 text-red-600 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="font-semibold">Agregar Ítem EPP</p>
                    <p className="text-xs text-muted-foreground">Nuevo equipo S&H</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>

                <Button
                  onClick={() => navigate('/seguridad-higiene/inspecciones/new')}
                  variant="outline"
                  className="h-auto py-4 justify-start group hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <Shield className="mr-3 h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="font-semibold">Programar Inspección</p>
                    <p className="text-xs text-muted-foreground">Nueva inspección S&H</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Info Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximas Entrevistas */}
        {recruitmentStats?.upcomingInterviews && recruitmentStats.upcomingInterviews.length > 0 && (
          <Card className="border-2 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-blue-600" />
                  Próximas Entrevistas
                </span>
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                  {recruitmentStats.upcomingInterviews.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {recruitmentStats.upcomingInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="flex flex-col gap-2 rounded-lg border-2 border-blue-100 dark:border-blue-900 p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                    onClick={() => interview.candidateId && navigate(`/reclutamiento/candidatos/${interview.candidateId}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{interview.candidateName}</p>
                        <p className="text-sm text-muted-foreground">{interview.positionTitle}</p>
                      </div>
                      {interview.status && (
                        <Badge variant="secondary">{interview.status}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {interview.scheduledAt && (
                        <span>{format(new Date(interview.scheduledAt), 'dd/MM/yyyy HH:mm')}</span>
                      )}
                      {interview.interviewType && <span>• {interview.interviewType}</span>}
                      {interview.location && <span>• {interview.location}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vacaciones Pendientes */}
        {vacationsData?.pending && vacationsData.pending.length > 0 && (
          <Card className="border-2 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Solicitudes de Vacaciones
                </span>
                <Badge className="bg-purple-600">
                  {vacationsData.pending.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {vacationsData.pending.map((vacation: any) => (
                  <div
                    key={vacation.id}
                    className="flex items-center justify-between p-4 border-2 border-purple-100 dark:border-purple-900 rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-300 dark:hover:border-purple-700 transition-all group"
                    onClick={() => navigate('/vacaciones')}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground group-hover:text-purple-600 transition-colors">
                        {vacation.profiles?.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(vacation.start_date), 'dd/MM/yyyy')} - {format(new Date(vacation.end_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                      {vacation.days_requested} días
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Incidencias Abiertas */}
        {incidentsData?.open && incidentsData.open.length > 0 && (
          <Card className="border-2 border-orange-200 dark:border-orange-800 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Incidencias Abiertas
                </span>
                <Badge variant="destructive" className="animate-pulse">
                  {incidentsData.open.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {incidentsData.open.map((incident: any) => (
                  <div
                    key={incident.id}
                    className="flex items-center justify-between p-4 border-2 border-orange-100 dark:border-orange-900 rounded-lg cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950 hover:border-orange-300 dark:hover:border-orange-700 transition-all group"
                    onClick={() => navigate(`/incidencias/${incident.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground group-hover:text-orange-600 transition-colors">
                        {incident.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{incident.incident_type}</p>
                    </div>
                    <Badge variant={incident.severity === 'critica' ? 'destructive' : 'secondary'}>
                      {incident.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock Crítico */}
        {canManageSH && inventoryData?.critical && inventoryData.critical.length > 0 && (
          <Card className="border-2 border-red-200 dark:border-red-800 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-red-50 to-transparent dark:from-red-950">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-red-600" />
                  Stock Crítico S&H
                </span>
                <Badge variant="destructive" className="animate-pulse">
                  {inventoryData.critical.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {inventoryData.critical.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border-2 border-red-100 dark:border-red-900 rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-300 dark:hover:border-red-700 transition-all group"
                    onClick={() => navigate(`/seguridad-higiene/inventario/${item.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground group-hover:text-red-600 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <Badge variant="destructive">
                      {item.stock_quantity}/{item.min_stock}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inspecciones Programadas */}
        {canManageSH && inspectionsData?.upcoming && inspectionsData.upcoming.length > 0 && (
          <Card className="border-2 border-indigo-200 dark:border-indigo-800 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-950">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  Inspecciones Programadas
                </span>
                <Badge className="bg-indigo-600">
                  {inspectionsData.upcoming.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {inspectionsData.upcoming.map((inspection: any) => (
                  <div
                    key={inspection.id}
                    className="flex items-center justify-between p-4 border-2 border-indigo-100 dark:border-indigo-900 rounded-lg cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
                    onClick={() => navigate(`/seguridad-higiene/inspecciones/${inspection.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground group-hover:text-indigo-600 transition-colors">
                        {inspection.sh_sectors?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(inspection.scheduled_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950">
                      {inspection.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documentos Recientes */}
        {documentsData?.recent && documentsData.recent.length > 0 && (
          <Card className="border-2 border-green-200 dark:border-green-800 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-transparent dark:from-green-950">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Documentos Recientes
                </span>
                <Button variant="ghost" size="sm" onClick={() => navigate('/documentos')} className="hover:bg-green-100 dark:hover:bg-green-900">
                  Ver todos
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {documentsData.recent.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border-2 border-green-100 dark:border-green-900 rounded-lg cursor-pointer hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-300 dark:hover:border-green-700 transition-all group"
                    onClick={() => navigate(`/documentos/${doc.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground group-hover:text-green-600 transition-colors">
                        {doc.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {doc.category} • {doc.profiles?.full_name}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                      v{doc.version}
                    </Badge>
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
