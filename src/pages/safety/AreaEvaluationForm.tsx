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
import { ArrowLeft, Save, FileText, X } from 'lucide-react';
import { FileUploader } from '@/components/shared/FileUploader';
import { useState, useEffect } from 'react';

const formSchema = z.object({
  sector_id: z.string().min(1, 'Selecciona un sector'),
  evaluation_date: z.string().min(1, 'Selecciona una fecha'),
  cleanliness_score: z.number().min(0).max(100, 'El puntaje debe estar entre 0 y 100'),
  order_score: z.number().min(0).max(100, 'El puntaje debe estar entre 0 y 100'),
  ventilation_score: z.number().min(0).max(100, 'El puntaje debe estar entre 0 y 100'),
  lighting_score: z.number().min(0).max(100, 'El puntaje debe estar entre 0 y 100'),
  ergonomics_score: z.number().min(0).max(100, 'El puntaje debe estar entre 0 y 100'),
  risk_control_score: z.number().min(0).max(100, 'El puntaje debe estar entre 0 y 100'),
  furniture_condition_score: z.number().min(0).max(100, 'El puntaje debe estar entre 0 y 100'),
  tools_condition_score: z.number().min(0).max(100, 'El puntaje debe estar entre 0 y 100'),
  hazmat_control_score: z.number().min(0).max(100, 'El puntaje debe estar entre 0 y 100'),
  signage_score: z.number().min(0).max(100, 'El puntaje debe estar entre 0 y 100'),
  compliance_score: z.number().min(0).max(100, 'El puntaje debe estar entre 0 y 100'),
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
  const [isFormComplete, setIsFormComplete] = useState(false);

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
    mode: 'onChange',
  });

  // Monitorear cambios en el formulario para validar si está completo
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Validar que todos los campos requeridos tengan valores válidos
      const isComplete =
        value.sector_id &&
        value.sector_id.trim() !== '' &&
        value.evaluation_date &&
        value.evaluation_date.trim() !== '' &&
        value.cleanliness_score !== undefined &&
        value.order_score !== undefined &&
        value.ventilation_score !== undefined &&
        value.lighting_score !== undefined &&
        value.ergonomics_score !== undefined &&
        value.risk_control_score !== undefined &&
        value.furniture_condition_score !== undefined &&
        value.tools_condition_score !== undefined &&
        value.hazmat_control_score !== undefined &&
        value.signage_score !== undefined &&
        value.compliance_score !== undefined &&
        form.formState.isValid; // Además de tener valores, deben ser válidos según Zod

      setIsFormComplete(!!isComplete);
    });

    return () => subscription.unsubscribe();
  }, [form.watch, form.formState.isValid]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Validar que todos los campos requeridos estén completos
      if (!isFormComplete) {
        throw new Error('Por favor, completa todos los campos requeridos del formulario');
      }

      // Validar puntajes
      const scores = [
        data.cleanliness_score,
        data.order_score,
        data.ventilation_score,
        data.lighting_score,
        data.ergonomics_score,
        data.risk_control_score,
        data.furniture_condition_score,
        data.tools_condition_score,
        data.hazmat_control_score,
        data.signage_score,
        data.compliance_score,
      ];

      const invalidScores = scores.filter(score =>
        score === undefined || score < 0 || score > 100
      );

      if (invalidScores.length > 0) {
        throw new Error('Todos los puntajes deben estar entre 0 y 100');
      }

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
    // Verificación adicional antes de enviar
    const formErrors = form.formState.errors;

    if (Object.keys(formErrors).length > 0) {
      toast.error('Por favor, corrige los errores en el formulario antes de guardar');
      return;
    }

    // Validar que todos los campos requeridos tengan valores
    const requiredFields = [
      'sector_id',
      'evaluation_date',
      'cleanliness_score',
      'order_score',
      'ventilation_score',
      'lighting_score',
      'ergonomics_score',
      'risk_control_score',
      'furniture_condition_score',
      'tools_condition_score',
      'hazmat_control_score',
      'signage_score',
      'compliance_score',
    ];

    const missingFields = requiredFields.filter(field => {
      const value = data[field as keyof FormData];
      return value === undefined || value === null ||
        (typeof value === 'number' && (value < 0 || value > 100)) ||
        (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      toast.error('Por favor, completa todos los campos requeridos del formulario');
      return;
    }

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

      {!isFormComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Formulario incompleto</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Por favor, completa todos los campos requeridos antes de guardar la evaluación.</p>
                <p className="mt-1">Todos los puntajes deben estar entre 0 y 100.</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                      <FormLabel>Sector / Área <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel>Fecha de Evaluación <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Criterios de Evaluación (0-100) <span className="text-red-500">*</span></h3>
                <p className="text-sm text-muted-foreground">Todos los puntajes son requeridos y deben estar entre 0 y 100</p>
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
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value)) {
                                  field.onChange(value);
                                } else {
                                  field.onChange(0);
                                }
                              }}
                              onBlur={(e) => {
                                const value = parseInt(e.target.value);
                                if (isNaN(value) || value < 0) {
                                  field.onChange(0);
                                } else if (value > 100) {
                                  field.onChange(100);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Detalles de la evaluación..."
                          {...field}
                          className="min-h-[120px]"
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
                          rows={4}
                          placeholder="Recomendaciones de mejora..."
                          {...field}
                          className="min-h-[120px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Evidencia (PDF opcional)</FormLabel>
                <FileUploader
                  bucket="inspections"
                  onUploadComplete={handleFileUpload}
                  accept="application/pdf"
                  maxSize={5}
                />
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {uploadedFiles.map((file) => (
                      <div key={file} className="relative group border rounded-md p-2 flex flex-col items-center justify-center bg-gray-50 h-24">
                        <FileText className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500 w-full text-center truncate px-2">
                          {file.split('/').pop()}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFile(file)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/seguridad-higiene/evaluaciones')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending || !isFormComplete}
                  className="min-w-[160px]"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {mutation.isPending ? 'Guardando...' : 'Guardar Evaluación'}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                <p><span className="text-red-500">*</span> Campos requeridos</p>
                <p className="mt-1">Debes completar todos los campos requeridos antes de poder guardar la evaluación.</p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}