import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Calendar, Search, User, UserCheck, ArrowLeft } from 'lucide-react';

// 1. Definición de las Props
interface VacationRequestProps {
  onBack: () => void;
}

// 2. Esquema de validación
const vacationSchema = z.object({
  start_date: z.string().min(1, 'Fecha de inicio requerida'),
  end_date: z.string().min(1, 'Fecha de fin requerida'),
  reason: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['end_date'],
})
  // ➡️ INICIO DEL NUEVO BLOQUE DE VALIDACIÓN DE ANTELACIÓN ⬅️
  .refine((data) => {
    const start = new Date(data.start_date);
    // Normalizar la fecha de inicio para comparar solo días, no horas.
    start.setHours(0, 0, 0, 0);

    // Calcular la fecha mínima permitida (Hoy + 14 días)
    const minStartDate = new Date();
    minStartDate.setDate(minStartDate.getDate() + 14);
    // Normalizar la fecha mínima
    minStartDate.setHours(0, 0, 0, 0);

    // La fecha de inicio debe ser mayor o igual que la fecha mínima de solicitud.
    return start >= minStartDate;
  }, {
    message: 'La fecha de inicio debe ser con al menos 14 días de antelación.',
    path: ['start_date'],
  });
// ➡️ FIN DEL NUEVO BLOQUE DE VALIDACIÓN DE ANTELACIÓN ⬅️

type VacationFormData = z.infer<typeof vacationSchema>;

// 3. Tipos para el usuario (ACTUALIZADO SEGÚN TU SQL)
// Antes tenías first_name y last_name, ahora usamos full_name y user_id
type Profile = {
  id: string;        // ID del perfil
  user_id: string;   // ID del usuario (necesario para las relaciones)
  full_name: string; // Columna real en tu DB
  email: string;
  department?: string;
};

