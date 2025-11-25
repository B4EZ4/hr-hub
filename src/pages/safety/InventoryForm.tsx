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
import { ArrowLeft, Save, Package } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, 'El nombre es requerido (mínimo 3 caracteres)').max(100),
  category: z.enum(['epp', 'herramienta', 'equipo', 'limpieza', 'otro']),
  description: z.string().optional(),
  stock_quantity: z.string().min(1, 'La cantidad inicial es requerida'),
  min_stock: z.string().min(1, 'El stock mínimo es requerido'),
  unit_price: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['disponible', 'asignado', 'mantenimiento', 'baja']),
});

type FormData = z.infer<typeof formSchema>;

export default function InventoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { data: item } = useQuery({
    queryKey: ['inventory-item', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: 'epp',
      description: '',
      stock_quantity: '0',
      min_stock: '0',
      unit_price: '',
      location: '',
      status: 'disponible',
    },
  });

  useEffect(() => {
    if (item) {
      const validCategory = ['epp', 'herramienta', 'equipo', 'limpieza', 'otro'].includes(item.category) 
        ? item.category 
        : 'otro';
      const validStatus = ['disponible', 'asignado', 'mantenimiento', 'baja'].includes(item.status)
        ? item.status
        : 'disponible';

      form.reset({
        name: item.name,
        category: validCategory as 'epp' | 'herramienta' | 'equipo' | 'limpieza' | 'otro',
        description: item.description || '',
        stock_quantity: item.stock_quantity?.toString() || '0',
        min_stock: item.min_stock?.toString() || '0',
        unit_price: item.unit_price?.toString() || '',
        location: item.location || '',
        status: validStatus as 'disponible' | 'asignado' | 'mantenimiento' | 'baja',
      });
    }
  }, [item, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name.trim(),
        category: data.category,
        description: data.description?.trim() || null,
        stock_quantity: parseInt(data.stock_quantity) || 0,
        min_stock: parseInt(data.min_stock) || 0,
        unit_price: data.unit_price ? parseFloat(data.unit_price) : null,
        location: data.location?.trim() || null,
        status: data.status,
      };

      if (isEditing) {
        const { error } = await (supabase as any)
          .from('inventory_items')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('inventory_items')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success(isEditing ? 'Ítem actualizado correctamente' : 'Ítem agregado al inventario');
      navigate('/seguridad-higiene/inventario');
    },
    onError: (error: any) => {
      toast.error(error.message || `Error al ${isEditing ? 'actualizar' : 'agregar'} ítem`);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const categories = [
    { value: 'epp', label: 'EPP (Equipo de Protección Personal)' },
    { value: 'herramienta', label: 'Herramienta' },
    { value: 'equipo', label: 'Equipo' },
    { value: 'limpieza', label: 'Limpieza' },
    { value: 'otro', label: 'Otro' },
  ];

  const statuses = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'asignado', label: 'Asignado' },
    { value: 'mantenimiento', label: 'En Mantenimiento' },
    { value: 'baja', label: 'Dado de Baja' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/inventario')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            {isEditing ? 'Editar Ítem' : 'Agregar Ítem al Inventario'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Actualiza la información del ítem' : 'Registra un nuevo ítem en el inventario de S&H'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Ítem</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Ítem</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Casco de Seguridad, Guantes, Extintor, etc." {...field} />
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
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
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
                      <Textarea rows={3} placeholder="Descripción detallada del ítem..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="stock_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad Inicial</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="1" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="min_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Mínimo</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="1" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Unitario (opcional)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Almacén A, Sector 3, Depósito Central, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/seguridad-higiene/inventario')}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {mutation.isPending ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Agregar Ítem')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
