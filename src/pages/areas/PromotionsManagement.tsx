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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Promotion {
  id: string;
  employee_id: string;
  current_position: string;
  target_position: string;
  current_area_id: string | null;
  target_area_id: string | null;
  status: string;
  proposed_date: string | null;
  justification: string | null;
}

export const PromotionsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
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

  const sanitizeTargetPosition = (value: string) => {
    const lettersOnly = value.replace(/[^\p{L}\s]/gu, '');
    const withoutLeadingSpaces = lettersOnly.replace(/^\s+/, '');
    if (!withoutLeadingSpaces) return '';
    return withoutLeadingSpaces.charAt(0).toUpperCase() + withoutLeadingSpaces.slice(1);
  };

  const formatJustificationInput = (value: string) => {
    const withoutNumbers = value.replace(/[0-9]/g, '');
    const withoutLeadingSpaces = withoutNumbers.replace(/^\s+/, '');
    if (!withoutLeadingSpaces) return '';
    return withoutLeadingSpaces.charAt(0).toUpperCase() + withoutLeadingSpaces.slice(1);
  };

  const sanitizeSearchInput = (value: string) => {
    return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
  };

  type EmployeeOption = {
    user_id: string;
    full_name: string;
    position: string | null;
    department: string | null;
    area_id: string | null;
    area_name: string | null;
  };

  type AreaOption = {
    id: string;
    name: string;
  };

  const { data: employees = [] as EmployeeOption[] } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, position, department, area_id, areas(name)')
        .order('full_name');
      if (error) throw error;
      return (data || []).map((item) => ({
        user_id: item.user_id,
        full_name: item.full_name,
        position: item.position,
        department: item.department,
        area_id: item.area_id,
        area_name: (item as { areas?: { name?: string | null } }).areas?.name ?? null,
      })) as EmployeeOption[];
    },
  });

  const { data: areas = [] as AreaOption[] } = useQuery({
    queryKey: ['areas-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('id, name')
        .eq('status', 'activo')
        .order('name');
      if (error) throw error;
      return (data || []) as AreaOption[];
    },
  });

  const { data: promotions = [], isLoading, error } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        const notFoundCodes = ['PGRST116', '42P01'];
        if (notFoundCodes.includes(error.code)) {
          console.warn('Tabla de promociones no disponible:', error.message);
          return [];
        }
        throw error;
      }
      return data || [];
    },
    retry: (failureCount, retryError) => {
      const code = (retryError as { code?: string } | undefined)?.code;
      if (code && ['PGRST116', '42P01'].includes(code)) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const resolveAreaNameForEmployee = (areaId: string | null, employeeId: string) => {
    if (areaId) {
      const targetArea = areas.find((area) => area.id === areaId)?.name;
      if (targetArea) {
        return targetArea;
      }
    }
    const employee = employees.find((emp) => emp.user_id === employeeId);
    return employee?.area_name || employee?.department || null;
  };

  const updateEmployeeRecords = async (params: {
    employeeId: string;
    targetPosition: string;
    targetAreaId: string | null;
  }) => {
    const { employeeId, targetPosition, targetAreaId } = params;
    const trimmedPosition = targetPosition?.trim();
    const areaName = resolveAreaNameForEmployee(targetAreaId, employeeId);

    const profileUpdate: Record<string, string | null> = {};
    if (trimmedPosition) profileUpdate.position = trimmedPosition;
    if (targetAreaId !== undefined) profileUpdate.area_id = targetAreaId;
    if (areaName) profileUpdate.department = areaName;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update(profileUpdate)
        .eq('user_id', employeeId);
      if (profileError) throw profileError;
    }

    const userUpdate: Record<string, string | null> = {};
    if (trimmedPosition) userUpdate.position = trimmedPosition;
    if (targetAreaId !== undefined) userUpdate.area_id = targetAreaId;

    if (Object.keys(userUpdate).length > 0) {
      const { error: userError } = await (supabase as any)
        .from('users')
        .update(userUpdate)
        .eq('id', employeeId);
      if (userError) throw userError;
    }

    await queryClient.invalidateQueries({ queryKey: ['employees-list'] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        proposed_date: data.proposed_date ? format(data.proposed_date, 'yyyy-MM-dd') : null,
        current_area_id: data.current_area_id || null,
        target_area_id: data.target_area_id || null,
      };
      const { error } = await (supabase as any).from('promotions').insert(payload);
      if (error) throw error;
      if (payload.status === 'aprobada') {
        await updateEmployeeRecords({
          employeeId: payload.employee_id,
          targetPosition: payload.target_position,
          targetAreaId: payload.target_area_id,
        });
      }
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
    mutationFn: async ({ id, data, previousStatus }: { id: string; data: typeof formData; previousStatus: string }) => {
      const payload = {
        ...data,
        proposed_date: data.proposed_date ? format(data.proposed_date, 'yyyy-MM-dd') : null,
        current_area_id: data.current_area_id || null,
        target_area_id: data.target_area_id || null,
      };
      const { error } = await (supabase as any).from('promotions').update(payload).eq('id', id);
      if (error) throw error;
      if (payload.status === 'aprobada' && previousStatus !== 'aprobada') {
        await updateEmployeeRecords({
          employeeId: payload.employee_id,
          targetPosition: payload.target_position,
          targetAreaId: payload.target_area_id,
        });
      }
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
      target_position: sanitizeTargetPosition(promotion.target_position || ''),
      current_area_id: promotion.current_area_id || '',
      target_area_id: promotion.target_area_id || '',
      proposed_date: promotion.proposed_date ? new Date(promotion.proposed_date) : null,
      justification: promotion.justification ? formatJustificationInput(promotion.justification) : '',
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
      updateMutation.mutate({ id: editingPromotion.id, data: formData, previousStatus: editingPromotion.status });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleStatusChange = (value: string) => {
    if (value === 'aprobada' && formData.status !== 'aprobada') {
      const confirmed = window.confirm('Una vez aprobada la promoción no podrás editarla. ¿Deseas continuar?');
      if (!confirmed) {
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      status: value,
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(sanitizeSearchInput(e.target.value));
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
    <Button
      variant="ghost"
      size="icon"
      disabled={promotion.status === 'aprobada'}
      onClick={() => {
        if (promotion.status === 'aprobada') return;
        handleEdit(promotion);
      }}
      title={promotion.status === 'aprobada' ? 'Las promociones aprobadas no se pueden editar' : 'Editar promoción'}
    >
      <Pencil className="h-4 w-4" />
    </Button>
  ) : undefined;

  const selectedEmployee = employees.find((emp) => emp.user_id === formData.employee_id);

  const areaFromList = formData.current_area_id
    ? areas.find((area) => area.id === formData.current_area_id)?.name ?? null
    : null;

  const fallbackArea = selectedEmployee?.area_name || selectedEmployee?.department || null;

  const currentAreaName = formData.current_area_id
    ? areaFromList || fallbackArea || 'Área no disponible'
    : fallbackArea || 'Sin área asignada';

  const filteredPromotions = promotions.filter((promotion) => {
    if (!searchTerm) return true;
    const employee = employees.find((emp) => emp.user_id === promotion.employee_id);
    return employee?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
                      setFormData((prev) => ({
                        ...prev,
                        employee_id: value,
                        current_position: emp?.position || '',
                        current_area_id: emp?.area_id || '',
                        target_area_id: emp?.area_id || '',
                      }));
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
                      required
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="target_position">Nuevo Puesto *</Label>
                    <Input
                      id="target_position"
                      value={formData.target_position}
                      onChange={(e) => {
                        const sanitizedPosition = sanitizeTargetPosition(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          target_position: sanitizedPosition,
                        }));
                      }}
                      placeholder="Ej: Gerente de Ventas"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="current_area_id">Área Actual</Label>
                    <Input
                      id="current_area_id"
                      value={currentAreaName}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="target_area_id">Área Destino</Label>
                    <Select
                      value={formData.target_area_id}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          target_area_id: value,
                        }))
                      }
                    >
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
                    onChange={(e) => {
                      const formattedJustification = formatJustificationInput(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        justification: formattedJustification,
                      }));
                    }}
                    rows={4}
                    placeholder="Describe los motivos de esta promoción..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select value={formData.status} onValueChange={handleStatusChange}>
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

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar promociones</AlertTitle>
          <AlertDescription>
            {((error as { message?: string }).message) || 'No se pudieron cargar los datos. Intenta nuevamente más tarde.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Búsqueda por nombre */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-10"
        />
        {searchTerm && filteredPromotions.length === 0 && (
          <p className="text-sm text-destructive mt-2">No se encontraron promociones para ese nombre</p>
        )}
      </div>

      <DataTable columns={columns} data={filteredPromotions} actions={actions} />
    </div>
  );
};
