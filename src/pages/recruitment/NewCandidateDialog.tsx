import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

const optionalText = z
  .string()
  .max(255, 'Máximo 255 caracteres')
  .optional()
  .or(z.literal(''));

const candidateSchema = z.object({
  full_name: z
    .string()
    .min(3, 'Ingresa el nombre completo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  email: z.string().email('Email inválido').regex(/@/, 'El email debe contener @'),
  phone: z
    .string()
    .regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos')
    .optional()
    .or(z.literal('')),
  source: optionalText,
  seniority: optionalText,
  current_location: z
    .string()
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\/]*$/, 'La ubicación solo puede contener letras y espacios')
    .max(255, 'Máximo 255 caracteres')
    .optional()
    .or(z.literal('')),
  resume_url: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(2000, 'Máximo 2000 caracteres').optional().or(z.literal('')),
  status: z.enum(['nuevo', 'en_proceso', 'oferta', 'contratado', 'rechazado', 'archivado']).default('nuevo'),
  position_id: z.string().uuid().optional().nullable(),
  // Campos legales mexicanos con validaciones específicas
  rfc: z
    .string()
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, 'RFC inválido. Formato: 4 letras + 6 dígitos + 3 caracteres (ej: VECJ991130ABC)')
    .length(13, 'El RFC debe tener 13 caracteres')
    .optional()
    .or(z.literal('')),
  curp: z
    .string()
    .regex(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/, 'CURP inválido. Formato: 18 caracteres alfanuméricos (ej: VECJ991130HDFRLS09)')
    .length(18, 'El CURP debe tener 18 caracteres')
    .optional()
    .or(z.literal('')),
  nss: z
    .string()
    .regex(/^\d{11}$/, 'El NSS debe tener exactamente 11 dígitos')
    .optional()
    .or(z.literal('')),
  address: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
});

export type CandidateFormValues = z.infer<typeof candidateSchema>;

type RecruitmentCandidate = Tables<'recruitment_candidates'> & {
  recruitment_applications?: Tables<'recruitment_applications'>[];
};

type RecruitmentPosition = Tables<'recruitment_positions'>;

type NewCandidateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (candidate: RecruitmentCandidate) => void;
};

const sanitize = (value?: string | null) => (value && value.trim() !== '' ? value.trim() : null);

// Funciones para filtrar caracteres no permitidos en tiempo real
const filterNumericOnly = (value: string) => value.replace(/\D/g, '');
const filterAlphanumericUppercase = (value: string) => value.replace(/[^A-Za-zÑñ&0-9]/g, '').toUpperCase();

export function NewCandidateDialog({ open, onOpenChange, onCreated }: NewCandidateDialogProps) {
  const queryClient = useQueryClient();
  const { data: positionsData, isLoading: positionsLoading } = useQuery({
    queryKey: ['recruitment-positions', 'open-list'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('recruitment_positions')
        .select('id, title, department, location, status, work_start_time, work_end_time')
        .in('status', ['abierta', 'en_proceso']);
      if (error) throw error;
      return data as RecruitmentPosition[];
    },
    enabled: open,
  });

  const positionOptions = useMemo(() => {
    if (!positionsData?.length) return [];
    return positionsData.map((position) => {
      const schedule = position.work_start_time && position.work_end_time
        ? ` (${position.work_start_time.slice(0, 5)} - ${position.work_end_time.slice(0, 5)})`
        : '';
      return {
        id: position.id,
        label: `${position.title} · ${position.department || 'Sin depto.'}${schedule}`,
      };
    });
  }, [positionsData]);

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    mode: 'onChange', // Validar en tiempo real mientras escribe
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      source: '',
      seniority: '',
      current_location: '',
      resume_url: '',
      notes: '',
      status: 'nuevo',
      position_id: undefined,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    } else if (positionOptions.length && !form.getValues('position_id')) {
      form.setValue('position_id', positionOptions[0]?.id);
    }
  }, [open, form, positionOptions]);

  const mutation = useMutation({
    mutationFn: async (values: CandidateFormValues) => {
      // Get current user from custom auth storage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      console.log('Current user for recruiter assignment (custom auth):', user);

      if (!user?.id) {
        console.warn('No user ID found for recruiter assignment');
      }

      const payload = {
        full_name: values.full_name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: sanitize(values.phone),
        source: sanitize(values.source),
        seniority: sanitize(values.seniority),
        current_location: sanitize(values.current_location),
        resume_url: sanitize(values.resume_url),
        notes: sanitize(values.notes),
        status: values.status || 'nuevo',
        rfc: sanitize(values.rfc),
        curp: sanitize(values.curp),
        nss: sanitize(values.nss),
        address: sanitize(values.address),
        assigned_recruiter: user?.id,
      } satisfies Partial<RecruitmentCandidate> & Pick<RecruitmentCandidate, 'full_name' | 'email' | 'status'>;

      // Check for duplicate full_name
      const { data: existingCandidate } = await (supabase as any)
        .from('recruitment_candidates')
        .select('id')
        .eq('full_name', payload.full_name)
        .maybeSingle();

      if (existingCandidate) {
        throw new Error('Ya existe un candidato con este nombre.');
      }

      const { data: candidate, error } = await (supabase as any)
        .from('recruitment_candidates')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;

      if (values.position_id) {
        const { error: appError } = await (supabase as any)
          .from('recruitment_applications')
          .insert({
            candidate_id: candidate.id,
            position_id: values.position_id,
            status: 'en_revision',
            current_stage: 'screening',
          });
        if (appError) throw appError;
      }

      return candidate as RecruitmentCandidate;
    },
    onSuccess: (candidate) => {
      toast.success('Candidato creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['recruitment-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['recruitment-candidate-detail', candidate.id] });
      onOpenChange(false);
      onCreated?.(candidate);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'No se pudo crear el candidato');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nuevo candidato</DialogTitle>
          <DialogDescription>Registra datos básicos para iniciar el proceso.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={mutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled={mutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={10}
                        disabled={mutation.isPending}
                        onChange={(e) => field.onChange(filterNumericOnly(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuente</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="LinkedIn, Referencia, Bolsa..." disabled={mutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                name="current_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ciudad / País" disabled={mutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rfc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RFC</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: VECJ991130ABC"
                        maxLength={13}
                        disabled={mutation.isPending}
                        onChange={(e) => field.onChange(filterAlphanumericUppercase(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="curp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CURP</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: VECJ991130HDFRLS09"
                        maxLength={18}
                        disabled={mutation.isPending}
                        onChange={(e) => field.onChange(filterAlphanumericUppercase(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NSS (IMSS)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: 12345678901"
                        maxLength={11}
                        disabled={mutation.isPending}
                        onChange={(e) => field.onChange(filterNumericOnly(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección completa</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Calle, número, colonia, ciudad" disabled={mutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="resume_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de CV</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." disabled={mutation.isPending} />
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
                  <FormLabel>Notas internas</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} disabled={mutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado inicial</FormLabel>
                  <Select disabled={mutation.isPending} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nuevo">Nuevo</SelectItem>
                      <SelectItem value="en_proceso">En proceso</SelectItem>
                      <SelectItem value="oferta">Oferta enviada</SelectItem>
                      <SelectItem value="contratado">Contratado</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                      <SelectItem value="archivado">Archivado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vacante objetivo</FormLabel>
                  <Select
                    disabled={mutation.isPending || positionsLoading || !positionOptions.length}
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={positionsLoading ? 'Cargando vacantes...' : 'Selecciona una vacante'}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {positionOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                Guardar candidato
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
