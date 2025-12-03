import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/DataTable';
import { Plus, Pencil, Trash2, Search, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRoles } from '@/hooks/useRoles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Vacancy {
  id: string;
  title: string;
  description: string | null;
  status: string;
  department: string | null;
  location: string | null;
  work_start_time: string | null;
  work_end_time: string | null;
  seniority: string | null;
  created_at: string;
}

export const VacanciesManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'abierta',
    department: '',
    location: '',
    work_start_time: '08:00',
    work_end_time: '16:00',
    seniority: 'junior',
  });

  const [applicationData, setApplicationData] = useState({
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    cover_letter: '',
  });

  const queryClient = useQueryClient();
  const { canManageUsers } = useRoles();

  const { data: vacancies = [], isLoading } = useQuery({
    queryKey: ['recruitment-positions-vacancies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recruitment_positions')
        .select('*')
        .order('created_at', { ascending: false });
      
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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('recruitment_positions').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-positions-vacancies'] });
      toast.success('Vacante creada exitosamente');
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Error al crear la vacante');
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (data: { vacancy_id: string } & typeof applicationData) => {
      const { error } = await supabase.from('vacancy_applications').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Postulación enviada exitosamente');
      setApplyDialogOpen(false);
      setApplicationData({
        applicant_name: '',
        applicant_email: '',
        applicant_phone: '',
        cover_letter: '',
      });
    },
    onError: () => {
      toast.error('Error al enviar la postulación');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'abierta',
      department: '',
      location: '',
      work_start_time: '08:00',
      work_end_time: '16:00',
      seniority: 'junior',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVacancy) {
      applyMutation.mutate({
        vacancy_id: selectedVacancy.id,
        ...applicationData,
      });
    }
  };

  const openApplyDialog = (vacancy: Vacancy) => {
    setSelectedVacancy(vacancy);
    setApplyDialogOpen(true);
  };

  const filteredVacancies = vacancies.filter((vacancy) =>
    vacancy.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const importantVacancies = filteredVacancies.filter(v => v.status === 'abierta');

  const statusLabels: Record<string, string> = {
    abierta: 'Abierta',
    en_proceso: 'En Proceso',
    pausada: 'Pausada',
    cerrada: 'Cerrada',
  };

  const columns = [
    { header: 'Posición', accessorKey: 'title' as keyof Vacancy },
    { 
      header: 'Estado', 
      accessorKey: 'status' as keyof Vacancy,
      cell: (value: string) => (
        <Badge variant={value === 'abierta' ? 'default' : 'secondary'}>
          {statusLabels[value]}
        </Badge>
      ),
    },
    { 
      header: 'Prioridad', 
      accessorKey: 'seniority' as keyof Vacancy,
      cell: (value: string) => value ? (
        <Badge variant="outline">
          {value}
        </Badge>
      ) : null,
    },
  ];

  const actions = (vacancy: Vacancy) => (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => openApplyDialog(vacancy)}>
        <Send className="mr-2 h-4 w-4" />
        Postular
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vacantes</h1>
          <p className="text-muted-foreground mt-2">Gestión de posiciones disponibles</p>
        </div>
        {canManageUsers && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Vacante
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva vacante</DialogTitle>
                <DialogDescription>
                  Define los datos básicos de la vacante.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Desarrollador Junior"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Departamento</Label>
                    <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.name}>{area.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Morelos"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="work_start_time">Hora de entrada</Label>
                    <Input
                      id="work_start_time"
                      type="time"
                      value={formData.work_start_time}
                      onChange={(e) => setFormData({ ...formData, work_start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="work_end_time">Hora de salida</Label>
                    <Input
                      id="work_end_time"
                      type="time"
                      value={formData.work_end_time}
                      onChange={(e) => setFormData({ ...formData, work_end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seniority">Nivel / Experiencia</Label>
                    <Select value={formData.seniority} onValueChange={(value) => setFormData({ ...formData, seniority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="junior">Junior / Inicial</SelectItem>
                        <SelectItem value="semi-senior">Semi Senior</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="experto">Experto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="abierta">Abierta</SelectItem>
                        <SelectItem value="en_proceso">En Proceso</SelectItem>
                        <SelectItem value="pausada">Pausada</SelectItem>
                        <SelectItem value="cerrada">Cerrada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Desarrollador Junior"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Crear Vacante</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas las Vacantes</TabsTrigger>
          <TabsTrigger value="important">Vacantes Importantes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por posición..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <DataTable columns={columns} data={filteredVacancies} actions={actions} />
        </TabsContent>

        <TabsContent value="important">
          <div className="grid gap-4 md:grid-cols-2">
            {importantVacancies.map((vacancy) => (
              <Card key={vacancy.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{vacancy.title}</CardTitle>
                    <Badge variant="default">Abierta</Badge>
                  </div>
                  <CardDescription>{vacancy.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => openApplyDialog(vacancy)} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Postular Ahora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Postular a: {selectedVacancy?.title}</DialogTitle>
            <DialogDescription>
              Completa tus datos para enviar tu postulación
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <Label htmlFor="applicant_name">Nombre Completo *</Label>
              <Input
                id="applicant_name"
                value={applicationData.applicant_name}
                onChange={(e) => setApplicationData({ ...applicationData, applicant_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="applicant_email">Correo Electrónico *</Label>
              <Input
                id="applicant_email"
                type="email"
                value={applicationData.applicant_email}
                onChange={(e) => setApplicationData({ ...applicationData, applicant_email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="applicant_phone">Teléfono</Label>
              <Input
                id="applicant_phone"
                value={applicationData.applicant_phone}
                onChange={(e) => setApplicationData({ ...applicationData, applicant_phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="cover_letter">Carta de Presentación</Label>
              <Textarea
                id="cover_letter"
                value={applicationData.cover_letter}
                onChange={(e) => setApplicationData({ ...applicationData, cover_letter: e.target.value })}
                rows={4}
                placeholder="Cuéntanos por qué eres el candidato ideal..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setApplyDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Enviar Postulación</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
