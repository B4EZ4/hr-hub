import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

const formSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  description: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  category: z.enum(['contrato', 'politica', 'procedimiento', 'manual', 'certificado', 'otro']),
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
  const isEditing = !!id;

  const { data: document, isLoading: loadingDocument } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
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
      is_public: false,
      tags: '',
    },
  });

  useEffect(() => {
    if (document) {
      form.reset({
        title: document.title,
        description: document.description || '',
        category: document.category,
        is_public: document.is_public,
        tags: document.tags?.join(', ') || '',
      });
      setUploadedFile(document.file_path);
    }
  }, [document, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!uploadedFile && !isEditing) {
        throw new Error('Debe subir un archivo');
      }

      const tags = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : null;

      const payload = {
        title: data.title,
        description: data.description || null,
        category: data.category,
        is_public: data.is_public,
        tags,
        ...(uploadedFile && uploadedFile !== document?.file_path && { 
          file_path: uploadedFile,
          version: isEditing ? (document?.version || 1) + 1 : 1 
        }),
        ...(!isEditing && { uploaded_by: user!.id }),
      };

      if (isEditing) {
        const { error } = await (supabase as any)
          .from('documents')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('documents')
          .insert(payload);
        if (error) throw error;
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
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar el documento');
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
            Completa los campos con los datos del documento
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
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="contrato">Contrato</SelectItem>
                          <SelectItem value="politica">Política</SelectItem>
                          <SelectItem value="procedimiento">Procedimiento</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="certificado">Certificado</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Público</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Visible para todos los usuarios
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

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
                <FileUploader
                  bucket="documents"
                  path="general"
                  onUploadComplete={(path) => {
                    setUploadedFile(path);
                    toast.success('Archivo subido correctamente');
                  }}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={mutation.isPending || (!uploadedFile && !isEditing)}>
                  {mutation.isPending ? 'Guardando...' : isEditing ? 'Actualizar Documento' : 'Subir Documento'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/documentos')}>
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
