import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  incident_type: z.enum(['accidente', 'incidente', 'casi_accidente', 'condicion_insegura']),
  severity: z.enum(['baja', 'media', 'alta', 'critica']),
  location: z.string().optional(),
});

type IncidentFormData = z.infer<typeof incidentSchema>;

export default function IncidentForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filePaths, setFilePaths] = useState<string[]>([]);

  const form = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      title: '',
      description: '',
      incident_type: 'incidente',
      severity: 'media',
      location: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: IncidentFormData) => {
      if (!user) throw new Error('No user found');

      const { error } = await (supabase as any)
        .from('incidents')
        .insert([{
          ...data,
          reported_by: user.id,
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
                      <SelectItem value="accidente">Accidente</SelectItem>
                      <SelectItem value="incidente">Incidente</SelectItem>
                      <SelectItem value="casi_accidente">Casi Accidente</SelectItem>
                      <SelectItem value="condicion_insegura">Condición Insegura</SelectItem>
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
              Evidencias Fotográficas
            </label>
            <FileUploader
              bucket="incidents"
              accept="image/*,.pdf"
              maxSize={10}
              onUploadComplete={(path) => {
                setFilePaths((prev) => [...prev, path]);
                toast.success('Archivo adjuntado');
              }}
              onUploadError={(error) => {
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
            <Button type="submit" disabled={mutation.isPending}>
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
