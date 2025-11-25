import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase-with-auth';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function VacationCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: holidays } = useQuery({
    queryKey: ['holidays', currentMonth.getFullYear()],
    queryFn: async () => {
      const { data } = await supabase
        .from('holiday_calendar')
        .select('*')
        .eq('year', currentMonth.getFullYear())
        .order('holiday_date');
      return data || [];
    }
  });

  const { data: vacationRequests } = useQuery({
    queryKey: ['vacation-calendar', currentMonth],
    queryFn: async () => {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data } = await supabase
        .from('vacation_requests')
        .select(`
          id,
          start_date,
          end_date,
          status,
          profiles:profile_id (full_name)
        `)
        .in('status', ['aprobado', 'pendiente'])
        .gte('start_date', startOfMonth.toISOString())
        .lte('end_date', endOfMonth.toISOString());

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
    return holidays?.some(h => 
      new Date(h.holiday_date).toDateString() === date.toDateString()
    );
  };

  const isBlackout = (date: Date) => {
    return blackoutPeriods?.some(bp => {
      const start = new Date(bp.start_date);
      const end = new Date(bp.end_date);
      return date >= start && date <= end;
    });
  };

  const getVacationsOnDate = (date: Date) => {
    return vacationRequests?.filter((req: any) => {
      const start = new Date(req.start_date);
      const end = new Date(req.end_date);
      return date >= start && date <= end;
    }) || [];
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendario de Vacaciones</h1>
        <p className="text-muted-foreground">
          Vista global de días festivos, períodos bloqueados y vacaciones del personal
        </p>
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

                return (
                  <div
                    key={index}
                    className={`min-h-20 p-2 border rounded-lg ${
                      isWeekend ? 'bg-muted/50' : ''
                    } ${holiday ? 'bg-red-50 border-red-200' : ''} ${
                      blackout ? 'bg-orange-50 border-orange-200' : ''
                    }`}
                  >
                    <div className="text-sm font-semibold mb-1">{day.getDate()}</div>
                    {holiday && (
                      <Badge variant="destructive" className="text-[10px] w-full mb-1">
                        Festivo
                      </Badge>
                    )}
                    {blackout && (
                      <Badge variant="outline" className="text-[10px] w-full mb-1 bg-orange-100">
                        Bloqueado
                      </Badge>
                    )}
                    {vacations.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] w-full">
                        {vacations.length} persona{vacations.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leyenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-50 border-red-200 border rounded" />
                <span className="text-sm">Día festivo oficial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-50 border-orange-200 border rounded" />
                <span className="text-sm">Período bloqueado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted/50 border rounded" />
                <span className="text-sm">Fin de semana</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">N</Badge>
                <span className="text-sm">Vacaciones solicitadas</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Días Festivos {currentMonth.getFullYear()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {holidays?.map((holiday: any) => (
                  <div key={holiday.id} className="flex items-start gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 mt-0.5 text-red-600" />
                    <div>
                      <p className="font-medium">{holiday.holiday_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(holiday.holiday_date).toLocaleDateString('es-MX', {
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
