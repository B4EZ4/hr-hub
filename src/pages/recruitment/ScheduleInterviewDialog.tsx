import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

const sanitize = (value?: string | null) => (value && value.trim() ? value.trim() : null);

const scheduleSchema = z.object({
  interview_type: z.enum(['screening', 'tecnica', 'cultural', 'oferta'], {
    required_error: 'Selecciona un tipo de entrevista',
  }),
  scheduled_at: z.string().min(1, 'Define fecha y hora'),
  duration_minutes: z
    .string()
    .optional()
    .refine((value) => !value || !isNaN(Number(value)), 'Debe ser un número')
    .transform((value) => (value ? Number(value) : undefined)),
  location: z
    .string()
    .max(255)
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s,.-]*$/, 'Solo se permiten letras, números y puntuación básica')
    .optional()
    .or(z.literal('')),
  meeting_url: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  application_id: z.string().uuid().optional(),
  decision: z.enum(['pendiente', 'aprobado', 'rechazado', 'otra']).default('pendiente'),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

type ApplicationWithPosition = Tables<'recruitment_applications'> & {
  position?: Tables<'recruitment_positions'> | null;
};

interface ScheduleInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  applications: ApplicationWithPosition[];
  onScheduled?: () => void;
}

export function ScheduleInterviewDialog({
  open,
  onOpenChange,
  candidateId,
  applications,
  onScheduled,
}: ScheduleInterviewDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const hasApplications = applications && applications.length > 0;

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      interview_type: 'screening',
      scheduled_at: '',
      duration_minutes: undefined,
      location: '',
      meeting_url: '',
      notes: '',
      application_id: undefined,
      decision: 'pendiente',
    },
  });

  useEffect(() => {
    if (open) {
      if (hasApplications && !form.getValues('application_id')) {
        form.setValue('application_id', applications[0].id);
      }
    } else {
      form.reset();
    }
  }, [open, hasApplications, applications, form]);

  const mutation = useMutation({
    mutationFn: async (values: ScheduleFormValues) => {
      let applicationId = values.application_id;

      if (!applicationId) {
        const { data: app, error: appError } = await (supabase as any)
          .from('recruitment_applications')
          .insert({
            candidate_id: candidateId,
            status: 'en_revision',
            current_stage: 'screening',
            created_by: user?.id ?? null,
          })
          .select('id')
          .single();

        if (appError) throw appError;
        applicationId = app.id;
      }

      const payload = {
        application_id: applicationId,
        interview_type: values.interview_type,
        scheduled_at: new Date(values.scheduled_at).toISOString(),
        duration_minutes: values.duration_minutes ?? null,
        location: sanitize(values.location),
        meeting_url: sanitize(values.meeting_url),
        next_steps: sanitize(values.notes),
        status: 'programada',
        decision: values.decision ?? 'pendiente',
        created_by: user?.id ?? null,
      } satisfies Partial<Tables<'recruitment_interviews'>> & {
        application_id: string;
        interview_type: string;
        scheduled_at: string;
        status: string;
      };

      const { data, error } = await (supabase as any)
        .from('recruitment_interviews')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Entrevista programada');
      queryClient.invalidateQueries({ queryKey: ['recruitment-candidate-detail', candidateId] });
      onOpenChange(false);
      onScheduled?.();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'No se pudo programar la entrevista');
    },
  });

  const applicationOptions = useMemo(() => {
    if (!hasApplications) return [];
    return applications.map((application) => ({
      id: application.id,
      label: `${application.position?.title || 'Vacante sin título'} · ${application.current_stage || 'Etapa no definida'
        } · ${application.status}`,
    }));
  }, [applications, hasApplications]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Programar entrevista</DialogTitle>
          <DialogDescription>Define los datos de la próxima reunión con el candidato.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            {hasApplications ? (
              <FormField
                control={form.control}
                name="application_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aplicación</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={mutation.isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona aplicación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {applicationOptions.map((option) => (
                          <SelectItem value={option.id} key={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay aplicaciones todavía. Se creará una automáticamente al guardar.
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="interview_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={mutation.isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="screening">Evaluación inicial</SelectItem>
                        <SelectItem value="tecnica">Técnica</SelectItem>
                        <SelectItem value="cultural">Cultural</SelectItem>
                        <SelectItem value="oferta">Oferta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha y hora</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="datetime-local"
                          {...field}
                          ref={(el) => {
                            field.ref(el);
                            dateInputRef.current = el;
                          }}
                          className="pr-12"
                          disabled={mutation.isPending}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="absolute right-1 top-1/2 z-10 h-8 w-8 -translate-y-1/2 text-muted-foreground"
                          onClick={() => {
                            const target = dateInputRef.current;
                            if (target?.showPicker) target.showPicker();
                            else target?.focus();
                          }}
                          disabled={mutation.isPending}
                        >
                          <CalendarDays className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="60"
                        min="1"
                        max="999"
                        disabled={mutation.isPending}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Sala, oficina, etc."
                        disabled={mutation.isPending}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s,.-]/g, '');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="meeting_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de videollamada</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://" disabled={mutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas / próximos pasos</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} disabled={mutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Programar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
