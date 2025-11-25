import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { FileUploader } from '@/components/shared/FileUploader';
import { useState } from 'react';

const formSchema = z.object({
  sector_id: z.string().min(1, 'Selecciona un sector'),
  evaluation_date: z.string().min(1, 'Selecciona una fecha'),
  cleanliness_score: z.number().min(0).max(100),
  order_score: z.number().min(0).max(100),
  ventilation_score: z.number().min(0).max(100),
  lighting_score: z.number().min(0).max(100),
  ergonomics_score: z.number().min(0).max(100),
  risk_control_score: z.number().min(0).max(100),
  furniture_condition_score: z.number().min(0).max(100),
  tools_condition_score: z.number().min(0).max(100),
  hazmat_control_score: z.number().min(0).max(100),
  signage_score: z.number().min(0).max(100),
  compliance_score: z.number().min(0).max(100),
  observations: z.string().optional(),
  recommendations: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AreaEvaluationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const { data: sectors = [] } = useQuery({
    queryKey: ['sh-sectors'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sh_sectors')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      evaluation_date: new Date().toISOString().split('T')[0],
      cleanliness_score: 0,
      order_score: 0,
      ventilation_score: 0,
      lighting_score: 0,
      ergonomics_score: 0,
      risk_control_score: 0,
      furniture_condition_score: 0,
      tools_condition_score: 0,
      hazmat_control_score: 0,
      signage_score: 0,
      compliance_score: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Get current user's profile to use user_id
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('user_id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) {
        throw new Error('No se encontró el perfil del usuario');
      }

      const { error } = await (supabase as any)
        .from('sh_area_evaluations')
        .insert({
          ...data,
          evaluated_by: profile.user_id,
          file_paths: uploadedFiles.length > 0 ? uploadedFiles : null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-evaluations'] });
      toast.success('Evaluación registrada correctamente');
      navigate('/seguridad-higiene/evaluaciones');
    },
    onError: (error: Error) => {
      toast.error('Error al registrar evaluación: ' + error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const handleFileUpload = (path: string) => {
    setUploadedFiles([...uploadedFiles, path]);
  };

  const removeFile = (path: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f !== path));
  };

  const criteria = [
    { key: 'cleanliness_score', label: 'Limpieza' },
    { key: 'order_score', label: 'Orden' },
    { key: 'ventilation_score', label: 'Ventilación' },
    { key: 'lighting_score', label: 'Iluminación' },
    { key: 'ergonomics_score', label: 'Ergonomía' },
    { key: 'risk_control_score', label: 'Control de Riesgos' },
    { key: 'furniture_condition_score', label: 'Condición de Mobiliario' },
    { key: 'tools_condition_score', label: 'Condición de Herramientas' },
    { key: 'hazmat_control_score', label: 'Control de Sustancias Peligrosas' },
    { key: 'signage_score', label: 'Señalización' },
    { key: 'compliance_score', label: 'Cumplimiento Normativo (NOMs)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/evaluaciones')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Evaluación de Área</h1>
          <p className="text-muted-foreground">Evalúa las condiciones de seguridad e higiene</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulario de Evaluación</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sector_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sector / Área</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un sector" />
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
                  name="evaluation_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Evaluación</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Criterios de Evaluación (0-100)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {criteria.map((criterion) => (
                    <FormField
                      key={criterion.key}
                      control={form.control}
                      name={criterion.key as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{criterion.label}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Detalles de la evaluación..." {...field} />
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
                      <Textarea rows={4} placeholder="Recomendaciones de mejora..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Evidencia Fotográfica</FormLabel>
                <FileUploader
                  bucket="inspections"
                  onUploadComplete={handleFileUpload}
                  accept="image/*"
                  maxSize={5}
                />
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {uploadedFiles.map((file) => (
                      <div key={file} className="relative group">
                        <img
                          src={`${supabase.storage.from('inspections').getPublicUrl(file).data.publicUrl}`}
                          alt="Evidencia"
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(file)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/seguridad-higiene/evaluaciones')}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {mutation.isPending ? 'Guardando...' : 'Guardar Evaluación'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}