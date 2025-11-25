import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  risk_level: z.enum(['bajo', 'medio', 'alto', 'muy_alto']),
  responsible_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function SectorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { data: sector } = useQuery({
    queryKey: ['sh-sector', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from('sh_sectors')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('user_id, full_name')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      risk_level: 'medio',
      responsible_id: '',
    },
  });

  useEffect(() => {
    if (sector) {
      form.reset({
        name: sector.name,
        description: sector.description || '',
        risk_level: sector.risk_level,
        responsible_id: sector.responsible_id || '',
      });
    }
  }, [sector, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        const { error } = await (supabase as any)
          .from('sh_sectors')
          .update(data)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('sh_sectors')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sh-sectors'] });
      toast.success(isEditing ? 'Sector actualizado' : 'Sector creado');
      navigate('/seguridad-higiene/sectores');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar el sector');
    },
  });

  const onSubmit = (data: FormData) => {
    const cleanData = {
      ...data,
      responsible_id: data.responsible_id || null,
      description: data.description || null,
    };
    mutation.mutate(cleanData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/sectores')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? 'Editar Sector' : 'Nuevo Sector'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Sector</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Sector</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Planta de Producción" {...field} />
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
                      <Textarea rows={4} placeholder="Descripción del sector..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="risk_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel de Riesgo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover">
                          <SelectItem value="bajo">Bajo</SelectItem>
                          <SelectItem value="medio">Medio</SelectItem>
                          <SelectItem value="alto">Alto</SelectItem>
                          <SelectItem value="muy_alto">Muy Alto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsible_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsable (Opcional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                        value={field.value || "none"}
                        disabled={isLoadingUsers}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingUsers ? "Cargando..." : "Sin asignar"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover">
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {Array.isArray(users) && users.filter((u: any) => u?.user_id && u?.full_name).map((user: any) => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {user.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/seguridad-higiene/sectores')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
