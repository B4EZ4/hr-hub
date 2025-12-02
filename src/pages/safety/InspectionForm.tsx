import { useEffect, useState } from 'react';
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
import { FileUploader } from '@/components/shared/FileUploader';
import { ArrowLeft, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  sector_id: z.string().min(1, 'Seleccione un sector'),
  inspector_id: z.string().min(1, 'Seleccione un inspector'),
  scheduled_date: z.string().min(1, 'La fecha es requerida'),
  status: z.enum(['programada', 'en_progreso', 'completada', 'cancelada']),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function InspectionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const { data: inspection } = useQuery({
    queryKey: ['sh-inspection', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from('sh_inspections')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  const { data: sectors = [] } = useQuery({
    queryKey: ['sh-sectors'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sh_sectors')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: inspectors = [] } = useQuery({
    queryKey: ['inspectors'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('user_id, full_name')
        .eq('status', 'activo')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sector_id: '',
      inspector_id: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      status: 'programada',
      findings: '',
      recommendations: '',
    },
  });

  useEffect(() => {
    if (inspection) {
      form.reset({
        sector_id: inspection.sector_id,
        inspector_id: inspection.inspector_id,
        scheduled_date: inspection.scheduled_date,
        status: inspection.status,
        findings: inspection.findings || '',
        recommendations: inspection.recommendations || '',
      });
      setUploadedFiles(inspection.file_paths || []);
    }
  }, [inspection, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        findings: data.findings || null,
        recommendations: data.recommendations || null,
        file_paths: uploadedFiles.length > 0 ? uploadedFiles : null,
        updated_at: new Date().toISOString(),
        // Si se marca como completada, agregar fecha de completado
        completed_date: data.status === 'completada'
          ? new Date().toISOString().split('T')[0]
          : null
      };

      if (isEditing) {
        const { error } = await (supabase as any)
          .from('sh_inspections')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('sh_inspections')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sh-inspections'] });
      toast.success(isEditing ? 'Inspección actualizada' : 'Inspección programada');
      navigate('/seguridad-higiene/inspecciones');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar la inspección');
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const handleFileUpload = (path: string) => {
    setUploadedFiles([...uploadedFiles, path]);
    toast.success('Evidencia subida correctamente');
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/inspecciones')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Editar Inspección' : 'Nueva Inspección'}
          </h1>
          <p className="text-muted-foreground">Programar y gestionar inspecciones de seguridad</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Inspección</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sector_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sector *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar sector" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sectors.map((sector: any) => (
                            <SelectItem key={sector.id} value={sector.id}>
                              {sector.name}
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
                  name="inspector_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inspector *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar inspector" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {inspectors.map((inspector: any) => (
                            <SelectItem key={inspector.user_id} value={inspector.user_id}>
                              {inspector.full_name}
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
                      <FormLabel>Fecha Programada *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="programada">Programada</SelectItem>
                          <SelectItem value="en_progreso">En Progreso</SelectItem>
                          <SelectItem value="completada">Completada</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="findings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hallazgos</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describa los hallazgos de la inspección"
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recommendations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recomendaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Escriba las recomendaciones"
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Evidencias (Fotos/Documentos)</FormLabel>
                <FileUploader
                  bucket="inspections"
                  path="evidencias"
                  accept="image/*,.pdf"
                  maxSize={10 * 1024 * 1024}
                  onUploadComplete={handleFileUpload}
                  onUploadError={(error) => toast.error(error)}
                />
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Archivos subidos: {uploadedFiles.length}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((file, index) => (
                        <Badge key={index} variant="secondary" className="gap-2">
                          {file.split('/').pop()?.substring(0, 20)}...
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Guardando...' : isEditing ? 'Actualizar' : 'Programar Inspección'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/seguridad-higiene/inspecciones')}
                >
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