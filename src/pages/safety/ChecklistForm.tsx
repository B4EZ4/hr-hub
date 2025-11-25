import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-with-auth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const checklistItemSchema = z.object({
  question: z.string().min(3, 'La pregunta es requerida'),
  type: z.enum(['yes_no', 'text', 'numeric', 'select']),
  required: z.boolean(),
  options: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(3, 'El nombre es requerido').max(100),
  description: z.string().optional(),
  category: z.enum(['inspeccion', 'auditoria', 'epp', 'capacitacion', 'otro']),
  is_active: z.boolean(),
  items: z.array(checklistItemSchema).min(1, 'Debe agregar al menos un item'),
});

type FormData = z.infer<typeof formSchema>;

export default function ChecklistForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { data: checklist } = useQuery({
    queryKey: ['checklist', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from('sh_checklists')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'inspeccion',
      is_active: true,
      items: [{ question: '', type: 'yes_no', required: true, options: '' }],
    },
  });

  useEffect(() => {
    if (checklist) {
      form.reset({
        name: checklist.name,
        description: checklist.description || '',
        category: checklist.category,
        is_active: checklist.is_active,
        items: checklist.items.map((item: any) => ({
          ...item,
          options: item.options ? item.options.join(', ') : '',
        })),
      });
    }
  }, [checklist, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        category: data.category,
        is_active: data.is_active,
        items: data.items.map(item => ({
          ...item,
          options: item.options ? item.options.split(',').map(o => o.trim()) : null,
        })),
      };

      if (isEditing) {
        const { error } = await (supabase as any)
          .from('sh_checklists')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('sh_checklists')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast.success(isEditing ? 'Checklist actualizado' : 'Checklist creado correctamente');
      navigate('/seguridad-higiene/checklists');
    },
    onError: (error: any) => {
      toast.error(error.message || `Error al ${isEditing ? 'actualizar' : 'crear'} checklist`);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/checklists')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? 'Editar Checklist' : 'Nuevo Checklist'}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Checklist</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Inspección de EPP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Descripción del checklist..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="inspeccion">Inspección</SelectItem>
                          <SelectItem value="auditoria">Auditoría</SelectItem>
                          <SelectItem value="epp">EPP</SelectItem>
                          <SelectItem value="capacitacion">Capacitación</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Activo</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          El checklist estará disponible para usar
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items del Checklist</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ question: '', type: 'yes_no', required: true, options: '' })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`items.${index}.question`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pregunta</FormLabel>
                          <FormControl>
                            <Input placeholder="¿El EPP está en buen estado?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Respuesta</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="yes_no">Sí / No</SelectItem>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="numeric">Numérico</SelectItem>
                                <SelectItem value="select">Selección</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.required`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <FormLabel>Requerido</FormLabel>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch(`items.${index}.type`) === 'select' && (
                      <FormField
                        control={form.control}
                        name={`items.${index}.options`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opciones (separadas por comas)</FormLabel>
                            <FormControl>
                              <Input placeholder="Bueno, Regular, Malo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Guardar Checklist'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/seguridad-higiene/checklists')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
