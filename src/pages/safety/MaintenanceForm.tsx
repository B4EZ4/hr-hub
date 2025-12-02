import { useEffect, useState } from 'react';
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
import { ArrowLeft, Save, Wrench, Plus, Trash2, Play, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MaintenanceActionDialog } from '@/components/maintenance/MaintenanceActionDialog';

const supplyUsedSchema = z.object({
  supply_id: z.string().min(1, 'Seleccione un insumo'),
  supply_name: z.string(),
  quantity_used: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
});

const formSchema = z.object({
  item_id: z.string().min(1, 'Selecciona un ítem'),
  maintenance_type: z.string().min(1, 'Selecciona el tipo'),
  scheduled_date: z.string().optional(),
  start_date: z.string().optional(),
  estimated_duration: z.number().min(1, 'La duración estimada es requerida').default(1),
  location: z.string().min(1, 'La ubicación es requerida'),
  description: z.string().min(10, 'Describe el trabajo a realizar (mínimo 10 caracteres)'),
  work_performed: z.string().optional(),
  pending_work: z.string().optional(),
  supplies_used: z.array(supplyUsedSchema).optional(),
  observations: z.string().optional(),
  cost: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function MaintenanceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!id;
  const [suppliesUsed, setSuppliesUsed] = useState<Array<{ supply_id: string; supply_name: string; quantity_used: number }>>([]);
  const [maintenanceStatus, setMaintenanceStatus] = useState<string>('pendiente');
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'complete' | 'cancel' | null;
  }>({ open: false, type: null });

  const { data: maintenance } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from('inventory_maintenance')
        .select(`
          *,
          item:item_id (id, name, category, location)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inventory_items')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: supplies = [] } = useQuery({
    queryKey: ['inventory-supplies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, category, stock_quantity')
        .in('category', ['limpieza', 'herramienta', 'otro'])
        .gt('stock_quantity', 0)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      item_id: '',
      maintenance_type: 'preventivo',
      scheduled_date: new Date().toISOString().split('T')[0],
      start_date: new Date().toISOString().split('T')[0],
      estimated_duration: 1,
      location: '',
      description: '',
      work_performed: '',
      pending_work: '',
      supplies_used: [],
      observations: '',
      cost: '',
    },
  });

  useEffect(() => {
    if (maintenance) {
      form.reset({
        item_id: maintenance.item_id,
        maintenance_type: maintenance.maintenance_type,
        scheduled_date: maintenance.scheduled_date || '',
        start_date: maintenance.start_date?.split('T')[0] || '',
        estimated_duration: maintenance.estimated_duration || 1,
        location: maintenance.item?.location || '',
        description: maintenance.description || '',
        work_performed: '',
        pending_work: '',
        supplies_used: [],
        observations: maintenance.observations || '',
        cost: maintenance.cost?.toString() || '',
      });
      setMaintenanceStatus(maintenance.status);
    }
  }, [maintenance, form]);

  // Función para iniciar mantenimiento
  const startMaintenanceMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from('inventory_maintenance')
        .update({
          status: 'en_proceso',
          start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
      setMaintenanceStatus('en_proceso');
      toast.success('Mantenimiento iniciado');
    },
    onError: (error: any) => {
      toast.error('Error al iniciar mantenimiento: ' + error.message);
    },
  });

  // Función para completar mantenimiento - VERSIÓN CORREGIDA
  const completeMaintenanceMutation = useMutation({
    mutationFn: async (notes: string) => {
      // Obtener el mantenimiento actual para calcular duración
      const { data: currentMaintenance } = await (supabase as any)
        .from('inventory_maintenance')
        .select('start_date')
        .eq('id', id)
        .single();

      const actualDuration = currentMaintenance?.start_date
        ? Math.ceil((new Date().getTime() - new Date(currentMaintenance.start_date).getTime()) / (1000 * 60 * 60 * 24))
        : 1;

      const { error } = await (supabase as any)
        .from('inventory_maintenance')
        .update({
          status: 'completado',
          completion_notes: notes,
          end_date: new Date().toISOString(), // CORREGIDO: usar end_date en lugar de completed_date
          updated_at: new Date().toISOString(),
          actual_duration: actualDuration
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory-maintenance'] });
      setMaintenanceStatus('completado');
      toast.success('Mantenimiento completado');
      setActionDialog({ open: false, type: null });
    },
    onError: (error: any) => {
      toast.error('Error al completar mantenimiento: ' + error.message);
      setActionDialog({ open: false, type: null });
    },
  });

  // Función para cancelar mantenimiento
  const cancelMaintenanceMutation = useMutation({
    mutationFn: async (reason: string) => {
      const { error } = await (supabase as any)
        .from('inventory_maintenance')
        .update({
          status: 'cancelado',
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
          end_date: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory-maintenance'] });
      setMaintenanceStatus('cancelado');
      toast.success('Mantenimiento cancelado');
      setActionDialog({ open: false, type: null });
    },
    onError: (error: any) => {
      toast.error('Error al cancelar mantenimiento: ' + error.message);
      setActionDialog({ open: false, type: null });
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('user_id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) {
        throw new Error('No se encontró el perfil del usuario');
      }

      let fullObservations = '';

      if (data.work_performed) {
        fullObservations += `TRABAJO REALIZADO:\n${data.work_performed}\n\n`;
      }

      if (data.pending_work) {
        fullObservations += `TRABAJO PENDIENTE:\n${data.pending_work}\n\n`;
      }

      if (suppliesUsed.length > 0) {
        fullObservations += `INSUMOS UTILIZADOS:\n`;
        suppliesUsed.forEach(supply => {
          fullObservations += `- ${supply.supply_name}: ${supply.quantity_used} unidades\n`;
        });
        fullObservations += '\n';
      }

      if (data.observations) {
        fullObservations += `OBSERVACIONES ADICIONALES:\n${data.observations}`;
      }

      const payload = {
        item_id: data.item_id,
        maintenance_type: data.maintenance_type,
        scheduled_date: data.scheduled_date || null,
        start_date: data.start_date || null,
        estimated_duration: data.estimated_duration || null,
        description: `UBICACIÓN: ${data.location}\n\n${data.description}`,
        observations: fullObservations.trim() || null,
        cost: data.cost ? parseFloat(data.cost) : null,
        performed_by: profile.user_id,
        status: maintenanceStatus,
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { error } = await (supabase as any)
          .from('inventory_maintenance')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('inventory_maintenance')
          .insert(payload);
        if (error) throw error;

        if (suppliesUsed.length > 0) {
          const selectedItem = items.find((i: any) => i.id === data.item_id);
          for (const supply of suppliesUsed) {
            await supabase.from('inventory_movements').insert({
              item_id: supply.supply_id,
              movement_type: 'salida',
              quantity: supply.quantity_used,
              observations: `Usado en mantenimiento de ${selectedItem?.name || 'equipo'}`,
              created_at: new Date().toISOString(),
            });

            const { data: currentItem } = await supabase
              .from('inventory_items')
              .select('stock_quantity')
              .eq('id', supply.supply_id)
              .single();

            if (currentItem) {
              await supabase
                .from('inventory_items')
                .update({
                  stock_quantity: Math.max(0, currentItem.stock_quantity - supply.quantity_used),
                  updated_at: new Date().toISOString()
                })
                .eq('id', supply.supply_id);
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast.success(isEditing ? 'Mantenimiento actualizado' : 'Mantenimiento registrado correctamente');
      navigate('/seguridad-higiene/mantenimientos');
    },
    onError: (error: Error) => {
      toast.error(`Error al ${isEditing ? 'actualizar' : 'registrar'} mantenimiento: ` + error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const maintenanceTypes = [
    { value: 'preventivo', label: 'Preventivo' },
    { value: 'correctivo', label: 'Correctivo' },
    { value: 'calibracion', label: 'Calibración' },
    { value: 'limpieza', label: 'Limpieza' },
    { value: 'otro', label: 'Otro' },
  ];

  const addSupply = () => {
    setSuppliesUsed([...suppliesUsed, { supply_id: '', supply_name: '', quantity_used: 1 }]);
  };

  const removeSupply = (index: number) => {
    setSuppliesUsed(suppliesUsed.filter((_, i) => i !== index));
  };

  const updateSupply = (index: number, field: 'supply_id' | 'quantity_used', value: any) => {
    const updated = [...suppliesUsed];
    if (field === 'supply_id') {
      const selectedSupply = supplies.find((s: any) => s.id === value);
      if (selectedSupply) {
        updated[index].supply_id = value;
        updated[index].supply_name = selectedSupply.name;
      }
    } else {
      updated[index][field] = value;
    }
    setSuppliesUsed(updated);
  };

  // Función para obtener el color del badge según el estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente': return <Badge className="bg-yellow-500">Pendiente</Badge>;
      case 'en_proceso': return <Badge className="bg-blue-500">En Proceso</Badge>;
      case 'completado': return <Badge className="bg-green-500">Completado</Badge>;
      case 'cancelado': return <Badge variant="outline" className="text-red-500 border-red-500">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {isEditing && (
        <MaintenanceActionDialog
          open={actionDialog.open}
          onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}
          actionType={actionDialog.type!}
          onConfirm={(notes) => {
            if (actionDialog.type === 'complete') {
              completeMaintenanceMutation.mutate(notes);
            } else if (actionDialog.type === 'cancel') {
              cancelMaintenanceMutation.mutate(notes);
            }
          }}
          isLoading={
            completeMaintenanceMutation.isPending ||
            cancelMaintenanceMutation.isPending
          }
        />
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/mantenimientos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-8 w-8 text-primary" />
            {isEditing ? 'Editar Mantenimiento' : 'Registrar Mantenimiento'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Actualiza los datos del mantenimiento' : 'Programa o registra un mantenimiento de equipo'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Mantenimiento</CardTitle>
          {isEditing && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Estado actual:</span>
                {getStatusBadge(maintenanceStatus)}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="item_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ítem / Equipo Intervenido</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={maintenanceStatus === 'completado' || maintenanceStatus === 'cancelado'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un ítem" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {items.map((item: any) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - {item.category}
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
                  name="maintenance_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Mantenimiento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={maintenanceStatus === 'completado' || maintenanceStatus === 'cancelado'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {maintenanceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="scheduled_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Programada</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={maintenanceStatus === 'completado' || maintenanceStatus === 'cancelado'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Inicio</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={maintenanceStatus === 'completado' || maintenanceStatus === 'cancelado'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimated_duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración Estimada (días)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          disabled={maintenanceStatus === 'completado' || maintenanceStatus === 'cancelado'}
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
                      <FormLabel>Ubicación del Mantenimiento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Taller, Planta, Sector A, etc."
                          {...field}
                          disabled={maintenanceStatus === 'completado' || maintenanceStatus === 'cancelado'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo / Gasto Asociado (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          disabled={maintenanceStatus === 'completado' || maintenanceStatus === 'cancelado'}
                        />
                      </FormControl>
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
                    <FormLabel>Descripción del Trabajo a Realizar</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Detalla el trabajo de mantenimiento programado..."
                        {...field}
                        disabled={maintenanceStatus === 'completado' || maintenanceStatus === 'cancelado'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="work_performed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trabajo Realizado (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Detalle el trabajo que ya fue realizado..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pending_work"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trabajo Pendiente (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Detalle el trabajo que aún falta realizar..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card className="p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Insumos/Consumibles Utilizados</h3>
                    <p className="text-sm text-muted-foreground">Registra los materiales usados en el mantenimiento</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSupply}
                    disabled={maintenanceStatus === 'completado' || maintenanceStatus === 'cancelado'}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Insumo
                  </Button>
                </div>

                {suppliesUsed.length > 0 && (
                  <div className="space-y-3">
                    {suppliesUsed.map((supply, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-sm font-medium mb-1 block">Insumo</label>
                            <Select
                              value={supply.supply_id}
                              onValueChange={(value) => updateSupply(index, 'supply_id', value)}
                              disabled={maintenanceStatus === 'completado' || maintenanceStatus === 'cancelado'}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un insumo" />
                              </SelectTrigger>
                              <SelectContent>
                                {supplies.map((s: any) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name} (Stock: {s.stock_quantity})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-32">
                            <label className="text-sm font-medium mb-1 block">Cantidad</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={supply.quantity_used}
                              onChange={(e) => updateSupply(index, 'quantity_used', parseFloat(e.target.value) || 1)}
                              disabled={maintenanceStatus === 'completado' || maintenanceStatus === 'cancelado'}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSupply(index)}
                              disabled={maintenanceStatus === 'completado' || maintenanceStatus === 'cancelado'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones Adicionales</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Cualquier observación adicional relevante..."
                        {...field}
                        disabled={maintenanceStatus === 'completado' || maintenanceStatus === 'cancelado'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botones para cambiar estado si estamos editando */}
              {isEditing && (
                <div className="flex gap-2">
                  {maintenanceStatus === 'pendiente' && (
                    <Button
                      type="button"
                      onClick={() => startMaintenanceMutation.mutate()}
                      disabled={startMaintenanceMutation.isPending}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar Mantenimiento
                    </Button>
                  )}
                  {maintenanceStatus === 'en_proceso' && (
                    <Button
                      type="button"
                      onClick={() => setActionDialog({ open: true, type: 'complete' })}
                      disabled={completeMaintenanceMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Terminar Mantenimiento
                    </Button>
                  )}
                  {(maintenanceStatus === 'pendiente' || maintenanceStatus === 'en_proceso') && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setActionDialog({ open: true, type: 'cancel' })}
                      disabled={cancelMaintenanceMutation.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar Mantenimiento
                    </Button>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/seguridad-higiene/mantenimientos')}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    mutation.isPending ||
                    maintenanceStatus === 'completado' ||
                    maintenanceStatus === 'cancelado'
                  }
                >
                  <Save className="mr-2 h-4 w-4" />
                  {mutation.isPending ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Registrar Mantenimiento')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}