// 4. Componente Principal
const VacationRequest: React.FC<VacationRequestProps> = ({ onBack }) => {
  const queryClient = useQueryClient();

  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // --- QUERY CORREGIDA: Busca por full_name ---
  const { data: searchResults } = useQuery({
    queryKey: ['profile-search', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2) return [];

      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        // CAMBIO: Buscamos en 'full_name' o 'email' porque 'first_name' no existe
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(5);

      if (error) {
        console.error("Error buscando perfil:", error);
        throw error;
      }
      return data as Profile[];
    },
    enabled: searchTerm.length >= 2 && isSearching,
  });

  // --- QUERY DE BALANCE CORREGIDA: Usa user_id ---
  const { data: balance } = useQuery({
    queryKey: ['vacation-balances', selectedUser?.user_id], // Usamos user_id, no id del perfil
    queryFn: async () => {
      if (!selectedUser) return null;
      const currentYear = new Date().getFullYear();

      const { data, error } = await (supabase as any)
        .from('vacation_balances')
        .select('*')
        .eq('user_id', selectedUser.user_id) // Relación correcta con user_id
        .eq('year', currentYear)
        .maybeSingle();

      // Si no hay balance, devolvemos uno por defecto pero limpio
      if (error) throw error;
      // Nota: Verifica si tu tabla usa 'available_days' o 'remaining_days'. 
      // En tu SQL anterior era 'available_days', así que mapeamos eso.
      return data || { total_days: 12, used_days: 0, available_days: 12 };
    },
    enabled: !!selectedUser,
  });

  const form = useForm<VacationFormData>({
    resolver: zodResolver(vacationSchema),
    defaultValues: {
      start_date: '',
      end_date: '',
      reason: '',
    },
  });

  const calculateDays = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const mutation = useMutation({
    mutationFn: async (data: VacationFormData) => {
      if (!selectedUser) throw new Error('Debes seleccionar un usuario primero');

      // 1. Cálculos previos
      const days = calculateDays(data.start_date, data.end_date);
      const currentAvailable = balance?.available_days ?? 12;

      // 2. VALIDACIÓN ESTRICTA: Si intenta pedir más de lo que tiene
      if (balance && days > currentAvailable) {
        throw new Error(`El usuario no tiene suficientes días. Solicitados: ${days}, Disponibles: ${currentAvailable}`);
      }

      // 3. PASO A: Insertar la solicitud (Como ya lo tenías)
      const { error: requestError } = await (supabase as any)
        .from('vacation_requests')
        .insert([{
          user_id: selectedUser.user_id,
          start_date: data.start_date,
          end_date: data.end_date,
          days_requested: days,
          employee_note: data.reason,
          status: 'pending',
        }]);
      if (requestError) throw requestError;

    },
    onSuccess: () => {
      // Al invalidar, React Query volverá a pedir los datos y la UI se actualizará sola
      queryClient.invalidateQueries({ queryKey: ['vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['vacation-balances'] });

      toast.success(`Solicitud generada como pendiente para ${selectedUser?.full_name}`);
      form.reset();
      onBack();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al enviar solicitud');
    },
  });
  // --- MUTACIÓN PARA APROBACIÓN (ESTE BLOQUE DEBE ESTAR AL MISMO NIVEL) ---
  // NOTA: Esta función DEBE ser llamada desde la vista de Administración/RRHH. 
  // Asume que el Trigger de PostgreSQL se encargará del descuento del saldo.
  const approvalMutation = useMutation({
    mutationFn: async ({ requestId, daysRequested, userId }: { requestId: string, daysRequested: number, userId: string }) => {
      // 1. Actualizar el estado de la solicitud a 'approved'
      const { error } = await (supabase as any)
        .from('vacation_requests')
        .update({ status: 'approved', approval_date: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      // Si NO usas un Trigger SQL, aquí iría el código para actualizar la tabla 'vacation_balances'
      // Pero si usas el Trigger, Supabase lo hace automáticamente después de este update.
    },
    onSuccess: () => {
      // Recargar la lista de solicitudes y el balance del usuario
      queryClient.invalidateQueries({ queryKey: ['vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['vacation-balances'] });
      toast.success("Solicitud aprobada y saldo actualizado.");
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al aprobar solicitud');
    },
  });
  const handleSelectUser = (user: Profile) => {
    setSelectedUser(user);
    setSearchTerm('');
    setIsSearching(false);
    form.reset();
  };

  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');
  const requestedDays = startDate && endDate ? calculateDays(startDate, endDate) : 0;

  // Helper para mostrar días disponibles seguro
  const diasDisponibles = balance?.available_days ?? 12;

  // Helper para obtener iniciales del nombre completo
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Botón Volver */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" onClick={onBack} className="pl-0 hover:pl-2 transition-all">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Dashboard
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Solicitud de Vacaciones</h1>
        <p className="text-muted-foreground">
          Generar solicitud de vacaciones del Empleado.
        </p>
      </div>

      {/* --- BUSCADOR DE USUARIO --- */}
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" /> Buscar Colaborador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearching(true);
              }}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

            {/* Lista de resultados flotante */}
            {isSearching && searchTerm.length >= 2 && searchResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg dark:bg-slate-900">
                {searchResults.map((profile) => (
                  <div
                    key={profile.id}
                    className="p-3 hover:bg-muted cursor-pointer flex items-center gap-3 transition-colors"
                    onClick={() => handleSelectUser(profile)}
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                      {getInitials(profile.full_name)}
                    </div>
                    <div>
                      {/* CAMBIO: Mostrar full_name */}
                      <p className="text-sm font-medium">{profile.full_name}</p>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Mensaje si no hay resultados */}
            {isSearching && searchTerm.length >= 2 && searchResults?.length === 0 && (
              <div className="absolute z-10 w-full mt-1 p-3 bg-white border rounded-md shadow-lg text-sm text-muted-foreground">
                No se encontraron colaboradores.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedUser ? (
        <>
          {/* --- DATOS DEL USUARIO SELECCIONADO --- */}
          <Card>
            <CardHeader className="pb-3 bg-muted/40">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-600" />
                Datos del Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Nombre Completo</label>
                  {/* CAMBIO: Mostrar full_name */}
                  <Input value={selectedUser.full_name} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input value={selectedUser.email || 'No registrado'} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Departamento / Área</label>
                  <Input value={selectedUser.department || 'General'} disabled className="bg-muted/50" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- STATS DE BALANCES --- */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Días Totales</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Nota: Asumo 12 días base si no hay dato, ajústalo según tu ley */}
                <p className="text-2xl font-bold">{balance?.total_days || 12}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Días Usados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{balance?.used_days || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Días Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                {/* CAMBIO: available_days según tu SQL */}
                <p className="text-2xl font-bold text-green-600">{diasDisponibles}</p>
              </CardContent>
            </Card>
          </div>

          {/* --- FORMULARIO DE SOLICITUD --- */}
          <Card>
            <CardHeader>
              <CardTitle>Nueva Solicitud</CardTitle>
              <CardDescription>
                Completar detalles para generar la solicitud de vacaciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
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
                          <FormLabel>Fecha de Fin *</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {requestedDays > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">
                        Días solicitados: <strong>{requestedDays}</strong>
                        {requestedDays > diasDisponibles && (
                          <span className="text-destructive ml-2 font-medium">
                            (Excede días disponibles: {diasDisponibles})
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo (opcional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder="Describe el motivo de la solicitud..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onBack}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={mutation.isPending || (requestedDays > diasDisponibles)}>
                      {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generar Solicitud
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
          <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Ningún usuario seleccionado</h3>
          <p className="mt-1 text-sm text-muted-foreground">Busca y selecciona un colaborador para gestionar sus vacaciones.</p>
        </div>
      )}
    </div>
  );
}

export default VacationRequest;