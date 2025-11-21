import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInMinutes, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Clock8, UserCheck, Users } from "lucide-react";

type AttendanceRecord = Database["public"]["Tables"]["attendance_records"]["Row"] & {
  profiles?: {
    full_name: string;
    department: string | null;
    position: string | null;
  };
};

type EmployeeProfile = Pick<Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "department" | "position" | "status" | "avatar_url" | "hire_date">
;

type VacationRequest = Pick<Database["public"]["Tables"]["vacation_requests"]["Row"],
  "id" | "user_id" | "start_date" | "end_date" | "status">
;

const formatTime = (value?: string | null) => value ? value.slice(0, 5) : "—";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return format(new Date(value), "dd MMM");
};

const getMinutesLate = (record: AttendanceRecord) => {
  if (!record.check_in) return record.minutes_late || 0;
  const scheduledDate = new Date(`${record.attendance_date}T${record.scheduled_start}`);
  const checkInDate = new Date(record.check_in);
  const diff = differenceInMinutes(checkInDate, scheduledDate);
  return diff > 0 ? diff : 0;
};

const statusVariant: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  puntual: { label: "Puntual", variant: "default" },
  tarde: { label: "Tarde", variant: "destructive" },
  ausente: { label: "Ausente", variant: "secondary" },
  permiso: { label: "Permiso", variant: "outline" },
  pendiente: { label: "Pendiente", variant: "secondary" },
};

