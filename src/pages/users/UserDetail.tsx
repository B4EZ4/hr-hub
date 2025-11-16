import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { Loader2 } from 'lucide-react';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManageUsers } = useRoles();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">Usuario no encontrado</p>
        <Button onClick={() => navigate('/usuarios')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'destructive' }> = {
    activo: { label: 'Activo', variant: 'success' },
    inactivo: { label: 'Inactivo', variant: 'default' },
    suspendido: { label: 'Suspendido', variant: 'destructive' },
  };

  const status = statusMap[user.status] || { label: user.status, variant: 'default' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/usuarios')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{user.full_name}</h1>
            <p className="text-muted-foreground">{user.position || 'Sin posición asignada'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          {canManageUsers && (
            <Button onClick={() => navigate(`/usuarios/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
            )}

            {user.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium">{user.address}</p>
                </div>
              </div>
            )}

            {user.birth_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                  <p className="font-medium">{new Date(user.birth_date).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información Laboral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.department && (
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Departamento</p>
                  <p className="font-medium">{user.department}</p>
                </div>
              </div>
            )}

            {user.hire_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Contratación</p>
                  <p className="font-medium">{new Date(user.hire_date).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {(user.emergency_contact_name || user.emergency_contact_phone) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Contacto de Emergencia</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {user.emergency_contact_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{user.emergency_contact_name}</p>
                </div>
              )}
              {user.emergency_contact_phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{user.emergency_contact_phone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
