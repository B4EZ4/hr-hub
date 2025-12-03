import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Calendar, AlertTriangle, CheckCircle, User, Briefcase, Clock, ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function EmployeeVacationSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // ------------------------------------------------------------------
  // 1. QUERY DE BÚSQUEDA (MODO SEGURO: SOLO TABLA USERS)
  // ------------------------------------------------------------------
  const { data: employees, isLoading: searchLoading } = useQuery({
    queryKey: ['employees-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      console.log("🔍 Buscando en tabla PUBLIC.USERS:", searchTerm);

      // CAMBIO CLAVE: Quitamos la dependencia de 'profiles' y 'status' en la búsqueda.
      // Buscamos puramente en la tabla que nos mostraste en la captura.
      const { data, error } = await (supabase as any)
        .from('users') 
        .select('id, full_name, email, username') // Solo pedimos lo que seguro existe
        .ilike('full_name', `%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error("❌ Error conectando a users:", error);
        return [];
      }
      
      console.log("✅ Encontrados en users:", data);
      return data || [];
    },
    enabled: searchTerm.length >= 2
  });

  // ------------------------------------------------------------------
  // 2. QUERY DE DETALLES (ESTA SE EJECUTA AL SELECCIONAR)
  // ------------------------------------------------------------------
  const { data: employeeDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['employee-vacation-detail', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;

      const currentYear = new Date().getFullYear();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // --- FUNCIONES INTERNAS ---

      // A. Usuario (Base)
      const fetchUser = async () => {
        const { data, error } = await (supabase as any)
          .from('users')
          .select('*')
          .eq('id', selectedUserId)
          .single();
        if (error) throw error;
        return data;
      };

      // B. Perfil (Datos extra)
      const fetchProfile = async () => {
        try {
          const { data } = await (supabase as any)
            .from('profiles')
            .select('department, position, hire_date, employee_number')
            .eq('user_id', selectedUserId)
            .maybeSingle();
          return data;
        } catch { return null; }
      };

      // C. Balance
      const fetchBalance = async () => {
        const { data } = await (supabase as any)
          .from('vacation_balances')
          .select('total_days, used_days, available_days, year')
          .eq('user_id', selectedUserId)
          .eq('year', currentYear)
          .maybeSingle();
        return data;
      };

      // D. Contrato
      const fetchContract = async () => {
        try {
          const { data } = await (supabase as any)
            .from('contracts')
            .select('salary, type')
            .eq('user_id', selectedUserId)
            .eq('status', 'activo')
            .maybeSingle();
          return data;
        } catch { return null; }
      };

      // E. Asistencia
      const fetchAttendance = async () => {
        try {
          const { data } = await (supabase as any)
            .from('attendance_records')
            .select('status, minutes_late')
            .eq('user_id', selectedUserId)
            .gte('attendance_date', oneYearAgo.toISOString());
          return data || [];
        } catch { return []; }
      };

      // F. Incidencias
      const fetchIncidents = async () => {
        try {
          const { data } = await (supabase as any)
            .from('incidents')
            .select('severity')
            .eq('reported_by', selectedUserId)
            .in('severity', ['critica', 'alta'])
            .eq('status', 'abierto');
          return data || [];
        } catch { return []; }
      };

      const [user, profile, balance, contract, attendance, incidents] = await Promise.all([
        fetchUser(),
        fetchProfile(),
        fetchBalance(),
        fetchContract(),
        fetchAttendance(),
        fetchIncidents()
      ]);

      if (!user) throw new Error("Usuario no encontrado");

      // --- CÁLCULOS ---
      const startDateStr = profile?.hire_date || user.created_at || new Date().toISOString();
      const hireDate = new Date(startDateStr);
      const yearsOfService = Math.max(0, Math.floor((new Date().getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)));

      let daysEarned = 12; 
      if (yearsOfService >= 1) {
          if (yearsOfService >= 1 && yearsOfService <= 5) {
             daysEarned = 12 + ((yearsOfService - 1) * 2);
          } else if (yearsOfService > 5) {
             daysEarned = 20 + (Math.floor((yearsOfService - 6) / 5) * 2);
          }
      }

      const finalBalance = balance ? {
          total_days: balance.total_days,
          used_days: balance.used_days,
          available_days: balance.available_days
      } : {
          total_days: daysEarned,
          used_days: 0,
          available_days: daysEarned
      };

      const totalDaysRecorded = attendance.length;
      const presentDays = attendance.filter((a: any) => a.status === 'presente' || a.status === 'retardo').length;
      const attendancePercentage = totalDaysRecorded > 0 ? (presentDays / totalDaysRecorded) * 100 : 100;
      const totalMinutesLate = attendance.reduce((acc: number, curr: any) => acc + (curr.minutes_late || 0), 0);

      return {
        fullName: user.full_name,
        // Si no hay perfil, mostramos el username o 'S/N'
        employeeNumber: profile?.employee_number || user.id || 'S/N',
        email: user.email,
        department: profile?.department || user.department || 'General',
        position: profile?.position || user.position || 'Colaborador',
        hireDate: hireDate,
        balance: finalBalance,
        yearsOfService,
        salary: contract?.salary || 0,
        contractType: contract?.type || 'No def.',
        attendancePercentage,
        minutesLate: totalMinutesLate,
        hasAttendanceAlert: attendancePercentage < 85 && totalDaysRecorded > 0,
        hasSevereIncidents: incidents.length > 0,
        incidentsCount: incidents.length
      };
    },
    enabled: !!selectedUserId
  });

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Búsqueda de Empleado</h1>
          <p className="text-muted-foreground mt-1">
            Consulta el balance de vacaciones y genera solicitudes.
          </p>
        </div>
      </div>

      {/* SECCIÓN 1: BUSCADOR */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Buscar Empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre (ej: Emmanuel)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 text-base"
            />
          </div>

          {searchLoading && <p className="text-sm text-gray-500 mt-4 animate-pulse">Consultando base de datos...</p>}

          {/* LISTA DE RESULTADOS (Simplificada para asegurar visualización) */}
          {employees && employees.length > 0 && !selectedUserId && (
            <div className="mt-4 space-y-2 border rounded-md p-2 bg-gray-50/50">
              {employees.map((emp: any) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-3 bg-white border rounded-md hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer shadow-sm group"
                  onClick={() => {
                      setSelectedUserId(emp.id);
                      setSearchTerm(''); 
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{emp.full_name}</span>
                      </div>
                      
                      {/* Mostramos el email ya que viene directo de users */}
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {emp.email}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700">
                    Seleccionar →
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchTerm.length >= 2 && employees?.length === 0 && !searchLoading && (
            <div className="mt-4 p-4 text-center border-2 border-dashed rounded-lg bg-gray-50">
                <p className="text-gray-500">
                    No se encontró a "{searchTerm}" en la tabla <strong>users</strong>.
                </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN 2: DETALLE (FICHA) */}
      {selectedUserId && employeeDetail && (
        <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <Card className="lg:col-span-2 shadow-md border-blue-100 overflow-hidden">
            <div className="bg-blue-600 h-2 w-full"></div>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5 text-blue-600" />
                Ficha del Empleado
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUserId(null)}>
                 <ArrowLeft className="h-4 w-4 mr-1"/> Cambiar Empleado
              </Button>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Datos Personales */}
              <div className="grid gap-6 md:grid-cols-2 bg-gray-50 p-4 rounded-lg border">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Empleado</p>
                  <p className="text-lg font-bold text-gray-900">{employeeDetail.fullName}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px]">{employeeDetail.contractType}</Badge>
                    <span className="text-xs text-gray-500">ID: {employeeDetail.employeeNumber}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Departamento</p>
                        <p className="text-sm font-medium">{employeeDetail.department}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Antigüedad</p>
                        <p className="text-sm font-medium">{employeeDetail.yearsOfService} años</p>
                     </div>
                     <div className="space-y-1 col-span-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha Alta</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Clock className="h-3.5 w-3.5 text-gray-400"/>
                            {employeeDetail.hireDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric'})}
                        </div>
                     </div>
                </div>
              </div>

              {/* Balance */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    Balance de Vacaciones {new Date().getFullYear()}
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-white p-4 rounded-xl border-2 border-blue-100 shadow-sm flex flex-col items-center text-center">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Total por Ley</span>
                    <span className="text-3xl font-extrabold text-blue-600">{employeeDetail.balance.total_days}</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border-2 border-orange-100 shadow-sm flex flex-col items-center text-center">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Disfrutados</span>
                    <span className="text-3xl font-extrabold text-orange-600">{employeeDetail.balance.used_days}</span>
                  </div>

                  <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1 bg-green-200 rounded-bl-lg">
                        <CheckCircle className="h-3 w-3 text-green-700"/>
                    </div>
                    <span className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Disponibles</span>
                    <span className="text-3xl font-extrabold text-green-700">{employeeDetail.balance.available_days}</span>
                  </div>
                </div>
              </div>

              {/* Alertas */}
              {(employeeDetail.hasAttendanceAlert || employeeDetail.hasSevereIncidents) && (
                <div className="space-y-3 pt-2">
                  {employeeDetail.hasAttendanceAlert && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>Alerta de Asistencia:</strong> Asistencia {employeeDetail.attendancePercentage.toFixed(1)}%. 
                      </AlertDescription>
                    </Alert>
                  )}

                  {employeeDetail.hasSevereIncidents && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>Incidencias Activas:</strong> Existen {employeeDetail.incidentsCount} incidencias graves.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="space-y-6">
                <CardContent className="space-y-4 pt-6">
                  <div className="mt-4">
                      {employeeDetail.balance.available_days <= 0 ? (
                        <div className="flex items-start gap-2 p-3 bg-orange-50 rounded text-sm text-orange-700 border border-orange-100">
                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0"/>
                            <span>Sin días disponibles.</span>
                        </div>
                      ) : (
                         !employeeDetail.hasAttendanceAlert && !employeeDetail.hasSevereIncidents && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 rounded text-sm text-green-700 border border-green-100">
                                <CheckCircle className="h-4 w-4 shrink-0"/>
                                <span>Elegible para vacaciones.</span>
                            </div>
                         )
                      )}
                  </div>

                </CardContent>
          </div>

        </div>
      )}
    </div>
  );
}