export default function AttendanceDashboard() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const todayIso = format(today, "yyyy-MM-dd");

  const { data: employees = [], isLoading: employeesLoading } = useQuery<EmployeeProfile[]>({
    queryKey: ["attendance-employees"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, department, position, status, avatar_url, hire_date")
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: attendance = [], isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance-records", weekStart.toISOString(), weekEnd.toISOString()],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("attendance_records")
        .select("*, profiles:profiles!attendance_records_user_id_fkey(full_name, department, position)")
        .gte("attendance_date", format(weekStart, "yyyy-MM-dd"))
        .lte("attendance_date", format(weekEnd, "yyyy-MM-dd"))
        .order("attendance_date", { ascending: false })
        .order("check_in", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: absences = [] } = useQuery<VacationRequest[]>({
    queryKey: ["attendance-absences"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("vacation_requests")
        .select("id, user_id, start_date, end_date, status")
        .in("status", ["aprobado", "en_proceso"]);

      if (error) throw error;
      return data || [];
    },
  });

  const todayRecords = useMemo(
    () => attendance.filter((record) => record.attendance_date === todayIso),
    [attendance, todayIso]
  );

  const employeesMap = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees]);

  const lateToday = todayRecords.filter((record) => getMinutesLate(record) >= 5 || record.status === "tarde");
  const onTimeToday = todayRecords.filter((record) => (record.status || "") === "puntual" && getMinutesLate(record) < 5);
  const coverageRate = employees.length > 0 ? Math.round((todayRecords.length * 100) / employees.length) : 0;

  const employeesOnLeave = absences.filter((absence) => {
    const start = new Date(absence.start_date);
    const end = new Date(absence.end_date);
    return isWithinInterval(today, { start, end });
  });

  const weeklySummary = useMemo(() => {
    return attendance.reduce(
      (acc, record) => {
        const minutesLate = getMinutesLate(record);
        if ((record.status || "") === "puntual" && minutesLate < 5) {
          acc.onTime += 1;
        } else if ((record.status || "") === "tarde" || minutesLate >= 5) {
          acc.late += 1;
        } else {
          acc.absent += 1;
        }
        return acc;
      },
      { onTime: 0, late: 0, absent: 0 }
    );
  }, [attendance]);

  const departmentSummary = useMemo(() => {
    const todayMap = new Map(todayRecords.map((record) => [record.user_id, record]));
    return employees.reduce((acc, employee) => {
      const department = employee.department || "Sin departamento";
      if (!acc[department]) {
        acc[department] = { total: 0, present: 0 };
      }
      acc[department].total += 1;
      if (todayMap.has(employee.id)) {
        acc[department].present += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; present: number }>);
  }, [employees, todayRecords]);

  if (employeesLoading || attendanceLoading) {
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
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Módulo</p>
            <h1 className="text-4xl font-bold tracking-tight">Asistencia</h1>
            <p className="text-muted-foreground">
              Supervisa el ingreso diario del personal, detecta tardanzas y controla ausencias en tiempo real.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">Exportar reporte</Button>
            <Button>
              <Clock8 className="mr-2 h-4 w-4" />
              Registrar evento
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados activos</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">con registro en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura hoy</CardTitle>
            <UserCheck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{coverageRate}%</div>
            <p className="text-xs text-muted-foreground">{todayRecords.length} registros de {employees.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tardanzas hoy</CardTitle>
            <Clock8 className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{lateToday.length}</div>
            <p className="text-xs text-muted-foreground">{onTimeToday.length} ingresos puntuales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausencias</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employeesOnLeave.length}</div>
            <p className="text-xs text-muted-foreground">con permisos o vacaciones activos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registros de hoy</CardTitle>
            <CardDescription>Detalle de entradas y salidas del {format(today, "dd 'de' MMMM")}</CardDescription>
          </CardHeader>
          <CardContent>
            {todayRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay registros de asistencia para hoy.</p>
            ) : (
              <ScrollArea className="h-[420px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead className="text-right">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayRecords.map((record) => {
                      const statusKey = record.status || "pendiente";
                      const status = statusVariant[statusKey] || statusVariant.pendiente;
                      const employee = employeesMap.get(record.user_id);
                      const employeeName = record.profiles?.full_name || employee?.full_name || "Empleado";
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={employee?.avatar_url || undefined} alt={employeeName} />
                                <AvatarFallback>{employeeName.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{employeeName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {record.profiles?.position || record.profiles?.department || "Sin asignar"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">
                              {formatTime(record.scheduled_start)} - {formatTime(record.scheduled_end)}
                            </p>
                            <p className="text-xs text-muted-foreground">{getMinutesLate(record)} min tarde</p>
                          </TableCell>
                          <TableCell>{record.check_in ? format(new Date(record.check_in), "HH:mm") : "—"}</TableCell>
                          <TableCell>{record.check_out ? format(new Date(record.check_out), "HH:mm") : "—"}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen semanal</CardTitle>
              <CardDescription>Comportamiento entre {format(weekStart, "dd MMM")} y {format(weekEnd, "dd MMM")}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Puntualidad</span>
                  <span>{weeklySummary.onTime} registros</span>
                </div>
                <Progress value={(weeklySummary.onTime / Math.max(attendance.length, 1)) * 100} className="mt-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Tardanzas</span>
                  <span>{weeklySummary.late} registros</span>
                </div>
                <Progress value={(weeklySummary.late / Math.max(attendance.length, 1)) * 100} className="mt-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Ausencias</span>
                  <span>{weeklySummary.absent} registros</span>
                </div>
                <Progress value={(weeklySummary.absent / Math.max(attendance.length, 1)) * 100} className="mt-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ausencias programadas</CardTitle>
              <CardDescription>Vacaciones y permisos recientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {absences.length === 0 && <p className="text-sm text-muted-foreground">No hay ausencias registradas.</p>}
              {absences.slice(0, 5).map((absence) => {
                const employee = employeesMap.get(absence.user_id);
                return (
                  <div key={absence.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{employee?.full_name || "Empleado"}</p>
                      <Badge variant="outline">{absence.status}</Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {formatDate(absence.start_date)} - {formatDate(absence.end_date)}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monitoreo por departamento</CardTitle>
          <CardDescription>Estado de cobertura diaria por equipo</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(departmentSummary).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin departamentos registrados.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(departmentSummary).map(([department, data]) => {
                const coverage = data.total > 0 ? Math.round((data.present * 100) / data.total) : 0;
                return (
                  <div key={department} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{department}</p>
                      <Badge variant={coverage >= 80 ? "default" : coverage >= 50 ? "secondary" : "destructive"}>
                        {coverage}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {data.present} presentes de {data.total}
                    </p>
                    <Separator className="my-3" />
                    <Progress value={coverage} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
