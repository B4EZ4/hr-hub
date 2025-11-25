import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
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
  item_id: z.string().min(1, 'Seleccione un artículo'),
  user_id: z.string().min(1, 'Seleccione un empleado'),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser mayor a 0'),
  assigned_date: z.string().min(1, 'La fecha es requerida'),
  return_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function InventoryAssignment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['inventory-items-available'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inventory_items')
        .select('id, name, stock_quantity, category')
        .eq('status', 'disponible')
        .gt('stock_quantity', 0)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('user_id, full_name, department')
        .eq('status', 'activo')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      item_id: '',
      user_id: '',
      quantity: 1,
      assigned_date: new Date().toISOString().split('T')[0],
      return_date: '',
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Verificar que el user_id existe en profiles
      const { data: profileCheck } = await (supabase as any)
        .from('profiles')
        .select('user_id')
        .eq('user_id', data.user_id)
        .single();

      if (!profileCheck) {
        throw new Error('El empleado seleccionado no tiene un perfil válido');
      }

      const payload = {
        item_id: data.item_id,
        user_id: data.user_id,
        quantity: data.quantity,
        assigned_date: data.assigned_date,
        return_date: data.return_date || null,
        notes: data.notes?.trim() || null,
        status: 'asignado',
      };

      const { error } = await (supabase as any)
        .from('inventory_assignments')
        .insert(payload);

      if (error) {
        console.error('Error al insertar asignación:', error);
        throw new Error(`Error al crear asignación: ${error.message}`);
      }

      // Update stock quantity
      const item = items.find((i: any) => i.id === data.item_id);
      if (item) {
        const newStock = Math.max(0, item.stock_quantity - data.quantity);
        const { error: updateError } = await (supabase as any)
          .from('inventory_items')
          .update({ stock_quantity: newStock })
          .eq('id', data.item_id);

        if (updateError) {
          console.error('Error al actualizar stock:', updateError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items-available'] });
      toast.success('Asignación creada correctamente');
      navigate('/seguridad-higiene/inventario');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear la asignación');
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/inventario')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asignar EPP/Equipo</h1>
          <p className="text-muted-foreground">Asignar artículos de inventario a empleados</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de Asignación</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="item_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Artículo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un artículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {items.map((item: any) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - Stock: {item.stock_quantity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empleado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un empleado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user: any) => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {user.full_name} {user.department && `- ${user.department}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assigned_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Asignación</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="return_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Devolución (opcional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Notas adicionales..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/inventario')}>
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
