import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { EmployeeCombobox } from '@/components/shared/EmployeeCombobox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Edit, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Activity {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  completion_date: string | null;
  progress_percentage: number;
  comments: string | null;
}

export const PersonnelActivities = () => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [editData, setEditData] = useState({
    status: '',
    priority: '',
    progress_percentage: 0,
    start_date: null as Date | null,
    due_date: null as Date | null,
    completion_date: null as Date | null,
    comments: '',
  });

  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['employee-activities'],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('employee_activities')
          .select(`
            *,
            employee:users!employee_id (full_name, position)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          // If the table is missing in the target DB, provide a helpful message.
          const msg = (error.message || '').toString();
          if (msg.includes("Could not find the table 'public.employee_activities' in the schema cache")) {
            toast.error("No se encontró la tabla 'employee_activities' en la base de datos. Ejecuta las migraciones o crea la tabla en Supabase.");
            console.error('Supabase schema error:', error);
            return [];
          }
          throw error;
        }

        return data || [];
      } catch (err: any) {
        console.error('Error al cargar employee_activities:', err);
        // If supabase client reports missing table in a different message/shape, still show guidance.
        const message = (err?.message || '') + '';
        if (message.includes('Could not find the table') || message.includes('employee_activities')) {
          toast.error("No se encontró la tabla 'employee_activities' en la base de datos. Ejecuta las migraciones o crea la tabla en Supabase.");
          return [];
        }
        throw err;
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof editData }) => {
      const payload = {
        ...data,
        start_date: data.start_date ? format(data.start_date, 'yyyy-MM-dd') : null,
        due_date: data.due_date ? format(data.due_date, 'yyyy-MM-dd') : null,
        completion_date: data.completion_date ? format(data.completion_date, 'yyyy-MM-dd') : null,
      };
      const { error } = await (supabase as any).from('employee_activities').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-activities'] });
      toast.success('Actividad actualizada exitosamente');
      setEditDialogOpen(false);
    },
    onError: () => {
      toast.error('Error al actualizar la actividad');
    },
  });

  const openDetailDialog = (activity: Activity) => {
    setSelectedActivity(activity);
    setDetailDialogOpen(true);
  };

  const openEditDialog = (activity: Activity) => {
    setSelectedActivity(activity);
    setEditData({
      status: activity.status,
      priority: activity.priority,
      progress_percentage: activity.progress_percentage || 0,
      start_date: activity.start_date ? new Date(activity.start_date) : null,
      due_date: activity.due_date ? new Date(activity.due_date) : null,
      completion_date: activity.completion_date ? new Date(activity.completion_date) : null,
      comments: activity.comments || '',
    });
    setEditDialogOpen(true);
  };

  // New activity modal state
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newData, setNewData] = useState({
    title: '',
    description: '',
    profile_id: '', // profiles.id selected from EmployeeCombobox
    start_date: null as Date | null,
    due_date: null as Date | null,
    status: 'pendiente',
    priority: 'normal',
    progress_percentage: 0,
    comments: '',
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      // Resolve profile -> user_id (employee_id)
      let employee_id = null;
      if (payload.profile_id) {
        const { data: profile, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('user_id')
          .eq('id', payload.profile_id)
          .maybeSingle();
        if (profileError) {
          throw profileError;
        }
        employee_id = profile?.user_id || null;
      }

      // employee_id is required by employee_activities (NOT NULL). Guardar si no existe informa al usuario.
      if (!employee_id) {
        throw new Error('El empleado seleccionado no tiene asignado un usuario (profiles.user_id). Actualiza el perfil o selecciona otro empleado.');
      }

      const insertPayload: any = {
        employee_id,
        title: payload.title,
        description: payload.description || null,
        start_date: payload.start_date ? format(payload.start_date, 'yyyy-MM-dd') : null,
        due_date: payload.due_date ? format(payload.due_date, 'yyyy-MM-dd') : null,
        status: payload.status,
        priority: payload.priority,
        progress_percentage: payload.progress_percentage || 0,
        comments: payload.comments || null,
      };

      const { error } = await (supabase as any).from('employee_activities').insert(insertPayload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-activities'] });
      toast.success('Actividad creada exitosamente');
      setNewDialogOpen(false);
      setNewData({ title: '', description: '', profile_id: '', start_date: null, due_date: null, status: 'pendiente', priority: 'normal', progress_percentage: 0, comments: '' });
    },
    onError: (err: any) => {
      console.error('Error createMutation:', err);
      const message = err?.message || err?.error || 'Error al crear la actividad';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('employee_activities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-activities'] });
      toast.success('Actividad eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar la actividad');
    },
  });

  const handleUpdate = () => {
    if (selectedActivity) {
      updateMutation.mutate({ id: selectedActivity.id, data: editData });
    }
  };

  const statusLabels: Record<string, string> = {
    pendiente: 'Pendiente',
    en_progreso: 'En Progreso',
    completado: 'Completado',
    cancelado: 'Cancelado',
  };

  const priorityLabels: Record<string, string> = {
    baja: 'Baja',
    normal: 'Normal',
    alta: 'Alta',
    urgente: 'Urgente',
  };

  const columns = [
    {
      header: 'No.',
      accessorKey: 'no',
      cell: (_: any, row: Activity) => activities.findIndex(a => a.id === row.id) + 1,
    },
    {
      header: 'Título',
      accessorKey: 'title',
    },
    {
      header: 'Empleado',
      accessorKey: 'employee',
      cell: (value: any) => value?.full_name || 'Sin asignar',
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: (value: string) => {
        const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
          pendiente: 'outline',
          en_progreso: 'default',
          completado: 'default',
          cancelado: 'destructive',
        };
        return (
          <Badge variant={variants[value] || 'outline'}>
            {statusLabels[value] || value}
          </Badge>
        );
      },
    },
    {
      header: 'Prioridad',
      accessorKey: 'priority',
      cell: (value: string) => {
        const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
          baja: 'secondary',
          normal: 'outline',
          alta: 'default',
          urgente: 'destructive',
        };
        return (
          <Badge variant={variants[value] || 'outline'}>
            {priorityLabels[value] || value}
          </Badge>
        );
      },
    },
    {
      header: 'Fecha Vencimiento',
      accessorKey: 'due_date',
      cell: (value: string | null) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: es }) : '-',
    },
    {
      header: 'Progreso',
      accessorKey: 'progress_percentage',
      cell: (value: number) => `${value || 0}%`,
    },
  ];

  const actions = (activity: Activity) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(activity)}>
        <FileText className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(activity)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={async () => {
        const ok = confirm('¿Eliminar esta actividad? Esta acción no se puede deshacer.');
        if (!ok) return;
        await deleteMutation.mutateAsync(activity.id);
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 0V4a2 2 0 012-2h0a2 2 0 012 2v2"/></svg>
      </Button>
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Actividades</h1>
          <p className="text-muted-foreground mt-2">Gestión y seguimiento de actividades asignadas a empleados</p>
        </div>
        <div>
          <Button onClick={() => setNewDialogOpen(true)}>Nueva actividad</Button>
        </div>
      </div>

      <DataTable columns={columns} data={activities} actions={actions} searchable />

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Actividad</DialogTitle>
            <DialogDescription>
              Información completa de la actividad seleccionada
            </DialogDescription>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <p className="text-lg font-medium">{selectedActivity.title}</p>
              </div>
              <div>
                <Label>Descripción</Label>
                <p className="text-sm">{selectedActivity.description || 'Sin descripción'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estado</Label>
                  <div className="mt-1">
                    <Badge variant={selectedActivity.status === 'completado' ? 'default' : 'outline'}>
                      {statusLabels[selectedActivity.status]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Prioridad</Label>
                  <div className="mt-1">
                    <Badge variant={selectedActivity.priority === 'urgente' ? 'destructive' : 'outline'}>
                      {priorityLabels[selectedActivity.priority]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Progreso</Label>
                  <p className="text-lg font-semibold">{selectedActivity.progress_percentage || 0}%</p>
                </div>
                <div>
                  <Label>Fecha Inicio</Label>
                  <p>{selectedActivity.start_date ? format(new Date(selectedActivity.start_date), 'dd/MM/yyyy', { locale: es }) : '-'}</p>
                </div>
                <div>
                  <Label>Fecha Vencimiento</Label>
                  <p>{selectedActivity.due_date ? format(new Date(selectedActivity.due_date), 'dd/MM/yyyy', { locale: es }) : '-'}</p>
                </div>
                <div>
                  <Label>Fecha Completado</Label>
                  <p>{selectedActivity.completion_date ? format(new Date(selectedActivity.completion_date), 'dd/MM/yyyy', { locale: es }) : '-'}</p>
                </div>
              </div>
              {selectedActivity.comments && (
                <div>
                  <Label>Comentarios</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedActivity.comments}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Activity Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Actividad</DialogTitle>
            <DialogDescription>Rellena los datos para crear una nueva actividad</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={newData.title} onChange={(e) => setNewData({ ...newData, title: e.target.value })} placeholder="Título de la actividad" />
            </div>
            <div>
              <Label>Encargado</Label>
              <EmployeeCombobox value={newData.profile_id} onSelect={(val) => setNewData({ ...newData, profile_id: val })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={newData.description} onChange={(e) => setNewData({ ...newData, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newData.start_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newData.start_date ? format(newData.start_date, 'dd/MM/yy', { locale: es }) : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={newData.start_date || undefined} onSelect={(date) => setNewData({ ...newData, start_date: date || null })} className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Fecha Vencimiento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newData.due_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newData.due_date ? format(newData.due_date, 'dd/MM/yy', { locale: es }) : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={newData.due_date || undefined} onSelect={(date) => setNewData({ ...newData, due_date: date || null })} className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estado</Label>
                <Select value={newData.status} onValueChange={(v) => setNewData({ ...newData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_progreso">En Progreso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridad</Label>
                <Select value={newData.priority} onValueChange={(v) => setNewData({ ...newData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Comentarios</Label>
              <Textarea value={newData.comments} onChange={(e) => setNewData({ ...newData, comments: e.target.value })} rows={3} />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate(newData)}>Crear actividad</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Actividad</DialogTitle>
            <DialogDescription>
              Actualiza el estado y progreso de la actividad
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estado</Label>
                <Select value={editData.status} onValueChange={(value) => setEditData({ ...editData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_progreso">En Progreso</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridad</Label>
                <Select value={editData.priority} onValueChange={(value) => setEditData({ ...editData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Progreso (%)</Label>
              <Select 
                value={editData.progress_percentage.toString()} 
                onValueChange={(value) => setEditData({ ...editData, progress_percentage: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => (
                    <SelectItem key={val} value={val.toString()}>{val}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Fecha Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editData.start_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editData.start_date ? format(editData.start_date, 'dd/MM/yy', { locale: es }) : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={editData.start_date || undefined} onSelect={(date) => setEditData({ ...editData, start_date: date || null })} className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Fecha Vencimiento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editData.due_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editData.due_date ? format(editData.due_date, 'dd/MM/yy', { locale: es }) : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={editData.due_date || undefined} onSelect={(date) => setEditData({ ...editData, due_date: date || null })} className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Fecha Completado</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editData.completion_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editData.completion_date ? format(editData.completion_date, 'dd/MM/yy', { locale: es }) : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={editData.completion_date || undefined} onSelect={(date) => setEditData({ ...editData, completion_date: date || null })} className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label>Comentarios</Label>
              <Textarea
                value={editData.comments}
                onChange={(e) => setEditData({ ...editData, comments: e.target.value })}
                rows={4}
                placeholder="Añade comentarios sobre el progreso..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

