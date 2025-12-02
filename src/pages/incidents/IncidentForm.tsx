import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-with-auth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUploader } from '@/components/shared/FileUploader';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const incidentSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(200),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  // Usamos slugs como valor guardado en DB y etiquetas separadas en la UI
  incident_type: z.enum(['falta_injustificada', 'falta_justificada', 'permiso_laboral', 'accidente_laboral', 'despido']),
  severity: z.enum(['baja', 'media', 'alta', 'critica']),
  location: z.string().optional(),
});

type IncidentFormData = z.infer<typeof incidentSchema>;

export default function IncidentForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  const form = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      title: '',
      description: '',
      incident_type: 'falta_injustificada',
      severity: 'media',
      location: '',
    },
  });

  // Autocomplete: buscar perfiles por nombre (debounced)
  const profilesQuery = useQuery<any[], any>({
    queryKey: ['profiles', searchTerm],
    queryFn: async () => {
      const q = searchTerm.trim();
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .ilike('full_name', `%${q}%`)
        .order('full_name')
        .limit(6);
      if (error) throw error;
      return data as any[];
    },
    enabled: searchTerm.trim().length > 1,
  });

  const profileSuggestions = (profilesQuery.data ?? []) as any[];
  const isSuggesting = profilesQuery.isFetching;

  // Limpiar sugerencias al seleccionar
  useEffect(() => {
    if (selectedProfile) setSearchTerm('');
  }, [selectedProfile]);

  const mutation = useMutation({
    mutationFn: async (data: IncidentFormData) => {
      if (!user) throw new Error('No user found');

      const { error } = await (supabase as any)
        .from('incidents')
        .insert([{
          ...data,
          reported_by: user.id,
          // assigned_to: si hay perfil seleccionado, usar su user_id
          assigned_to: selectedProfile ? selectedProfile.user_id : null,
          file_paths: filePaths.length > 0 ? filePaths : null,
          status: 'abierto',
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Incidencia reportada exitosamente');
      navigate('/incidencias');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al reportar incidencia');
    },
  });

  const BUCKET_PROP = 'documents/incidencias';

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;
    if (!user) {
      toast.error('Debes iniciar sesión para subir archivos.');
      return;
    }

    try {
      setUploading(true);
      const parts = BUCKET_PROP.split('/').filter(Boolean);
      const bucketName = parts[0];
      const prefix = parts.slice(1).join('/');

      const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storagePath = prefix ? `${prefix}/${user.id}/${safeFileName}` : `${user.id}/${safeFileName}`;

      const { data, error } = await supabase.storage.from(bucketName).upload(storagePath, file);
      if (error) throw error;

      const storedPath = (data as any)?.path ?? storagePath;
      setFilePaths((prev) => [...prev, storedPath]);
      toast.success('Archivo adjuntado');
    } catch (err: any) {
      console.error('Error uploading file', err);
      toast.error(err?.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportar Incidencia</h1>
        <p className="text-muted-foreground">
          Crea un nuevo reporte de incidencia de seguridad
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Breve descripción del incidente" />
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
                <FormLabel>Descripción *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={5}
                    placeholder="Describe detalladamente lo ocurrido..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="incident_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Incidente *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      <SelectItem value="falta_injustificada">Falta injustificada</SelectItem>
                      <SelectItem value="falta_justificada">Falta justificada</SelectItem>
                      <SelectItem value="permiso_laboral">Permiso laboral</SelectItem>
                      <SelectItem value="accidente_laboral">Accidente laboral</SelectItem>
                      <SelectItem value="despido">Despido</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Severidad *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicación</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Lugar donde ocurrió" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Asignar a: búsqueda de perfiles */}
          <div>
            <label className="text-sm font-medium mb-2 block">Asignar a (buscar perfil)</label>
            <div className="relative">
              <Input
                value={selectedProfile ? selectedProfile.full_name : searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedProfile(null);
                }}
                placeholder="Escribe un nombre para buscar..."
              />

              {/* Sugerencias */}
              {searchTerm.trim().length > 1 && profileSuggestions.length > 0 && !selectedProfile && (
                <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg border">
                  {isSuggesting && <div className="p-2 text-sm text-muted-foreground">Buscando...</div>}
                  {profileSuggestions.map((p: any) => (
                    <button
                      key={p.user_id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted/10"
                      onClick={() => setSelectedProfile(p)}
                    >
                      <div className="font-medium">{p.full_name}</div>
                      <div className="text-xs text-muted-foreground">{p.email}</div>
                    </button>
                  ))}
                </div>
              )}

              {selectedProfile && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">Asignado a: {selectedProfile.full_name}</div>
                    <div className="text-xs text-muted-foreground">{selectedProfile.email}</div>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => setSelectedProfile(null)}>Quitar</Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Evidencias
            </label>
            <FileUploader
              bucket={BUCKET_PROP}
              accept={'image/*,.pdf'}
              maxSize={10}
              onFileSelected={handleFileSelected}
              onUploadError={(error: string) => {
                toast.error(`Error: ${error}`);
              }}
            />
            {filePaths.length > 0 && (
              <div className="mt-2 space-y-1">
                {filePaths.map((path, idx) => (
                  <p key={idx} className="text-sm text-muted-foreground">
                    ✓ Archivo {idx + 1}: {path.split('/').pop()}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={mutation.isPending || uploading}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reportar Incidencia
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/incidencias')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
