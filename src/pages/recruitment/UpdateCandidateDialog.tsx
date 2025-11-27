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
    full_name: z.string().min(3, 'Ingresa el nombre completo'),
    email: z.string().email('Email inválido'),
    phone: optionalText,
    source: optionalText,
    seniority: optionalText,
    current_location: optionalText,
    status: z.enum(['nuevo', 'en_proceso', 'oferta', 'contratado', 'rechazado', 'archivado']),
});

export type CandidateFormValues = z.infer<typeof candidateSchema>;

type RecruitmentCandidate = Tables<'recruitment_candidates'>;

type UpdateCandidateDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidate: RecruitmentCandidate;
    onUpdated?: () => void;
};

const sanitize = (value?: string | null) => (value && value.trim() !== '' ? value.trim() : null);

export function UpdateCandidateDialog({ open, onOpenChange, candidate, onUpdated }: UpdateCandidateDialogProps) {
    const queryClient = useQueryClient();

    const form = useForm<CandidateFormValues>({
        resolver: zodResolver(candidateSchema),
        defaultValues: {
            full_name: '',
            email: '',
            phone: '',
            source: '',
            seniority: '',
            current_location: '',
            status: 'nuevo',
        },
    });

    useEffect(() => {
        if (open && candidate) {
            form.reset({
                full_name: candidate.full_name,
                email: candidate.email,
                phone: candidate.phone || '',
                source: candidate.source || '',
                seniority: candidate.seniority || '',
                current_location: candidate.current_location || '',
                status: (candidate.status as any) || 'nuevo',
            });
        }
    }, [open, candidate, form]);

    const mutation = useMutation({
        mutationFn: async (values: CandidateFormValues) => {
            const payload = {
                full_name: values.full_name.trim(),
                email: values.email.trim().toLowerCase(),
                phone: sanitize(values.phone),
                source: sanitize(values.source),
                seniority: sanitize(values.seniority),
                current_location: sanitize(values.current_location),
                status: values.status,
            };

            // Check for duplicate full_name
            const { data: existingCandidate } = await (supabase as any)
                .from('recruitment_candidates')
                .select('id')
                .eq('full_name', payload.full_name)
                .neq('id', candidate.id) // Exclude current candidate
                .maybeSingle();

            if (existingCandidate) {
                throw new Error('Ya existe otro candidato con este nombre.');
            }

            const { error } = await (supabase as any)
                .from('recruitment_candidates')
                .update(payload)
                .eq('id', candidate.id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Candidato actualizado correctamente');
            queryClient.invalidateQueries({ queryKey: ['recruitment-candidates'] });
            queryClient.invalidateQueries({ queryKey: ['recruitment-candidate-detail', candidate.id] });
            onOpenChange(false);
            onUpdated?.();
        },
        onError: (error: any) => {
            toast.error(error?.message || 'No se pudo actualizar el candidato');
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Editar candidato</DialogTitle>
                    <DialogDescription>Modifica los datos básicos del candidato.</DialogDescription>
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
                                            <Input {...field} disabled={mutation.isPending} />
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
                        </div>

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

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar cambios
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
