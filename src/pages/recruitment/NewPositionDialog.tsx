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
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

const optionalText = z
  .string()
  .max(255, 'Máximo 255 caracteres')
  .optional()
  .or(z.literal(''));

const optionalTime = z
  .string()
  .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, 'Usa formato HH:MM')
  .optional()
  .or(z.literal(''));

const positionSchema = z
  .object({
    title: z.string().min(3, 'Ingresa un título descriptivo'),
    department: optionalText,
    location: optionalText,
    seniority: optionalText,
    status: z.enum(['abierta', 'en_proceso', 'pausada', 'cerrada']).default('abierta'),
    description: z
      .string()
      .max(5000, 'Máximo 5000 caracteres')
      .optional()
      .or(z.literal('')),
    work_start_time: optionalTime,
    work_end_time: optionalTime,
  })
  .refine(
    (data) =>
      (data.work_start_time === '' && data.work_end_time === '') ||
      (Boolean(data.work_start_time) && Boolean(data.work_end_time)),
    {
      message: 'Debes completar ambos horarios',
      path: ['work_end_time'],
    }
  )
  .refine(
    (data) => !data.work_end_time || Boolean(data.work_start_time),
    {
      message: 'Define la hora de entrada',
      path: ['work_start_time'],
    }
  );

export type PositionFormValues = z.infer<typeof positionSchema>;

interface NewPositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (position: Tables<'recruitment_positions'>) => void;
  position?: Tables<'recruitment_positions'> | null;
}

const sanitize = (value?: string | null) => (value && value.trim() !== '' ? value.trim() : null);
const sanitizeTime = (value?: string | null) => (value && value.trim() !== '' ? value : null);

export function NewPositionDialog({ open, onOpenChange, onCreated, position }: NewPositionDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      title: '',
      department: '',
      location: '',
      seniority: '',
      status: 'abierta',
      description: '',
      work_start_time: '',
      work_end_time: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    } else if (position) {
      form.reset({
        title: position.title,
        department: position.department || '',
        location: position.location || '',
        seniority: position.seniority || '',
        status: (position.status as PositionFormValues['status']) || 'abierta',
        description: position.description || '',
        work_start_time: position.work_start_time?.slice(0, 5) || '',
        work_end_time: position.work_end_time?.slice(0, 5) || '',
      });
    }
  }, [open, form, position]);

  const mutation = useMutation({
    mutationFn: async (values: PositionFormValues) => {
      const payload = {
        title: values.title.trim(),
        department: sanitize(values.department),
        location: sanitize(values.location),
        seniority: sanitize(values.seniority),
        status: values.status,
        description: sanitize(values.description),
        created_by: user?.id ?? null,
        work_start_time: sanitizeTime(values.work_start_time),
        work_end_time: sanitizeTime(values.work_end_time),
      } satisfies Partial<Tables<'recruitment_positions'>>;

      const query = (supabase as any)
        .from('recruitment_positions');

      const { data, error } = position
        ? await query.update(payload).eq('id', position.id).select('*').single()
        : await query.insert(payload).select('*').single();

      if (error) throw error;
      return data as Tables<'recruitment_positions'>;
    },
    onSuccess: (savedPosition) => {
      toast.success(position ? 'Posición actualizada' : 'Posición creada correctamente');
      queryClient.invalidateQueries({ queryKey: ['recruitment-positions'] });
      queryClient.invalidateQueries({ queryKey: ['recruitment-positions', 'open-list'] });
      onOpenChange(false);
      onCreated?.(savedPosition);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'No se pudo crear la posición');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva posición</DialogTitle>
          <DialogDescription>Define los datos básicos de la vacante.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={mutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={mutation.isPending} />
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
                      <Input {...field} disabled={mutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="work_start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de entrada</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" disabled={mutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="work_end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de salida</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" disabled={mutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="seniority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel / Experiencia</FormLabel>
                    <Select disabled={mutation.isPending} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona nivel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sin experiencia">Sin experiencia</SelectItem>
                        <SelectItem value="Junior">Junior / Inicial</SelectItem>
                        <SelectItem value="Semi Senior">Semi Senior / Intermedio</SelectItem>
                        <SelectItem value="Senior">Senior / Avanzado</SelectItem>
                        <SelectItem value="Lead">Lead / Experto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select disabled={mutation.isPending} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="abierta">Abierta</SelectItem>
                        <SelectItem value="en_proceso">En proceso</SelectItem>
                        <SelectItem value="pausada">En pausa</SelectItem>
                        <SelectItem value="cerrada">Cerrada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} disabled={mutation.isPending} />
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
                Guardar posición
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
