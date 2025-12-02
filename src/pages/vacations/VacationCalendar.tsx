import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, AlertCircle, User, CheckCircle2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export default function VacationCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateInfo, setSelectedDateInfo] = useState<{ date: Date; requests: any[] } | null>(null);
const [searchTerm, setSearchTerm] = useState('');
  const { data: holidays } = useQuery({
    queryKey: ['holidays', currentMonth.getFullYear()],
    queryFn: async () => {
      const year = currentMonth.getFullYear();

      // 1. Obtener festivos personalizados de tu base de datos
      const { data: dbHolidays } = await supabase
        .from('holiday_calendar')
        .select('*')
        .eq('year', year)
        .order('holiday_date');

      // ---------------------------------------------------------
      // CÁLCULO DE SEMANA SANTA (Algoritmo estándar para fecha móvil)
      // ---------------------------------------------------------
      const getEasterDate = (y: number) => {
        const a = y % 19;
        const b = Math.floor(y / 100);
        const c = y % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed month
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(y, month, day);
      };

      const easterSunday = getEasterDate(year);
      
      // Calculamos Jueves y Viernes Santo restando días al Domingo de Resurrección
      const juevesSanto = new Date(easterSunday);
      juevesSanto.setDate(easterSunday.getDate() - 3); // Jueves es -3 días
      
      const viernesSanto = new Date(easterSunday);
      viernesSanto.setDate(easterSunday.getDate() - 2); // Viernes es -2 días

      const formatoFecha = (d: Date) => d.toISOString().split('T')[0];

      // ---------------------------------------------------------

      // 2. Definir festivos fijos + Semana Santa calculada
      const staticHolidays = [
        { id: `static-1-${year}`, holiday_date: `${year}-01-01`, holiday_name: 'Año Nuevo (Intl)' },
        { id: `static-2-${year}`, holiday_date: `${year}-02-05`, holiday_name: 'Día de la Constitución (MX)' },
        { id: `static-3-${year}`, holiday_date: `${year}-03-21`, holiday_name: 'Natalicio de Benito Juárez (MX)' },
        // Agregamos Semana Santa dinámica
        { id: `static-ss-thu-${year}`, holiday_date: formatoFecha(juevesSanto), holiday_name: 'Jueves Santo' },
        { id: `static-ss-fri-${year}`, holiday_date: formatoFecha(viernesSanto), holiday_name: 'Viernes Santo' },
        
        { id: `static-4-${year}`, holiday_date: `${year}-05-01`, holiday_name: 'Día del Trabajo (Intl)' },
        { id: `static-5-${year}`, holiday_date: `${year}-09-16`, holiday_name: 'Día de la Independencia (MX)' },
        { id: `static-6-${year}`, holiday_date: `${year}-11-02`, holiday_name: 'Día de Muertos (MX)' },
        { id: `static-7-${year}`, holiday_date: `${year}-11-20`, holiday_name: 'Día de la Revolución (MX)' },
        { id: `static-8-${year}`, holiday_date: `${year}-12-12`, holiday_name: 'Día de la Virgen de Guadalupe (MX)' },
        { id: `static-9-${year}`, holiday_date: `${year}-12-25`, holiday_name: 'Navidad (Intl)' },
      ];

      // 3. Combinar ambos listados (DB + Estáticos)
      const allHolidaysMap = new Map();
      staticHolidays.forEach(h => allHolidaysMap.set(h.holiday_date, h));
      
      if (dbHolidays) {
        dbHolidays.forEach((h: any) => allHolidaysMap.set(h.holiday_date, h));
      }

      const mergedHolidays = Array.from(allHolidaysMap.values()).sort((a: any, b: any) => 
        new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime()
      );

      return mergedHolidays;
    }
  });

  const { data: vacationRequests } = useQuery({
    queryKey: ['vacation-calendar', currentMonth],
    queryFn: async () => {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const startStr = startOfMonth.toISOString().split('T')[0];
      const endStr = endOfMonth.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('vacation_requests')
        .select(`
          id,
          start_date,
          end_date,
          status,
          user_id,
          profiles!fk_vacation_requests_profiles (
            full_name,
            department
          )
        `)
        .eq('status', 'approved') 
        .lte('start_date', endStr)
        .gte('end_date', startStr);

      if (error) {
        console.error("Error fetching vacations:", error);
        return [];
      }

      return data || [];
    }
  });

  const { data: blackoutPeriods } = useQuery({
    queryKey: ['blackout-periods'],
    queryFn: async () => {
      const { data } = await supabase
        .from('vacation_blackout_periods')
        .select('*')
        .eq('is_active', true)
        .order('start_date');
      return data || [];
    }
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isHoliday = (date: Date) => {
    return holidays?.some((h: any) => {
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset).toISOString().split('T')[0];
      return h.holiday_date === localDate;
    });
  };

  const isBlackout = (date: Date) => {
    return blackoutPeriods?.some(bp => {
      const start = new Date(bp.start_date);
      const end = new Date(bp.end_date);
      return date >= start && date <= end;
    });
  };

  const getVacationsOnDate = (date: Date) => {
    if (!vacationRequests) return [];
    
    const currentDayTime = new Date(date);
    currentDayTime.setHours(12, 0, 0, 0);

    return vacationRequests.filter((req: any) => {
      const start = new Date(req.start_date + 'T00:00:00');
      const end = new Date(req.end_date + 'T23:59:59');
      return currentDayTime >= start && currentDayTime <= end;
    });
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDateInfo(null);
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDateInfo(null);
  };

  const handleDayClick = (day: Date, vacations: any[]) => {
    if (vacations.length > 0) {
      setSelectedDateInfo({ date: day, requests: vacations });
    } else {
      setSelectedDateInfo(null);
    }
  };
// --- INICIO BLOQUE NUEVO (LÓGICA FILTRO) ---
  // Filtramos las vacaciones si hay un término de búsqueda
  const departmentResults = vacationRequests?.filter((req: any) => {
    if (!searchTerm) return false;
    const dept = req.profiles?.department?.toLowerCase() || ''; // Cambia 'department' si tu columna se llama distinto
    return dept.includes(searchTerm.toLowerCase());
  }) || [];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendario de Vacaciones</h1>
        <p className="text-muted-foreground">
          Vista global de días festivos, períodos bloqueados y vacaciones del personal
        </p>
      </div>
{/* Motor de Búsqueda */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-white"
          />
        </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={prevMonth}>
                  Anterior
                </Button>
                <Button size="sm" variant="outline" onClick={nextMonth}>
                  Siguiente
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => (
                <div key={day} className="text-center font-semibold text-sm p-2">
                  {day}
                </div>
              ))}

              {days.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="p-2" />;
                }

                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const holiday = isHoliday(day);
                const blackout = isBlackout(day);
                const vacations = getVacationsOnDate(day);
                const hasVacations = vacations.length > 0;

                let bgClass = '';
                let borderClass = 'border';
                
                if (hasVacations) {
                    bgClass = 'bg-green-50 hover:bg-green-100 cursor-pointer transition-colors';
                    borderClass = 'border-green-200';
                } else if (holiday) {
                    bgClass = 'bg-red-50';
                    borderClass = 'border-red-200';
                } else if (blackout) {
                    bgClass = 'bg-orange-50';
                    borderClass = 'border-orange-200';
                } else if (isWeekend) {
                    bgClass = 'bg-muted/50';
                }

                return (
                  <div
                    key={index}
                    onClick={() => handleDayClick(day, vacations)}
                    className={`min-h-20 p-2 rounded-lg ${bgClass} ${borderClass}`}
                  >
                    <div className="text-sm font-semibold mb-1">{day.getDate()}</div>
                    {holiday && (
                      <Badge variant="destructive" className="text-[10px] w-full mb-1">
                        Festivo
                      </Badge>
                    )}
                    {hasVacations && (
                      <Badge className="text-[10px] w-full bg-green-600 hover:bg-green-700 border-none text-white">
                        {vacations.length} {vacations.length === 1 ? 'Aprobado' : 'Aprobados'}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {searchTerm && (
            <Card className="border-blue-200 bg-blue-50/50 animate-in fade-in zoom-in-95 duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                  <Search className="h-4 w-4" />
                  Resultados: "{searchTerm}"
                </CardTitle>
              </CardHeader>
              <CardContent>
                {departmentResults.length > 0 ? (
                  <div className="space-y-3">
                    {departmentResults.map((req: any) => (
                      <div key={req.id} className="flex items-center gap-3 bg-white p-3 rounded-md border border-blue-100 shadow-sm">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {req.profiles ? req.profiles.full_name : "Usuario"}
                          </p>
                          <p className="text-xs text-blue-600 font-medium">
                            {req.profiles?.department || "Sin departamento"}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {new Date(req.start_date + 'T12:00:00').toLocaleDateString('es-MX')} - {new Date(req.end_date + 'T12:00:00').toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No se encontraron vacaciones para este departamento en este mes.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          {selectedDateInfo && (
            <Card className="border-green-200 bg-green-50/50 animate-in fade-in slide-in-from-top-4 duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-4 w-4" />
                  {selectedDateInfo.date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedDateInfo.requests.map((req: any) => (
                    <div key={req.id} className="flex items-center gap-3 bg-white p-3 rounded-md border border-green-100 shadow-sm">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                            {req.profiles ? req.profiles.full_name : "Usuario"}
                        </p>
                        <p className="text-xs text-green-600 font-medium">
                            Vacaciones Aprobadas
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Tipo de Día o Fecha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-50 border-red-200 border rounded" />
                <span className="text-sm">Día festivo oficial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-50 border-green-200 border rounded" />
                <span className="text-sm">Vacaciones Aprobadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted/50 border rounded" />
                <span className="text-sm">Fin de semana</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Días Festivos </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {holidays?.map((holiday: any) => (
                  <div key={holiday.id} className="flex items-start gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 mt-0.5 text-red-600" />
                    <div>
                      <p className="font-medium">{holiday.holiday_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(holiday.holiday_date + 'T12:00:00').toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'long'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {blackoutPeriods && blackoutPeriods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Períodos Bloqueados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {blackoutPeriods.map((period: any) => (
                    <div key={period.id} className="text-sm">
                      <p className="font-medium">{period.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(period.start_date).toLocaleDateString('es-MX')} -{' '}
                        {new Date(period.end_date).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}