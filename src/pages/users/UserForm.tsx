import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-with-auth';
import { getSessionToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Fingerprint } from 'lucide-react';

const userSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').max(255),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(50).regex(/^[a-zA-Z0-9_@.]+$/, 'Solo letras, números, guión bajo, @ y punto').optional().or(z.literal('')),
  phone: z.string().min(1, 'El teléfono es requerido'),
  status: z.enum(['activo', 'inactivo', 'suspendido']),
  role: z.enum(['superadmin', 'admin_rrhh']),
  password: z.string().optional(),
  area_id: z.string().optional(),
  position_id: z.string().optional(),
  biometric_id: z.number().int().min(1).max(127).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Fetch Areas
  const { data: areas = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('id, name')
        .eq('status', 'activo')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch Positions
  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('positions')
        .select('id, title')
        .eq('status', 'activo')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) return null;

      // Obtener datos del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (userError) throw userError;

      // Obtener rol del usuario
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', id)
        .single();

      if (roleError) console.log('No role found for user');

      // Obtener perfil (area y posicion)
      const { data: profileData } = await (supabase as any)
        .from('profiles')
        .select('area_id, position_id, biometric_id')
        .eq('user_id', id)
        .single();

      return {
        ...userData,
        role: roleData?.role || 'admin_rrhh',
        area_id: profileData?.area_id,
        position_id: profileData?.position_id,
        biometric_id: profileData?.biometric_id,
      };
    },
    enabled: isEditMode,
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: '',
      email: '',
      username: '',
      phone: '',
      status: 'activo',
      role: 'admin_rrhh',
      password: '',
      area_id: undefined,
      position_id: undefined,
      biometric_id: undefined,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        status: (user.status || 'activo') as 'activo' | 'inactivo' | 'suspendido',
        role: 'admin_rrhh',
        password: '',
        area_id: user.area_id || undefined,
        position_id: user.position_id || undefined,
        biometric_id: user.biometric_id || undefined,
      });
    }
  }, [user, form]);

  const mutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      let userId = id;

      if (isEditMode) {
        // Actualizar usuario en la tabla users
        const { error: userError } = await supabase
          .from('users')
          .update({
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
            status: data.status as 'activo' | 'inactivo' | 'suspendido',
          })
          .eq('id', id);

        if (userError) throw userError;
      } else {
        const sessionToken = getSessionToken();

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth?action=signup`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'x-session-token': sessionToken || '',
            },
            body: JSON.stringify({
              username: data.username,
              email: data.email,
              password: data.password,
              full_name: data.full_name,
              phone: data.phone,
              role: data.role,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al crear usuario');
        }

        const responseData = await response.json();
        userId = responseData.user.id;
      }

      // Actualizar o crear perfil con area y posicion
      if (userId) {
        const { error: profileError } = await (supabase as any)
          .from('profiles')
          .upsert({
            user_id: userId,
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
            area_id: data.area_id || null,
            position_id: data.position_id || null,
            biometric_id: data.biometric_id || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (profileError) throw profileError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success(isEditMode ? 'Usuario actualizado' : 'Usuario creado exitosamente');
      navigate('/usuarios');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar usuario');
    },
  });

  if (isEditMode && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode ? 'Actualiza la información del usuario' : 'Crea un nuevo usuario en el sistema'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled={isEditMode} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de Usuario *</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={true} placeholder="Usuario para acceder al sistema" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área / Departamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar área" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background z-50">
                      {areas.map((area: any) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
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
              name="position_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Puesto / Cargo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar puesto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background z-50">
                      {positions.map((pos: any) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.title}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                      <SelectItem value="suspendido">Suspendido</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isEditMode}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="superadmin">Administrador</SelectItem>
                      <SelectItem value="admin_rrhh">RH</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {!isEditMode && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña *</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Mínimo 8 caracteres" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isEditMode && (
            <FormField
              control={form.control}
              name="biometric_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Biométrico (1-127)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        max={127}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Ej: 1, 2, 3..."
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!field.value || isEnrolling}
                      onClick={async () => {
                        if (!field.value) {
                          toast.error('Primero asigna un ID biométrico');
                          return;
                        }
                        setIsEnrolling(true);
                        try {
                          const { error } = await (supabase as any)
                            .from('device_commands')
                            .insert({
                              device_id: 'ESP32-001',
                              command_type: 'ENROLL',
                              payload: { biometric_id: field.value },
                              status: 'pending'
                            });

                          if (error) throw error;

                          toast.success('Comando enviado al dispositivo. Por favor, coloca tu dedo en el lector.');
                        } catch (error: any) {
                          toast.error(error.message || 'Error al enviar comando');
                        } finally {
                          setIsEnrolling(false);
                        }
                      }}
                    >
                      {isEnrolling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Fingerprint className="h-4 w-4" />
                      )}
                      <span className="ml-2">Registrar Huella</span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Actualizar' : 'Crear Usuario'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/usuarios')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
