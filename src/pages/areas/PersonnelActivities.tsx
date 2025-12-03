import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRoles } from '@/hooks/useRoles';

interface Activity {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string | null;
  due_date: string | null;
  assigned_by: string | null;
  profiles?: { full_name: string };
}

export const PersonnelActivities = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    employee_id: '',
    start_date: '',
    due_date: '',
    status: 'Planeación',
  });

  const queryClient = useQueryClient();
  const { canManageUsers } = useRoles();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['employee-activities'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('employee_activities')
        .select(`
          *,
          profiles!employee_activities_employee_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingActivity) {
        const { error } = await (supabase as any)
          .from('employee_activities')
          .update(data)
          .eq('id', editingActivity.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('employee_activities').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-activities'] });
      toast.success(editingActivity ? 'Actividad actualizada exitosamente' : 'Actividad creada exitosamente');
      setDialogOpen(false);
      resetForm();
      setEditingActivity(null);
    },
    onError: () => {
      toast.error(editingActivity ? 'Error al actualizar la actividad' : 'Error al crear la actividad');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('employee_activities')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-activities'] });
      toast.success('Actividad eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la actividad');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      employee_id: '',
      start_date: '',
      due_date: '',
      status: 'Planeación',
    });
    setEditingActivity(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const openEditDialog = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      employee_id: activity.employee_id,
      start_date: activity.start_date || '',
      due_date: activity.due_date || '',
      status: activity.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = (activity: Activity) => {
    if (window.confirm(`¿Estás seguro de eliminar la actividad "${activity.title}"?`)) {
      deleteMutation.mutate(activity.id);
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      'Planeación': 'outline',
      'Convocatoria': 'outline',
      'Ejecución': 'default',
      'Evaluación': 'secondary',
      'Cierre': 'secondary',
      'Completada': 'default',
      'En Proceso': 'default',
    };
    return variants[status] || 'outline';
  };

  const columns = [
    {
      header: 'NOMBRE DE LA TAREA',
      accessorKey: 'title' as keyof Activity,
    },
    {
      header: 'ENCARGADO',
      accessorKey: 'profiles' as keyof Activity,
      cell: (value: any) => value?.full_name || 'Sin asignar',
    },
    {
      header: 'FECHA INICIO',
      accessorKey: 'start_date' as keyof Activity,
      cell: (value: string | null) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: es }) : '-',
    },
    {
      header: 'FECHA FIN',
      accessorKey: 'due_date' as keyof Activity,
      cell: (value: string | null) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: es }) : '-',
    },
    {
      header: 'ESTADO',
      accessorKey: 'status' as keyof Activity,
      cell: (value: string) => (
        <Badge variant={getStatusVariant(value)}>
          {value}
        </Badge>
      ),
    },
  ];

  const actions = (activity: Activity) => (
    <div className="flex gap-2">
      {canManageUsers && (
        <>
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(activity)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(activity)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Actividades</h1>
          <p className="text-muted-foreground mt-2">
            Gestión y seguimiento de actividades asignadas a empleados
          </p>
        </div>
        {canManageUsers && (
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Actividad
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={activities} actions={actions} />

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}</DialogTitle>
            <DialogDescription>
              Complete los datos de la actividad
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Nombre de la Tarea:</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Revisión de protocolos"
                required
              />
            </div>
            <div>
              <Label htmlFor="employee_id">Encargado:</Label>
              <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona encargado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>{employee.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start_date">Fecha Inicio:</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="due_date">Fecha Fin:</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Estado:</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planeación">Planeación</SelectItem>
                  <SelectItem value="Convocatoria">Convocatoria</SelectItem>
                  <SelectItem value="Ejecución">Ejecución</SelectItem>
                  <SelectItem value="Evaluación">Evaluación</SelectItem>
                  <SelectItem value="Cierre">Cierre</SelectItem>
                  <SelectItem value="Completada">Completada</SelectItem>
                  <SelectItem value="En Proceso">En Proceso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit">{editingActivity ? 'Guardar Cambios' : 'Crear Actividad'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};


