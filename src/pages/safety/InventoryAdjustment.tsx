import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

const formSchema = z.object({
  movement_type: z.enum(['entrada', 'salida', 'ajuste']),
  quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  observations: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function InventoryAdjustment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: item, isLoading } = useQuery({
    queryKey: ['inventory-item', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inventory_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      movement_type: 'entrada',
      quantity: 1,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Calculate new stock
      let newStock = item.stock_quantity || 0;
      if (data.movement_type === 'entrada') {
        newStock += data.quantity;
      } else if (data.movement_type === 'salida') {
        newStock -= data.quantity;
      } else {
        newStock = data.quantity; // ajuste sets absolute value
      }

      if (newStock < 0) {
        throw new Error('El stock no puede ser negativo');
      }

      // Update item stock
      const { error: updateError } = await (supabase as any)
        .from('inventory_items')
        .update({ stock_quantity: newStock })
        .eq('id', id);

      if (updateError) throw updateError;

      // Record movement
      const { error: movementError } = await (supabase as any)
        .from('inventory_movements')
        .insert({
          item_id: id,
          movement_type: data.movement_type,
          quantity: data.quantity,
          observations: data.observations,
          user_id: user?.id,
          authorized_by: user?.id,
        });

      if (movementError) throw movementError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-item', id] });
      toast.success('Stock ajustado correctamente');
      navigate(`/seguridad-higiene/inventario/${id}`);
    },
    onError: (error: Error) => {
      toast.error('Error al ajustar stock: ' + error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/seguridad-higiene/inventario/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ajustar Stock</h1>
          <p className="text-muted-foreground">{item?.name} - Stock actual: {item?.stock_quantity || 0}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulario de Ajuste</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="movement_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Movimiento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada (+)</SelectItem>
                        <SelectItem value="salida">Salida (-)</SelectItem>
                        <SelectItem value="ajuste">Ajuste (establecer valor)</SelectItem>
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
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Motivo del ajuste..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate(`/seguridad-higiene/inventario/${id}`)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {mutation.isPending ? 'Guardando...' : 'Guardar Ajuste'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
