import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Calendar } from 'lucide-react';

const vacationSchema = z.object({
  start_date: z.string().min(1, 'Fecha de inicio requerida'),
  end_date: z.string().min(1, 'Fecha de fin requerida'),
  reason: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['end_date'],
});

type VacationFormData = z.infer<typeof vacationSchema>;

export default function VacationRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: balance } = useQuery({
    queryKey: ['vacation-balance', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const currentYear = new Date().getFullYear();
      const { data, error } = await (supabase as any)
        .from('vacation_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', currentYear)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || { total_days: 22, used_days: 0, remaining_days: 22 };
    },
    enabled: !!user,
  });

  const form = useForm<VacationFormData>({
    resolver: zodResolver(vacationSchema),
    defaultValues: {
      start_date: '',
      end_date: '',
      reason: '',
    },
  });

  const calculateDays = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const mutation = useMutation({
    mutationFn: async (data: VacationFormData) => {
      if (!user) throw new Error('No user found');

      const days = calculateDays(data.start_date, data.end_date);

      if (balance && days > balance.remaining_days) {
        throw new Error(`No tienes suficientes días disponibles. Disponibles: ${balance.remaining_days}`);
      }

      const { error } = await (supabase as any)
        .from('vacation_requests')
        .insert([{
          user_id: user.id,
          start_date: data.start_date,
          end_date: data.end_date,
          days_requested: days,
          reason: data.reason,
          status: 'pendiente',
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['vacation-balance'] });
      toast.success('Solicitud de vacaciones enviada');
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al enviar solicitud');
    },
  });

  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');
  const requestedDays = startDate && endDate ? calculateDays(startDate, endDate) : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Solicitar Vacaciones</h1>
        <p className="text-muted-foreground">
          Crea una nueva solicitud de vacaciones
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Días Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{balance?.total_days || 22}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Días Usados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{balance?.used_days || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Días Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{balance?.remaining_days || 22}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Solicitud</CardTitle>
          <CardDescription>
            Completa el formulario para solicitar tus vacaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Inicio *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Fin *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {requestedDays > 0 && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">
                    Días solicitados: <strong>{requestedDays}</strong>
                    {balance && requestedDays > balance.remaining_days && (
                      <span className="text-destructive ml-2">
                        (Excede días disponibles)
                      </span>
                    )}
                  </span>
                </div>
              )}

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo (opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Describe el motivo de tu solicitud..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Solicitud
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
