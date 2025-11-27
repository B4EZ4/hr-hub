import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-with-auth';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { FileUploader } from '@/components/shared/FileUploader';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

type Employee = {
  user_id: string;
  full_name: string;
  email: string;
};

const formSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  description: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  category: z.enum(['contrato', 'identificacion', 'certificado', 'nomina', 'otro']),
  employee_id: z.string().min(1, 'Selecciona un empleado'),
  is_public: z.boolean(),
  tags: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function DocumentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const isEditing = !!id;
  const uploaderPath = 'general';

  // Cargar lista de empleados
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      // Obtener empleados a partir de contratos activos
      const { data: contracts, error: contractsErr } = await supabase
        .from('contracts')
        .select('user_id')
        .eq('status', 'activo');
      if (contractsErr) throw contractsErr;

      const contractsData = (contracts || []) as { user_id?: string }[];
      const userIds = contractsData.map((c) => c.user_id).filter(Boolean) as string[];

      if (userIds.length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds)
          .eq('status', 'activo')
          .order('full_name');
        if (error) throw error;
        return data || [];
      }

      // Fallback: si no hay contracts activos (entorno vacío), usar candidates contratados
      const { data: candidates, error: candErr } = await supabase
        .from('recruitment_candidates')
        .select('email')
        .eq('status', 'contratado');
      if (candErr) throw candErr;

      const emails = (candidates || []).map((c: { email?: string }) => c.email).filter(Boolean) as string[];
      if (emails.length === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('email', emails)
        .eq('status', 'activo')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: document, isLoading: loadingDocument } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'otro',
      employee_id: '',
      is_public: false,
      tags: '',
    },
  });

  useEffect(() => {
    if (document) {
      form.reset({
        title: document.title,
        description: document.description || '',
        category: (document.category as FormData['category']) || 'otro',
        employee_id: document.employee_id || '',
        is_public: document.is_public,
        tags: document.tags?.join(', ') || '',
      });
      setUploadedFile(document.file_path);
      setSelectedFileObj(null);
    }
  }, [document, form]);

  // When editing, ensure the employee select is set to the document's employee
  useEffect(() => {
    if (!document) return;
    if (!employees || employees.length === 0) return;

    // Determine employee id from possible shapes: string id, relation object, or nested
    const docTyped = document as unknown as {
      employee?: { user_id?: string } | null;
      employee_id?: string | { user_id?: string; id?: string } | null;
    };

    const empIdFromDoc =
      typeof document.employee_id === 'string' && document.employee_id
        ? (document.employee_id as string)
        : docTyped.employee?.user_id || (typeof docTyped.employee_id === 'object' ? (docTyped.employee_id?.user_id || docTyped.employee_id?.id) : null);

    if (empIdFromDoc) {
      // Only set if the current value is empty or different
      const current = form.getValues('employee_id');
      if (!current || current !== empIdFromDoc) {
        form.setValue('employee_id', empIdFromDoc);
      }
    }
  }, [document, employees, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!uploadedFile && !selectedFileObj && !isEditing) {
        throw new Error('Debe seleccionar un archivo');
      }

      // Asegurar que el usuario esté autenticado antes de intentar insertar
      if (!user || !user.id) {
        throw new Error('Usuario no autenticado. Inicia sesión antes de subir documentos.');
      }

      const tags = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : null;

      // Tipos explícitos para cumplir con las firmas de Supabase
      type DocumentInsert = {
        title: string;
        description?: string | null;
        category: FormData['category'];
        employee_id: string;
        is_public: boolean;
        tags?: string[] | null;
        file_path: string;
        version?: number;
        uploaded_by: string;
        estado: 'pendiente' | 'validado' | 'rechazado';
      };

      type DocumentUpdate = Partial<Omit<DocumentInsert, 'uploaded_by' | 'estado' | 'file_path'>> &
        Partial<Pick<DocumentInsert, 'file_path' | 'version'>> & { descripcion?: string | null };

      const tagsArray = tags ?? null;

      if (isEditing) {
        const updatePayload: DocumentUpdate = {
          title: data.title,
          description: data.description || null,
          category: data.category,
          employee_id: data.employee_id,
          is_public: data.is_public,
          tags: tagsArray,
        };

        // If user selected a new file while editing, upload it and set new file_path
        if (selectedFileObj) {
          setUploadInProgress(true);
          try {
            const fileExt = selectedFileObj.name.split('.').pop();
            const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
            const filePath = uploaderPath ? `${uploaderPath}/${fileName}` : fileName;
            const { error: uploadErr } = await supabase.storage.from('documents').upload(filePath, selectedFileObj, { cacheControl: '3600', upsert: false });
            if (uploadErr) throw uploadErr;
            updatePayload.file_path = filePath;
            updatePayload.version = (document?.version || 1) + 1;
            // set uploadedFile for consistency
            setUploadedFile(filePath);
          } finally {
            setUploadInProgress(false);
          }
        } else if (uploadedFile && uploadedFile !== document?.file_path) {
          updatePayload.file_path = uploadedFile;
          updatePayload.version = (document?.version || 1) + 1;
        }

        const { error } = await supabase.from('documents').update(updatePayload).eq('id', id);
        if (error) throw error;
      } else {
        // Flujo crítico: Storage -> BD con compensación
        // Upload selected file first
        let filePathToUse = uploadedFile;
        if (selectedFileObj) {
          setUploadInProgress(true);
          try {
            const fileExt = selectedFileObj.name.split('.').pop();
            const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
            const filePath = uploaderPath ? `${uploaderPath}/${fileName}` : fileName;
            const { error: uploadErr } = await supabase.storage.from('documents').upload(filePath, selectedFileObj, { cacheControl: '3600', upsert: false });
            if (uploadErr) throw uploadErr;
            filePathToUse = filePath;
            setUploadedFile(filePath);
          } finally {
            setUploadInProgress(false);
          }
        }

        const insertPayload: DocumentInsert = {
          title: data.title,
          description: data.description || null,
          category: data.category,
          employee_id: data.employee_id,
          is_public: data.is_public,
          tags: tagsArray,
          file_path: filePathToUse!,
          version: 1,
          uploaded_by: user!.id,
          estado: 'pendiente',
        };

        // Debug: mostrar user.id y payload para comprobar RLS
        try {
          console.log('Debug: document insert attempt', {
            userId: user?.id ?? null,
            hasSessionToken: Boolean(getSessionToken()),
            insertPayload,
          });
        } catch (e) {
          /* ignore logging errors */
        }

        const { error } = await supabase.from('documents').insert(insertPayload);

        if (error) {
          // COMPENSACIÓN: Si falla la BD, borrar el archivo de Storage
          if (filePathToUse) {
            console.error('Error en BD, borrando archivo de Storage:', filePathToUse);
            await supabase.storage.from('documents').remove([filePathToUse]);
          }
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['document', id] });
      }
      toast.success(isEditing ? 'Documento actualizado' : 'Documento cargado correctamente');
      navigate('/documentos');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      // Detectar error RLS común y ofrecer pasos para resolverlo
      if (message.toLowerCase().includes('new row violates row-level security policy') || message.toLowerCase().includes('row-level security')) {
        toast.error('Error de permisos: la política RLS impide crear el documento. Asegúrate de estar autenticado y que tu usuario coincida con el campo "uploaded_by". Si esto ocurre en desarrollo, puedes crear el documento desde el servidor con la service_role key.');
        console.error('RLS insert error:', err);
        return;
      }

      toast.error(message || 'Error al guardar el documento');
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  if (loadingDocument) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/documentos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Editar Documento' : 'Cargar Documento'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Actualiza la información del documento' : 'Sube un nuevo documento al repositorio'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Documento</CardTitle>
          <CardDescription>
            Completa los campos con los datos del documento. El estado inicial será "Pendiente" hasta su validación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Título del documento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Descripción del documento..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="contrato">Contrato</SelectItem>
                          <SelectItem value="identificacion">Identificación</SelectItem>
                          <SelectItem value="certificado">Certificado</SelectItem>
                          <SelectItem value="nomina">Nómina</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empleado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un empleado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.user_id} value={emp.user_id}>
                              {emp.full_name} ({emp.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Empleado al que pertenece este documento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Documento Público</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Visible para todos los usuarios una vez validado
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etiquetas (separadas por comas)</FormLabel>
                    <FormControl>
                      <Input placeholder="rrhh, contrato, 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Archivo * {isEditing && '(opcional)'}</FormLabel>
                <div className="mt-2 mb-6">
                  <FileUploader
                    bucket="documents"
                    path={uploaderPath}
                    onFileSelected={(f) => setSelectedFileObj(f)}
                    onUploadError={(error) => {
                      toast.error('Error al subir archivo', {
                        description: error,
                      });
                    }}
                  />
                </div>
                {!uploadedFile && !isEditing && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Debes seleccionar un archivo PDF (.pdf) antes de guardar el documento
                  </p>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t relative z-[1]">
                <Button 
                  type="submit" 
                  disabled={mutation.isPending || uploadInProgress || (!uploadedFile && !selectedFileObj && !isEditing)}
                  className="relative z-[1] min-w-[200px]"
                >
                  {uploadInProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo archivo...
                    </>
                  ) : mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    isEditing ? 'Actualizar Documento' : 'Subir Documento'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/documentos')} className="relative z-[1]">
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
