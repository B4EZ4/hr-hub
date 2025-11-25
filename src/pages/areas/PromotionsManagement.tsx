import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/DataTable';
import { Plus, Pencil, Search, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { useRoles } from '@/hooks/useRoles';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Promotion {
  id: string;
  employee_id: string;
  current_position: string;
  target_position: string;
  status: string;
  proposed_date: string | null;
  justification: string | null;
}

export const PromotionsManagement = () => {
  const [searchId, setSearchId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  
  const [formData, setFormData] = useState({
    employee_id: '',
    current_position: '',
    target_position: '',
    current_area_id: '',
    target_area_id: '',
    proposed_date: null as Date | null,
    justification: '',
    status: 'propuesta',
  });

  const queryClient = useQueryClient();
  const { canManageUsers } = useRoles();

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, position, department')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  const { data: areas = [] } = useQuery({
    queryKey: ['areas-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('id, name')
        .eq('status', 'activo')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ['promotions', searchId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchId) {
        query = query.eq('id', searchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        proposed_date: data.proposed_date ? format(data.proposed_date, 'yyyy-MM-dd') : null,
      };
      const { error } = await (supabase as any).from('promotions').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promoción creada exitosamente');
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Error al crear la promoción');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const payload = {
        ...data,
        proposed_date: data.proposed_date ? format(data.proposed_date, 'yyyy-MM-dd') : null,
      };
      const { error } = await (supabase as any).from('promotions').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promoción actualizada exitosamente');
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Error al actualizar la promoción');
    },
  });

  const resetForm = () => {
    setFormData({
      employee_id: '',
      current_position: '',
      target_position: '',
      current_area_id: '',
      target_area_id: '',
      proposed_date: null,
      justification: '',
      status: 'propuesta',
    });
    setEditingPromotion(null);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      employee_id: promotion.employee_id,
      current_position: promotion.current_position,
      target_position: promotion.target_position,
      current_area_id: '',
      target_area_id: '',
      proposed_date: promotion.proposed_date ? new Date(promotion.proposed_date) : null,
      justification: promotion.justification || '',
      status: promotion.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    if (!formData.employee_id || !formData.target_position) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo números
    setSearchId(value);
  };

  const statusLabels: Record<string, string> = {
    propuesta: 'Propuesta',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    aplicada: 'Aplicada',
  };

  const columns = [
    { 
      header: 'Empleado', 
      accessorKey: 'employee_id' as keyof Promotion,
      cell: (value: string) => {
        const emp = employees.find(e => e.user_id === value);
        return emp?.full_name || 'Empleado no encontrado';
      }
    },
    { header: 'Posición Actual', accessorKey: 'current_position' as keyof Promotion },
    { header: 'Posición Objetivo', accessorKey: 'target_position' as keyof Promotion },
    { 
      header: 'Estado', 
      accessorKey: 'status' as keyof Promotion,
      cell: (value: string) => (
        <Badge variant={value === 'aprobada' ? 'default' : value === 'rechazada' ? 'destructive' : 'outline'}>
          {statusLabels[value] || value}
        </Badge>
      ),
    },
    { 
      header: 'Fecha Propuesta', 
      accessorKey: 'proposed_date' as keyof Promotion,
      cell: (value: string | null) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: es }) : 'Sin fecha',
    },
  ];

  const actions = canManageUsers ? (promotion: Promotion) => (
    <Button variant="ghost" size="icon" onClick={() => handleEdit(promotion)}>
      <Pencil className="h-4 w-4" />
    </Button>
  ) : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promociones</h1>
          <p className="text-muted-foreground mt-2">Gestión de ascensos y promociones de personal</p>
        </div>
        {canManageUsers && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Promoción
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}</DialogTitle>
                <DialogDescription>
                  {editingPromotion ? 'Modifica los datos de la promoción' : 'Completa los datos para crear una nueva promoción'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="employee_id">Empleado *</Label>
                  <Select 
                    value={formData.employee_id} 
                    onValueChange={(value) => {
                      const emp = employees.find(e => e.user_id === value);
                      setFormData({ 
                        ...formData, 
                        employee_id: value,
                        current_position: emp?.position || ''
                      });
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.user_id} value={emp.user_id}>
                          {emp.full_name} - {emp.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="current_position">Posición Actual *</Label>
                    <Input
                      id="current_position"
                      value={formData.current_position}
                      onChange={(e) => setFormData({ ...formData, current_position: e.target.value })}
                      required
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="target_position">Nuevo Puesto *</Label>
                    <Input
                      id="target_position"
                      value={formData.target_position}
                      onChange={(e) => setFormData({ ...formData, target_position: e.target.value })}
                      placeholder="Ej: Gerente de Ventas"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="current_area_id">Área Actual</Label>
                    <Select value={formData.current_area_id} onValueChange={(value) => setFormData({ ...formData, current_area_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona área" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="target_area_id">Área Destino</Label>
                    <Select value={formData.target_area_id} onValueChange={(value) => setFormData({ ...formData, target_area_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona área" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Fecha Propuesta</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.proposed_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.proposed_date ? format(formData.proposed_date, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.proposed_date || undefined}
                        onSelect={(date) => setFormData({ ...formData, proposed_date: date || null })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="justification">Motivo/Justificación *</Label>
                  <Textarea
                    id="justification"
                    value={formData.justification}
                    onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                    rows={4}
                    placeholder="Describe los motivos de esta promoción..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="propuesta">Propuesta</SelectItem>
                      <SelectItem value="aprobada">Aprobada</SelectItem>
                      <SelectItem value="rechazada">Rechazada</SelectItem>
                      <SelectItem value="aplicada">Aplicada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingPromotion ? 'Actualizar' : 'Crear Promoción'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Búsqueda por ID */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID (solo números)..."
          value={searchId}
          onChange={handleSearchChange}
          className="pl-10"
        />
        {searchId && promotions.length === 0 && (
          <p className="text-sm text-destructive mt-2">No se encontró promoción con ese ID</p>
        )}
      </div>

      <DataTable columns={columns} data={promotions} actions={actions} />
    </div>
  );
};
