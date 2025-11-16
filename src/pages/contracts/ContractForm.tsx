import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileUploader } from '@/components/shared/FileUploader';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const contractSchema = z.object({
  user_id: z.string().uuid('Debe seleccionar un empleado'),
  contract_type: z.enum(['indefinido', 'temporal', 'obra', 'practicas', 'formacion']),
  start_date: z.string().min(1, 'Fecha de inicio requerida'),
  end_date: z.string().optional(),
  position: z.string().min(2, 'Posición requerida').max(100),
  department: z.string().min(2, 'Departamento requerido').max(100),
  salary: z.string().optional(),
  status: z.enum(['activo', 'por_vencer', 'vencido', 'renovado', 'terminado']),
  notes: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

export default function ContractForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  const [filePath, setFilePath] = useState<string | null>(null);

  const { data: contract } = useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditMode,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-select'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id, user_id, full_name, email')
        .eq('status', 'activo')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      user_id: '',
      contract_type: 'indefinido',
      start_date: '',
      end_date: '',
      position: '',
      department: '',
      salary: '',
      status: 'activo',
      notes: '',
    },
  });

  useEffect(() => {
    if (contract) {
      form.reset({
        user_id: contract.user_id || '',
        contract_type: contract.contract_type || 'indefinido',
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
        position: contract.position || '',
        department: contract.department || '',
        salary: contract.salary?.toString() || '',
        status: contract.status || 'activo',
        notes: contract.notes || '',
      });
      setFilePath(contract.file_path);
    }
  }, [contract, form]);

  const mutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      const payload = {
        ...data,
        salary: data.salary ? parseFloat(data.salary) : null,
        file_path: filePath,
      };

      if (isEditMode) {
        const { error } = await (supabase as any)
          .from('contracts')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('contracts')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success(isEditMode ? 'Contrato actualizado' : 'Contrato creado exitosamente');
      navigate('/contratos');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar contrato');
    },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditMode ? 'Editar Contrato' : 'Nuevo Contrato'}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode ? 'Actualiza la información del contrato' : 'Crea un nuevo contrato laboral'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          <FormField
            control={form.control}
            name="user_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empleado *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditMode}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un empleado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background">
                    {users.map((user: any) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="contract_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Contrato *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      <SelectItem value="indefinido">Indefinido</SelectItem>
                      <SelectItem value="temporal">Temporal</SelectItem>
                      <SelectItem value="obra">Obra o Servicio</SelectItem>
                      <SelectItem value="practicas">Prácticas</SelectItem>
                      <SelectItem value="formacion">Formación</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="por_vencer">Por Vencer</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                      <SelectItem value="renovado">Renovado</SelectItem>
                      <SelectItem value="terminado">Terminado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posición *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Inicio *</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Fin</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salario (€)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <label className="text-sm font-medium mb-2 block">
              Archivo del Contrato (PDF)
            </label>
            <FileUploader
              bucket="contracts"
              accept=".pdf"
              maxSize={50}
              onUploadComplete={(path) => {
                setFilePath(path);
                toast.success('Archivo subido correctamente');
              }}
              onUploadError={(error) => {
                toast.error(`Error: ${error}`);
              }}
            />
            {filePath && (
              <p className="text-sm text-muted-foreground mt-2">
                ✓ Archivo adjunto: {filePath.split('/').pop()}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Actualizar' : 'Crear Contrato'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/contratos')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
