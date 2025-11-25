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
import { Loader2, Calendar, Search, User, UserCheck } from 'lucide-react';

// --- Esquema de validación ---
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
});

type VacationFormData = z.infer<typeof vacationSchema>;

// --- Tipos para el usuario ---
type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  department?: string; // Asumiendo que existe este campo
};

export default function VacationRequest() {
  const queryClient = useQueryClient();

  // Estados para la búsqueda y selección de usuario
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // 1. Query para buscar usuarios (Profiles)
  const { data: searchResults } = useQuery({
    queryKey: ['profile-search', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2) return [];

      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(5);

      if (error) throw error;
      return data as Profile[];
    },
    enabled: searchTerm.length >= 2 && isSearching,
  });

  // 2. Query de balance (Depende del usuario SELECCIONADO, no del logueado)
  const { data: balance } = useQuery({
    queryKey: ['vacation-balance', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return null;
      const currentYear = new Date().getFullYear();
      const { data, error } = await (supabase as any)
        .from('vacation_balances')
        .select('*')
        .eq('user_id', selectedUser.id)
        .eq('year', currentYear)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || { total_days: 22, used_days: 0, remaining_days: 22 };
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

      const days = calculateDays(data.start_date, data.end_date);

      if (balance && days > balance.remaining_days) {
        throw new Error(`El usuario no tiene suficientes días disponibles. Disponibles: ${balance.remaining_days}`);
      }

      const { error } = await (supabase as any)
        .from('vacation_requests')
        .insert([{
          user_id: selectedUser.id, // Usamos el ID del usuario seleccionado
          start_date: data.start_date,
          end_date: data.end_date,
          days_requested: days,
          reason: data.reason,
          status: 'pendiente', // O 'aprobado' si lo hace RRHH directamente
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['vacation-balance'] });
      toast.success(`Solicitud generada para ${selectedUser?.first_name}`);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al enviar solicitud');
    },
  });

  const handleSelectUser = (user: Profile) => {
    setSelectedUser(user);
    setSearchTerm('');
    setIsSearching(false);
    form.reset(); // Reiniciar formulario al cambiar de usuario
  };

  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');
  const requestedDays = startDate && endDate ? calculateDays(startDate, endDate) : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Vacaciones</h1>
        <p className="text-muted-foreground">
          Generar solicitud y consultar balances de colaboradores.
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
                      {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{profile.first_name} {profile.last_name}</p>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                ))}
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
                  <Input value={`${selectedUser.first_name} ${selectedUser.last_name}`} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input value={selectedUser.email || 'No registrado'} disabled className="bg-muted/50" />
                </div>
                {/* Campo opcional si tu tabla profiles tiene departamento */}
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
                <p className="text-2xl font-bold">{balance?.total_days || 22}</p>
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
                <p className="text-2xl font-bold text-green-600">{balance?.remaining_days || 22}</p>
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
                        {balance && requestedDays > balance.remaining_days && (
                          <span className="text-destructive ml-2 font-medium">
                            (Excede días disponibles: {balance.remaining_days})
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

                  <Button type="submit" disabled={mutation.isPending || (balance ? requestedDays > balance.remaining_days : false)}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generar Solicitud
                  </Button>
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