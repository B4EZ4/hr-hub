import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileUploader } from '@/components/shared/FileUploader';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const terminationSchema = z.object({
  employee_id: z.string().min(1, 'Seleccione un empleado'),
  fecha_despido: z.string().min(1, 'La fecha es obligatoria'),
  tipo_despido: z.enum(['voluntario', 'involuntario', 'mutuo_acuerdo', 'termino_contrato']),
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres'),
  estado: z.enum(['pendiente', 'en_proceso', 'completado', 'cancelado']),
  indemnizacion: z.string().optional(),
  liquidacion_final: z.string().optional(),
  observaciones: z.string().optional(),
});

type TerminationFormData = z.infer<typeof terminationSchema>;

export default function TerminationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const form = useForm<TerminationFormData>({
    resolver: zodResolver(terminationSchema),
    defaultValues: {
      employee_id: '',
      fecha_despido: new Date().toISOString().split('T')[0],
      tipo_despido: 'voluntario',
      motivo: '',
      estado: 'pendiente',
      indemnizacion: '',
      liquidacion_final: '',
      observaciones: '',
    },
  });

  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;
    const employeeId = form.getValues('employee_id') || termination?.employee_id;
    if (!employeeId) {
      toast.error('Selecciona primero un empleado para asociar el documento.');
      return;
    }

    try {
      setUploading(true);
      const bucketName = 'documents';
      const prefix = 'despidos';
      const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storagePath = `${prefix}/${employeeId}/${safeFileName}`;

      const { data, error } = await supabase.storage.from(bucketName).upload(storagePath, file);
      if (error) throw error;

      const storedPath = (data as any)?.path ?? storagePath;
      setUploadedPaths((prev) => [...prev, storedPath]);
      toast.success('Archivo subido correctamente');
    } catch (err: any) {
      console.error('Error uploading termination file', err);
      toast.error(err?.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  // Cargar empleados
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('status', 'activo')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  // Cargar datos si es edición
  const { data: termination, isLoading } = useQuery({
    queryKey: ['termination', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('despidos')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (termination) {
      form.reset({
        employee_id: termination.employee_id,
        fecha_despido: termination.fecha_despido,
        tipo_despido: termination.tipo_despido as 'voluntario' | 'involuntario' | 'mutuo_acuerdo' | 'termino_contrato',
        motivo: termination.motivo,
        estado: termination.estado as 'pendiente' | 'en_proceso' | 'completado' | 'cancelado',
        indemnizacion: termination.indemnizacion?.toString() || '',
        liquidacion_final: termination.liquidacion_final?.toString() || '',
        observaciones: termination.observaciones || '',
      });
    }
  }, [termination, form]);

  const mutation = useMutation({
    mutationFn: async (data: TerminationFormData) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      const payload = {
        employee_id: data.employee_id,
        fecha_despido: data.fecha_despido,
        tipo_despido: data.tipo_despido,
        motivo: data.motivo,
        estado: data.estado,
        indemnizacion: data.indemnizacion ? parseFloat(data.indemnizacion) : null,
        liquidacion_final: data.liquidacion_final ? parseFloat(data.liquidacion_final) : null,
        observaciones: data.observaciones || null,
        created_by: userId,
      };

      if (isEdit) {
        // Registrar auditoría
        await supabase.from('despido_audit').insert({
          despido_id: id,
          action: 'UPDATE',
          user_id: userId,
          old_values: termination,
          new_values: payload,
        });

        const { error } = await supabase
          .from('despidos')
          .update(payload)
          .eq('id', id);
        if (error) throw error;

        // Si hay archivos subidos en la UI, insertarlos en despido_documentos
        if (uploadedPaths.length > 0) {
          try {
            const docs = uploadedPaths.map((p) => ({
              despido_id: id,
              tipo_documento: 'general',
              nombre_archivo: p.split('/').pop(),
              file_path: p,
              uploaded_by: userId,
            }));
            const { error: docsError } = await supabase.from('despido_documentos').insert(docs);
            if (docsError) {
              // Compensación: eliminar archivos subidos si falla la inserción
              await supabase.storage.from('documents').remove(uploadedPaths);
              throw docsError;
            }
          } catch (e) {
            throw e;
          }
        }
      } else {
        const { data: newTermination, error } = await supabase
          .from('despidos')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;

        // Registrar auditoría
        await supabase.from('despido_audit').insert({
          despido_id: newTermination.id,
          action: 'CREATE',
          user_id: userId,
          new_values: payload,
        });

        // Si hay archivos subidos en la UI antes de crear, insertarlos apuntando al nuevo despido
        if (uploadedPaths.length > 0) {
          try {
            const docs = uploadedPaths.map((p) => ({
              despido_id: newTermination.id,
              tipo_documento: 'general',
              nombre_archivo: p.split('/').pop(),
              file_path: p,
              uploaded_by: userId,
            }));
            const { error: docsError } = await supabase.from('despido_documentos').insert(docs);
            if (docsError) {
              // Compensación: eliminar archivos subidos si falla la inserción
              await supabase.storage.from('documents').remove(uploadedPaths);
              throw docsError;
            }
          } catch (e) {
            throw e;
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminations'] });
      toast.success(isEdit ? 'Despido actualizado correctamente' : 'Despido creado correctamente');
      navigate('/despidos');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar el despido');
    },
  });

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Editar Despido' : 'Nuevo Despido'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Despido</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empleado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un empleado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees?.map((emp) => (
                            <SelectItem key={emp.user_id} value={emp.user_id}>
                              {emp.full_name} ({emp.email})
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
                  name="fecha_despido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Despido *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_despido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Despido *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="voluntario">Voluntario</SelectItem>
                          <SelectItem value="involuntario">Involuntario</SelectItem>
                          <SelectItem value="mutuo_acuerdo">Mutuo Acuerdo</SelectItem>
                          <SelectItem value="termino_contrato">Término de Contrato</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
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
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_proceso">En Proceso</SelectItem>
                          <SelectItem value="completado">Completado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="indemnizacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Indemnización (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ej: 50000.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="liquidacion_final"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Liquidación Final (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ej: 75000.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo del Despido *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describa detalladamente el motivo del despido..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones adicionales..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <label className="text-sm font-medium mb-2 block">Documentos</label>
                <FileUploader
                  bucket={'despidos'}
                  accept={'image/*,.pdf'}
                  maxSize={10}
                  onFileSelected={handleFileSelected}
                  onUploadError={(err) => toast.error(`Error: ${err}`)}
                />

                {uploadedPaths.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedPaths.map((p, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        ✓ Archivo {i + 1}: {p.split('/').pop()}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEdit ? 'Actualizar Despido' : 'Crear Despido'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/despidos')}
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
