import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { Loader2 } from 'lucide-react';
import { BiometricStatus } from '@/components/users/BiometricStatus';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManageUsers } = useRoles();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
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
        .maybeSingle();

      if (roleError) console.log('No role found for user');

      // Obtener datos del perfil (areas y posiciones)
      const { data: profileData } = await (supabase as any)
        .from('profiles')
        .select('*, areas(name), positions(title)')
        .eq('user_id', id)
        .single();

      return {
        ...userData,
        role: roleData?.role || 'admin_rrhh',
        department: profileData?.areas?.name || userData.department,
        position: profileData?.positions?.title || userData.position,
      };
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
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nombre de Usuario</p>
                <p className="font-medium">{user.username}</p>
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

            <div className="flex items-center gap-3">
              <Badge variant={user.role === 'superadmin' ? 'success' : 'default'}>
                {user.role === 'superadmin' ? 'Administrador' : 'RH'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
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

            {user.position && (
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Posición</p>
                  <p className="font-medium">{user.position}</p>
                </div>
              </div>
            )}

            {user.last_login_at && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Último Acceso</p>
                  <p className="font-medium">{new Date(user.last_login_at).toLocaleString('es-ES')}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Creado</p>
                <p className="font-medium">{new Date(user.created_at).toLocaleDateString('es-ES')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
