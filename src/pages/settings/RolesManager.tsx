import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const roleLabels: Record<string, string> = {
  superadmin: 'Super Administrador',
  admin_rrhh: 'Admin RRHH',
  manager: 'Manager',
  empleado: 'Empleado',
  oficial_sh: 'Oficial S&H',
  auditor: 'Auditor',
};

const roleColors: Record<string, any> = {
  superadmin: 'destructive',
  admin_rrhh: 'default',
  manager: 'default',
  empleado: 'outline',
  oficial_sh: 'default',
  auditor: 'default',
};

export default function RolesManager() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select(`
          user_id,
          full_name,
          email,
          status
        `)
        .eq('status', 'activo')
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
  });

  const { data: userRoles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `);

      if (error) throw error;
      return data || [];
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser || !selectedRole) {
        throw new Error('Debe seleccionar un usuario y un rol');
      }

      const { error } = await (supabase as any)
        .from('user_roles')
        .insert({ user_id: selectedUser, role: selectedRole });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      toast.success('Rol asignado correctamente');
      setSelectedUser('');
      setSelectedRole('');
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al asignar rol');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await (supabase as any)
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      toast.success('Rol eliminado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar rol');
    },
  });

  const groupedRoles = userRoles.reduce((acc: any, role: any) => {
    const userId = role.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        user: role.profiles,
        roles: [],
      };
    }
    acc[userId].roles.push(role);
    return acc;
  }, {});

  if (loadingUsers || loadingRoles) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Roles</h1>
          <p className="text-muted-foreground">Asignar y administrar roles de usuarios</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Asignar Rol
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Rol a Usuario</DialogTitle>
              <DialogDescription>
                Selecciona un usuario y el rol que deseas asignarle.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Usuario</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => addRoleMutation.mutate()}
                disabled={!selectedUser || !selectedRole || addRoleMutation.isPending}
                className="w-full"
              >
                {addRoleMutation.isPending ? 'Asignando...' : 'Asignar Rol'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {Object.values(groupedRoles).map((userGroup: any) => (
          <Card key={userGroup.user.user_id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCog className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">{userGroup.user.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{userGroup.user.email}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {userGroup.roles.map((role: any) => (
                  <div key={role.id} className="flex items-center gap-2">
                    <Badge variant={roleColors[role.role]}>
                      {roleLabels[role.role]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteRoleMutation.mutate(role.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(groupedRoles).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay roles asignados. Comienza asignando roles a los usuarios.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
