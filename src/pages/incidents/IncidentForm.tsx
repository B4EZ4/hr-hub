import { useState, useEffect, useRef } from 'react';
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

const containsAlphaNum = (val: string) => /\p{L}|\p{N}/u.test(val);

const incidentSchema = z.object({
  title: z
    .string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200)
    .refine((v) => containsAlphaNum(v), { message: 'El título no puede contener solo símbolos' }),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .refine((v) => containsAlphaNum(v), { message: 'La descripción no puede contener solo símbolos' }),
  // Usamos slugs como valor guardado en DB y etiquetas separadas en la UI
  incident_type: z.enum([
    'falta_injustificada',
    'falta_justificada',
    'permiso_laboral',
    'accidente_laboral',
    'despido',
    'problema_de_conducta',
    'otro',
  ]),
  severity: z.enum(['baja', 'media', 'alta', 'critica']),
  location: z
    .string()
    .optional()
    .refine((v) => (v === undefined || v === '' ? true : containsAlphaNum(v)), { message: 'La ubicación no puede contener solo símbolos' }),
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Para el autocomplete similar a TerminationForm
  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('status', 'activo')
        .not('full_name', 'ilike', '%admin%')
        .order('full_name');
      if (error) throw error;
      return data as any[];
    },
  });

  const employees = employeesQuery.data ?? [];
  const isSuggesting = employeesQuery.isFetching;

  const employeesFiltering = (emps: any[] = [], q: string) => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return emps.filter((e) => (e.full_name || '').toLowerCase().includes(s) || (e.email || '').toLowerCase().includes(s)).slice(0, 8);
  };

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

  // Limpiar sugerencias al seleccionar
  useEffect(() => {
    if (selectedProfile) setSearchTerm('');
  }, [selectedProfile]);

  const mutation = useMutation({
    mutationFn: async (data: IncidentFormData) => {
      if (!user) throw new Error('No user found');

      // Comprobar si ya existe una incidencia exactamente igual
      try {
        let dupQuery: any = (supabase as any).from('incidents').select('id').eq('title', data.title.trim()).eq('description', data.description.trim()).eq('incident_type', data.incident_type).eq('severity', data.severity);
        if (selectedProfile) {
          dupQuery = dupQuery.eq('assigned_to', selectedProfile.user_id);
        } else {
          dupQuery = dupQuery.is('assigned_to', null);
        }
        const { data: existing } = await dupQuery.limit(1);
        if (existing && existing.length > 0) {
          const msg = 'Ya existe una incidencia con los mismos datos. Por favor revisa antes de crear.';
          // Mostrar error 
          try { form.setError('title' as any, { type: 'manual', message: msg }); } catch (e) { /* ignore if form not available */ }
          throw new Error(msg);
        }
      } catch (e) {
        // Si la comprobación de duplicados falló por un error de BD distinto, propagar
        if ((e as Error).message && (e as Error).message.includes('Ya existe')) throw e;
        // otherwise continue — but better to rethrow so mutation fails visibly
        // (this helps surfacing DB errors early)
        throw e;
      }

      // Evitar asignar al mismo usuario el mismo tipo de incidencia en el mismo día
      if (selectedProfile) {
        try {
          const start = new Date();
          start.setHours(0,0,0,0);
          const end = new Date(start);
          end.setDate(start.getDate() + 1);

          // solo una falta al dia
          const faltaTypes = ['falta_justificada', 'falta_injustificada'];
          let q: any = (supabase as any).from('incidents').select('id').eq('assigned_to', selectedProfile.user_id).gte('created_at', start.toISOString()).lt('created_at', end.toISOString()).limit(1);
          if (faltaTypes.includes(data.incident_type)) {
            q = q.in('incident_type', faltaTypes);
          } else {
            q = q.eq('incident_type', data.incident_type);
          }
          const { data: sameDay, error: sameDayErr } = await q;

          if (sameDayErr) throw sameDayErr;
          if (sameDay && (sameDay as any).length > 0) {
            const msg = faltaTypes.includes(data.incident_type)
              ? 'Este usuario ya tiene una falta (justificada o injustificada) registrada hoy.'
              : 'Este usuario ya tiene una incidencia de este tipo registrada hoy.';
            try { form.setError('incident_type' as any, { type: 'manual', message: msg }); } catch (e) { /* ignore */ }
            throw new Error(msg);
          }
        } catch (err) {
          // propagar para que el onError lo muestre
          throw err;
        }
      }

      // Insertar la incidencia y luego, si hay archivos, crear registros en `documents`
      // Map UI incident_type slugs to DB-compatible values (DB has a CHECK constraint
      const dbAllowedTypes = ['accidente', 'incidente', 'casi_accidente', 'condicion_insegura'];
      const mapToDbType: Record<string, string> = {
        accidente_laboral: 'accidente',
        falta_injustificada: 'incidente',
        falta_justificada: 'incidente',
        permiso_laboral: 'incidente',
        despido: 'incidente',
        problema_de_conducta: 'incidente',
        otro: 'incidente',
      };

      const dbIncidentType = mapToDbType[data.incident_type] ?? (dbAllowedTypes.includes(data.incident_type) ? data.incident_type : 'incidente');

      const insertPayload = {
        ...data,
        incident_type: dbIncidentType,
        reported_by: user.id,
        assigned_to: selectedProfile ? selectedProfile.user_id : null,
        file_paths: filePaths.length > 0 ? filePaths : null,
        status: 'abierto',
      };

      const { data: insertedData, error } = await (supabase as any)
        .from('incidents')
        .insert([insertPayload])
        .select()
        .single();

      if (error) throw error;

      // Si hay archivos, crear registros en la tabla `documents` para que aparezcan en documentos
      if (filePaths.length > 0) {
        try {
          const docs = filePaths.map((p) => ({
            title: `Evidencia Incidencia: ${data.title}`,
            description: `Archivo adjunto para la incidencia reportada por ${user.id}`,
            category: 'Incidencia',
            employee_id: selectedProfile ? selectedProfile.user_id : null,
            is_public: false,
            tags: null,
            file_path: p,
            version: 1,
            uploaded_by: user.id,
            estado: 'pendiente',
          }));

          const { error: docsError } = await (supabase as any).from('documents').insert(docs as any);
          if (docsError) {
            // Compensación: eliminar archivos de storage si falla la inserción en documents
            await supabase.storage.from('documents').remove(filePaths);
            throw docsError;
          }
        } catch (e) {
          throw e;
        }
      }
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

            {/* Asignar a: búsqueda de perfiles */}
          <div>
            <label className="text-sm font-medium mb-2 block">Asignar a (buscar perfil)</label>
            <div className="relative">
              <div
                ref={containerRef}
                onFocus={() => setShowSuggestions(true)}
                onBlur={(e: any) => {
                  const related = e.relatedTarget as Node | null;
                  if (!containerRef.current?.contains(related)) setShowSuggestions(false);
                }}
              >
                <Input
                  value={selectedProfile ? selectedProfile.full_name : searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedProfile(null);
                  }}
                  placeholder="Escribe un nombre para buscar..."
                  onFocus={() => setShowSuggestions(true)}
                />

                {/* Sugerencias: mostrar solo al tener foco o cuando hay texto */}
                {(employees && !selectedProfile && (showSuggestions || searchTerm.trim().length > 0)) && (
                  <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg border">
                    {isSuggesting && <div className="p-2 text-sm text-muted-foreground">Buscando...</div>}
                    {employeesFiltering(employees, searchTerm).length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">No se encontraron resultados</div>
                    )}
                    {employeesFiltering(employees, searchTerm).map((p: any) => (
                      <button
                        key={p.user_id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted/10"
                        onClick={() => {
                          setSelectedProfile(p);
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="font-medium">{p.full_name}</div>
                        <div className="text-xs text-muted-foreground">{p.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
                      <SelectItem value="problema_de_conducta">Problema de conducta</SelectItem>
                      <SelectItem value="otro">Otro (Describir detalladamente)</SelectItem>
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
