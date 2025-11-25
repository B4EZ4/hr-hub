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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, CheckCircle, XCircle } from 'lucide-react';
import { FileUploader } from '@/components/shared/FileUploader';
import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const responseSchema = z.object({
  item_id: z.string(),
  response: z.any(),
  comments: z.string().optional(),
  evidence_paths: z.array(z.string()).optional(),
});

const formSchema = z.object({
  responses: z.array(responseSchema),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function InspectionExecution() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>({});
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const [incompleteReason, setIncompleteReason] = useState('');

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['sh-inspection', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sh_inspections')
        .select(`
          *,
          sector:sector_id (name),
          progress:inspection_progress (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: checklist } = useQuery({
    queryKey: ['sh-checklist-items'],
    queryFn: async () => {
      // Get a sample checklist - in production this should be linked to the inspection
      const { data, error } = await (supabase as any)
        .from('sh_checklists')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      responses: [],
    },
  });

  useEffect(() => {
    if (checklist?.items) {
      const items = Array.isArray(checklist.items) ? checklist.items : [];
      form.setValue(
        'responses',
        items.map((item: any) => ({
          item_id: item.id || '',
          response: null,
          comments: '',
          evidence_paths: [],
        }))
      );
    }
  }, [checklist, form]);

  const updateProgressMutation = useMutation({
    mutationFn: async (status: string) => {
      const responses = form.getValues('responses');
      const totalItems = responses.length;
      const completedItems = responses.filter((r) => r.response !== null).length;
      const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      // Update inspection status
      await (supabase as any)
        .from('sh_inspections')
        .update({
          status,
          completed_date: status === 'completada' ? new Date().toISOString() : null,
          findings: form.getValues('findings'),
          recommendations: form.getValues('recommendations'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      // Update or create progress
      const { data: existingProgress } = await (supabase as any)
        .from('inspection_progress')
        .select('id')
        .eq('inspection_id', id)
        .single();

      if (existingProgress) {
        await (supabase as any)
          .from('inspection_progress')
          .update({
            total_items: totalItems,
            completed_items: completedItems,
            pending_items: totalItems - completedItems,
            completion_percentage: completionPercentage,
            updated_at: new Date().toISOString(),
          })
          .eq('inspection_id', id);
      } else {
        await (supabase as any)
          .from('inspection_progress')
          .insert({
            inspection_id: id,
            total_items: totalItems,
            completed_items: completedItems,
            pending_items: totalItems - completedItems,
            completion_percentage: completionPercentage,
          });
      }
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      await updateProgressMutation.mutateAsync('completada');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sh-inspections'] });
      toast.success('Inspección finalizada correctamente');
      navigate('/seguridad-higiene/inspecciones');
    },
    onError: (error: Error) => {
      toast.error('Error al finalizar inspección: ' + error.message);
    },
  });

  const saveProgressMutation = useMutation({
    mutationFn: async () => {
      await updateProgressMutation.mutateAsync('en_progreso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sh-inspection', id] });
      toast.success('Progreso guardado correctamente');
    },
    onError: (error: Error) => {
      toast.error('Error al guardar progreso: ' + error.message);
    },
  });

  const markIncompleteMutation = useMutation({
    mutationFn: async () => {
      await (supabase as any)
        .from('sh_inspections')
        .update({
          status: 'cancelada',
          findings: `Inconclusa: ${incompleteReason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sh-inspections'] });
      toast.success('Inspección marcada como inconclusa');
      navigate('/seguridad-higiene/inspecciones');
    },
    onError: (error: Error) => {
      toast.error('Error al marcar como inconclusa: ' + error.message);
    },
  });

  const handleFileUpload = (itemId: string, path: string) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), path],
    }));
  };

  const removeFile = (itemId: string, path: string) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || []).filter((f) => f !== path),
    }));
  };

  const handleFinalize = () => {
    const responses = form.getValues('responses');
    const allCompleted = responses.every((r) => r.response !== null);
    
    if (!allCompleted) {
      toast.error('Completa todos los ítems antes de finalizar');
      return;
    }

    finalizeMutation.mutate();
  };

  const handleMarkIncomplete = () => {
    if (!incompleteReason.trim()) {
      toast.error('Debes especificar el motivo');
      return;
    }
    markIncompleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!inspection) {
    return <div>Inspección no encontrada</div>;
  }

  const items = Array.isArray(checklist?.items) ? checklist.items : [];
  const responses = form.watch('responses');
  const completedCount = responses.filter((r) => r.response !== null).length;
  const totalCount = responses.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/inspecciones')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Ejecutar Inspección</h1>
          <p className="text-muted-foreground">{inspection.sector?.name}</p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          {completedCount} / {totalCount}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-2">
            <CardTitle>Progreso</CardTitle>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{Math.round(progress)}% completado</p>
          </div>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form className="space-y-6">
          {items.map((item: any, index: number) => (
            <Card key={item.id || index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{item.question || item.name}</span>
                  {responses[index]?.response !== null && (
                    <Badge variant="success">Completado</Badge>
                  )}
                </CardTitle>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name={`responses.${index}.response`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Respuesta {item.required && <span className="text-destructive">*</span>}</FormLabel>
                      <FormControl>
                        {item.type === 'yes_no' ? (
                          <RadioGroup onValueChange={field.onChange} value={field.value}>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id={`${item.id}-yes`} />
                                <label htmlFor={`${item.id}-yes`} className="flex items-center gap-2 cursor-pointer">
                                  <span className="text-green-600 font-bold text-lg">✓</span>
                                  <span>Sí</span>
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id={`${item.id}-no`} />
                                <label htmlFor={`${item.id}-no`} className="flex items-center gap-2 cursor-pointer">
                                  <span className="text-red-600 font-bold text-lg">✗</span>
                                  <span>No</span>
                                </label>
                              </div>
                            </div>
                          </RadioGroup>
                        ) : item.type === 'select' ? (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una opción" />
                            </SelectTrigger>
                            <SelectContent>
                              {(item.options || ['Bueno', 'Aceptable', 'Deficiente']).map((opt: string) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : item.type === 'text' ? (
                          <Textarea {...field} rows={2} placeholder="Ingresa tu respuesta" />
                        ) : item.type === 'numeric' ? (
                          <Input {...field} type="number" placeholder="Ingresa un número" />
                        ) : (
                          <Input {...field} placeholder="Ingresa tu respuesta" />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`responses.${index}.comments`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comentarios adicionales</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} placeholder="Observaciones..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Evidencia fotográfica</FormLabel>
                  <FileUploader
                    bucket="inspections"
                    onUploadComplete={(path) => handleFileUpload(item.id, path)}
                    accept="image/*"
                    maxSize={5}
                  />
                  {uploadedFiles[item.id]?.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {uploadedFiles[item.id].map((file) => (
                        <div key={file} className="relative group">
                          <img
                            src={`${supabase.storage.from('inspections').getPublicUrl(file).data.publicUrl}`}
                            alt="Evidencia"
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(item.id, file)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle>Hallazgos Generales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="findings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hallazgos</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="Describe los hallazgos encontrados..." />
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
                      <Textarea {...field} rows={4} placeholder="Recomendaciones para mejorar..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/seguridad-higiene/inspecciones')}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowIncompleteDialog(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Marcar Inconclusa
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => saveProgressMutation.mutate()}
              disabled={saveProgressMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Guardar Progreso
            </Button>
            <Button
              type="button"
              onClick={handleFinalize}
              disabled={finalizeMutation.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalizar Inspección
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog open={showIncompleteDialog} onOpenChange={setShowIncompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como Inconclusa</AlertDialogTitle>
            <AlertDialogDescription>
              Especifica el motivo por el cual no se puede completar esta inspección.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={incompleteReason}
            onChange={(e) => setIncompleteReason(e.target.value)}
            rows={4}
            placeholder="Motivo..."
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkIncomplete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
