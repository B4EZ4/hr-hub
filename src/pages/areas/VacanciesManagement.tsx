import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/DataTable';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRoles } from '@/hooks/useRoles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Vacancy {
  id: string;
  title: string;
  description?: string | null;
  department?: string;
  location?: string;
  seniority?: string;
  status?: string;
  work_start_time?: string;
  work_end_time?: string;
  created_at?: string;
}

export const VacanciesManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);

  const [formData, setFormData] = useState<Partial<Vacancy & { department?: string }>>({
    title: '',
    department: '',
    location: '',
    seniority: '',
    status: 'abierta',
    description: '',
    work_start_time: '',
    work_end_time: '',
  });

  const queryClient = useQueryClient();
  const { canManageUsers } = useRoles();

  const { data: vacancies = [], isLoading } = useQuery({
    queryKey: ['recruitment_positions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('recruitment_positions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Vacancy[];
    },
  });

  const { data: areas = [] } = useQuery({
    queryKey: ['areas-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('areas').select('id, name').eq('status', 'activo').order('name');
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from('recruitment_positions').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment_positions'] });
      toast.success('Posición creada');
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err?.message || 'Error al crear la posición');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { id, ...rest } = payload;
      const { error } = await supabase.from('recruitment_positions').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment_positions'] });
      toast.success('Posición actualizada');
      setDialogOpen(false);
      setSelectedVacancy(null);
      resetForm();
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err?.message || 'Error al actualizar la posición');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recruitment_positions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment_positions'] });
      toast.success('Posición eliminada');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err?.message || 'Error al eliminar la posición');
    },
  });

  const resetForm = () => setFormData({ title: '', department: '', location: '', seniority: '', status: 'abierta', description: '', work_start_time: '', work_end_time: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVacancy?.id) {
      updateMutation.mutate({ ...(formData as any), id: selectedVacancy.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta posición?')) return;
    deleteMutation.mutate(id);
  };

  const openEdit = (v: Vacancy) => {
    setSelectedVacancy(v);
    setFormData({
      title: v.title,
      department: v.department || '',
      location: v.location || '',
      seniority: v.seniority || '',
      status: v.status || 'abierta',
      description: v.description || '',
      work_start_time: v.work_start_time || '',
      work_end_time: v.work_end_time || '',
    });
    setDialogOpen(true);
  };

  const openView = (v: Vacancy) => {
    setSelectedVacancy(v);
    setViewOpen(true);
  };

  const filtered = (vacancies as Vacancy[]).filter((v) => {
    const q = searchTerm.toLowerCase();
    return (
      (v.title || '').toLowerCase().includes(q) ||
      (v.department || '').toLowerCase().includes(q) ||
      (v.location || '').toLowerCase().includes(q)
    );
  });

  const columns = [
    { header: 'Título', accessorKey: 'title' as keyof Vacancy },
    { header: 'Departamento', accessorKey: 'department' as keyof Vacancy },
    { header: 'Ubicación', accessorKey: 'location' as keyof Vacancy },
    { header: 'Nivel', accessorKey: 'seniority' as keyof Vacancy },
    {
      header: 'Horario',
      accessorKey: 'work_start_time' as keyof Vacancy,
      cell: (value: any, row: Vacancy) => (value ? `${value} - ${row.work_end_time || ''}` : '-'),
    },
    {
      header: 'Estado',
      accessorKey: 'status' as keyof Vacancy,
      cell: (value: string) => <Badge variant={value === 'abierta' ? 'default' : 'secondary'}>{value}</Badge>,
    },
  ];

  const actions = (v: Vacancy) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={() => openView(v)}>Ver detalles</Button>
      {canManageUsers && (
        <>
          <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </>
      )}
    </div>
  );

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vacantes</h1>
          <p className="text-muted-foreground mt-2">Vacantes vigentes y su estado</p>
        </div>

        {canManageUsers && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setSelectedVacancy(null); }}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva vacante
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{selectedVacancy ? 'Editar posición' : 'Nueva vacante'}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="font-bold">Título *</Label>
                  <Input value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bold">Departamento</Label>
                    <Select value={formData.department || ''} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona departamento" /></SelectTrigger>
                      <SelectContent>
                        {areas.map((a: any) => (
                          <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="font-bold">Ubicación</Label>
                    <Input value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                  </div>

                  <div>
                    <Label className="font-bold">Hora inicio</Label>
                    <Input type="time" value={formData.work_start_time || ''} onChange={(e) => setFormData({ ...formData, work_start_time: e.target.value })} />
                  </div>

                  <div>
                    <Label className="font-bold">Hora fin</Label>
                    <Input type="time" value={formData.work_end_time || ''} onChange={(e) => setFormData({ ...formData, work_end_time: e.target.value })} />
                  </div>

                  <div>
                    <Label className="font-bold">Nivel</Label>
                    <Input value={formData.seniority || ''} onChange={(e) => setFormData({ ...formData, seniority: e.target.value })} />
                  </div>

                  <div>
                    <Label className="font-bold">Estado</Label>
                    <Select value={formData.status || 'abierta'} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="abierta">Abierta</SelectItem>
                        <SelectItem value="en_proceso">En proceso</SelectItem>
                        <SelectItem value="pausada">Pausada</SelectItem>
                        <SelectItem value="cerrada">Cerrada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="font-bold">Descripción</Label>
                  <Textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Guardar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas las Vacantes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por título, departamento o ubicación..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>

          <DataTable columns={columns} data={filtered as any} actions={actions} />
        </TabsContent>
      </Tabs>

      {/* View dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p><strong>Título:</strong> {selectedVacancy?.title}</p>
            <p><strong>Departamento:</strong> {selectedVacancy?.department}</p>
            <p><strong>Ubicación:</strong> {selectedVacancy?.location}</p>
            <p><strong>Nivel:</strong> {selectedVacancy?.seniority}</p>
            <p><strong>Horario:</strong> {selectedVacancy?.work_start_time ? `${selectedVacancy.work_start_time} - ${selectedVacancy.work_end_time || ''}` : '-'}</p>
            <p><strong>Estado:</strong> {selectedVacancy?.status}</p>
            <p><strong>Descripción:</strong></p>
            <div className="whitespace-pre-wrap">{selectedVacancy?.description}</div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setViewOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VacanciesManagement;