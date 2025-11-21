import { useEffect } from 'react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

const updateSchema = z.object({
  status: z.enum(['programada', 'en_progreso', 'completada', 'cancelada']),
  decision: z.enum(['pendiente', 'aprobado', 'rechazado', 'otra']),
  feedback_summary: z.string().max(2000).optional().or(z.literal('')),
  next_steps: z.string().max(2000).optional().or(z.literal('')),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

type UpdateInterviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview: Tables<'recruitment_interviews'> | null;
  onUpdated?: () => void;
};

const sanitize = (value?: string | null) => (value && value.trim() ? value.trim() : null);
const STATUS_OPTIONS: UpdateFormValues['status'][] = ['programada', 'en_progreso', 'completada', 'cancelada'];
const DECISION_OPTIONS: UpdateFormValues['decision'][] = ['pendiente', 'aprobado', 'rechazado', 'otra'];
const normalizeStatus = (value?: string | null): UpdateFormValues['status'] =>
  STATUS_OPTIONS.includes(value as UpdateFormValues['status']) ? (value as UpdateFormValues['status']) : 'programada';
const normalizeDecision = (value?: string | null): UpdateFormValues['decision'] =>
  DECISION_OPTIONS.includes(value as UpdateFormValues['decision']) ? (value as UpdateFormValues['decision']) : 'pendiente';

export function UpdateInterviewDialog({ open, onOpenChange, interview, onUpdated }: UpdateInterviewDialogProps) {
  const queryClient = useQueryClient();
  const requiresCompletionConfirmation = (values: UpdateFormValues) =>
    values.status === 'completada' && ['aprobado', 'rechazado', 'otra'].includes(values.decision);

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      status: normalizeStatus(interview?.status),
      decision: normalizeDecision(interview?.decision),
      feedback_summary: interview?.feedback_summary || '',
      next_steps: interview?.next_steps || '',
    },
  });

  useEffect(() => {
    if (interview && open) {
      form.reset({
        status: normalizeStatus(interview.status),
        decision: normalizeDecision(interview.decision),
        feedback_summary: interview.feedback_summary || '',
        next_steps: interview.next_steps || '',
      });
    }
  }, [interview, open, form]);

  const mutation = useMutation({
    mutationFn: async (values: UpdateFormValues) => {
      if (!interview) throw new Error('Entrevista no encontrada');

      const payload = {
        status: values.status,
        decision: values.decision,
        feedback_summary: sanitize(values.feedback_summary),
        next_steps: sanitize(values.next_steps),
      } satisfies Partial<Tables<'recruitment_interviews'>>;

      const { error } = await (supabase as any)
        .from('recruitment_interviews')
        .update(payload)
        .eq('id', interview.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Entrevista actualizada');
      queryClient.invalidateQueries({ queryKey: ['recruitment-candidate-detail'] });
      onUpdated?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'No se pudo actualizar la entrevista');
    },
  });

  const handleSubmit = (values: UpdateFormValues) => {
    if (requiresCompletionConfirmation(values)) {
      const confirmed = window.confirm('¿Confirmas que la entrevista se completó con ese resultado?');
      if (!confirmed) return;
    }
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Actualizar entrevista</DialogTitle>
          <DialogDescription>Define el resultado y comentarios finales.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={mutation.isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="programada">Programada</SelectItem>
                        <SelectItem value="en_progreso">En progreso</SelectItem>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="decision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resultado</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={mutation.isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="aprobado">Aprobado</SelectItem>
                        <SelectItem value="rechazado">Rechazado</SelectItem>
                        <SelectItem value="otra">Requiere otra entrevista</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="feedback_summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentarios</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} disabled={mutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="next_steps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Próximos pasos</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} disabled={mutation.isPending} />
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
                Guardar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
