import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Calendar, AlertTriangle, CheckCircle, User, Briefcase, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function EmployeeVacationSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const { data: employees, isLoading: searchLoading } = useQuery({
    queryKey: ['employees-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const { data } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, employee_number, email, areas(name), positions(title), hire_date, status')
        .or(`full_name.ilike.%${searchTerm}%,employee_number.ilike.%${searchTerm}%`)
        .eq('status', 'activo')
        .limit(10);

      return data || [];
    },
    enabled: searchTerm.length >= 2
  });

  const { data: employeeDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['employee-vacation-detail', selectedEmployee],
    queryFn: async () => {
      if (!selectedEmployee) return null;

      const [profileRes, balanceRes, contractRes, attendanceRes, incidentsRes] = await Promise.all([
        (supabase as any)
          .from('profiles')
          .select('*, areas(name), positions(title)')
          .eq('id', selectedEmployee)
          .single(),
        supabase
          .from('vacation_balances')
          .select('*')
          .eq('user_id', selectedEmployee)
          .eq('year', new Date().getFullYear())
          .maybeSingle(),
        supabase
          .from('contracts')
          .select('salary')
          .eq('profile_id', selectedEmployee)
          .eq('status', 'activo')
          .maybeSingle(),
        supabase
          .from('attendance_records')
          .select('status')
          .eq('user_id', selectedEmployee)
          .gte('attendance_date', new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString()),
        supabase
          .from('incidents')
          .select('severity')
          .eq('reported_by', selectedEmployee)
          .in('severity', ['critica', 'alta'])
          .eq('status', 'abierto')
      ]);

      const profile = profileRes.data;
      const balance = balanceRes.data;
      const contract = contractRes.data;
      const attendance = attendanceRes.data || [];
      const incidents = incidentsRes.data || [];

      // Calcular % de asistencia
      const totalDays = attendance.length;
      const presentDays = attendance.filter(a => a.status === 'presente').length;
      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

      // Calcular antigüedad y días según ley
      const hireDate = new Date(profile.hire_date);
      const yearsOfService = Math.floor((new Date().getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365));

      let daysEarned = 12; // Año 1
      if (yearsOfService >= 2 && yearsOfService <= 5) {
        daysEarned = 12 + ((yearsOfService - 1) * 2);
      } else if (yearsOfService > 5) {
        daysEarned = 20 + (Math.floor((yearsOfService - 5) / 5) * 2);
      }

      return {
        profile,
        balance: balance || { total_days: daysEarned, used_days: 0, available_days: daysEarned },
        yearsOfService,
        calculatedDays: daysEarned,
        salary: contract?.salary || 0,
        attendancePercentage,
        hasAttendanceAlert: attendancePercentage < 85,
        hasSevereIncidents: incidents.length > 0,
        incidents
      };
    },
    enabled: !!selectedEmployee
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Búsqueda de Empleado</h1>
        <p className="text-muted-foreground">
          Consulta el balance de vacaciones y genera solicitudes
        </p>
      </div>

      {/* Buscador */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o número de empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {searchLoading && <p className="text-sm text-muted-foreground mt-4">Buscando...</p>}

          {employees && employees.length > 0 && (
            <div className="mt-4 space-y-2">
              {employees.map((emp: any) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedEmployee(emp.id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{emp.full_name}</span>
                      <Badge variant="outline">{emp.employee_number}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {emp.positions?.title || 'Sin puesto'} - {emp.areas?.name || 'Sin departamento'}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">
                    Ver Detalle
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchTerm.length >= 2 && employees?.length === 0 && !searchLoading && (
            <p className="text-center text-muted-foreground mt-4">
              No se encontraron empleados con ese criterio
            </p>
          )}
        </CardContent>
      </Card>

      {/* Ficha del Empleado */}
      {selectedEmployee && employeeDetail && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Ficha del Empleado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                  <p className="text-lg font-semibold">{employeeDetail.profile.full_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Número de Empleado</p>
                  <p className="text-lg font-semibold">{employeeDetail.profile.employee_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Puesto</p>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <p>{employeeDetail.profile.positions?.title || employeeDetail.profile.position || 'No asignado'}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Departamento</p>
                  <p>{employeeDetail.profile.areas?.name || employeeDetail.profile.department || 'No asignado'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Contratación</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p>{new Date(employeeDetail.profile.hire_date).toLocaleDateString('es-MX')}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Antigüedad</p>
                  <p className="text-lg font-semibold">{employeeDetail.yearsOfService} años</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Balance de Vacaciones {new Date().getFullYear()}</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium text-blue-900">Días Correspondientes</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {employeeDetail.balance.total_days} días
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Según Ley Federal del Trabajo</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium text-orange-900">Días Disfrutados</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {employeeDetail.balance.used_days} días
                      </p>
                      <p className="text-xs text-orange-600 mt-1">En el año actual</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium text-green-900">Saldo Disponible</p>
                      <p className="text-2xl font-bold text-green-700">
                        {employeeDetail.balance.available_days} días
                      </p>
                      <p className="text-xs text-green-600 mt-1">Listos para solicitar</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Alertas */}
              {(employeeDetail.hasAttendanceAlert || employeeDetail.hasSevereIncidents) && (
                <div className="space-y-2">
                  {employeeDetail.hasAttendanceAlert && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Alerta de Asistencia:</strong> El porcentaje de asistencia del último año es{' '}
                        {employeeDetail.attendancePercentage.toFixed(1)}% (menor a 85%). Se recomienda revisión manual.
                      </AlertDescription>
                    </Alert>
                  )}

                  {employeeDetail.hasSevereIncidents && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Incidencias Graves:</strong> Existen {employeeDetail.incidents.length} incidencia(s) crítica(s)
                        o alta(s) sin resolver. Revisar antes de aprobar vacaciones.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                disabled={employeeDetail.balance.available_days <= 0}
                onClick={() => navigate(`/vacaciones/solicitud/nueva?empleado=${selectedEmployee}`)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Crear Solicitud
              </Button>

              <Button variant="outline" className="w-full" onClick={() => navigate(`/vacaciones/historial?empleado=${selectedEmployee}`)}>
                <Search className="mr-2 h-4 w-4" />
                Ver Historial
              </Button>

              {employeeDetail.balance.available_days <= 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    El empleado no tiene días disponibles para solicitar en este momento.
                  </AlertDescription>
                </Alert>
              )}

              {employeeDetail.balance.available_days > 0 && !employeeDetail.hasAttendanceAlert && !employeeDetail.hasSevereIncidents && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-xs">
                    El empleado cumple con todos los requisitos para solicitar vacaciones.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
