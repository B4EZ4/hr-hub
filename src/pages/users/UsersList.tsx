import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { getSessionToken } from '@/lib/auth';
import { toast } from 'sonner';
import { Trash2, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Pencil } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function UsersList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canManageUsers } = useRoles();
  const [userToDelete, setUserToDelete] = React.useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [userToReset, setUserToReset] = React.useState<{ id: string; name: string } | null>(null);
  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState('');

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = getSessionToken();
      if (!token) throw new Error('No session token');

      const { data, error } = await supabase.rpc('delete_user_safe', {
        session_token: token,
        user_id_to_delete: userId
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar usuario');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado exitosamente');
      setShowDeleteDialog(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar usuario');
      setShowDeleteDialog(false);
      setUserToDelete(null);
    },
  });

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete);
    }
  };

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const token = getSessionToken();
      if (!token) throw new Error('No session token');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth?action=reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'x-session-token': token,
          },
          body: JSON.stringify({
            user_id: userId,
            new_password: password,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al restablecer contraseña');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('Contraseña restablecida exitosamente');
      setShowResetDialog(false);
      setUserToReset(null);
      setNewPassword('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al restablecer contraseña');
    },
  });

  const handleResetClick = (userId: string, userName: string) => {
    setUserToReset({ id: userId, name: userName });
    setShowResetDialog(true);
  };

  const handleResetConfirm = () => {
    if (userToReset && newPassword) {
      resetPasswordMutation.mutate({ userId: userToReset.id, password: newPassword });
    }
  };

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Consulta directa a la tabla users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      // Obtener roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Combinar usuarios con roles
      const usersWithRoles = (usersData || []).map((user: any) => {
        const userRole = rolesData?.find((r: any) => r.user_id === user.id);
        return {
          ...user,
          role: userRole?.role || 'admin_rrhh'
        };
      });

      return usersWithRoles;
    },
  });

  const columns = [
    {
      header: 'Nombre',
      accessorKey: 'full_name' as const,
    },
    {
      header: 'Usuario',
      accessorKey: 'username' as const,
    },
    {
      header: 'Email',
      accessorKey: 'email' as const,
    },
    {
      header: 'Teléfono',
      accessorKey: 'phone' as const,
    },
    {
      header: 'Rol',
      accessorKey: 'role' as const,
      cell: (value: string) => {
        const roleMap: Record<string, { label: string; variant: 'default' | 'success' }> = {
          superadmin: { label: 'Administrador', variant: 'success' },
          admin_rrhh: { label: 'RH', variant: 'default' },
        };
        const role = roleMap[value] || { label: value, variant: 'default' };
        return <Badge variant={role.variant}>{role.label}</Badge>;
      },
    },
    {
      header: 'Estado',
      accessorKey: 'status' as const,
      cell: (value: string) => {
        const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'destructive' }> = {
          activo: { label: 'Activo', variant: 'success' },
          inactivo: { label: 'Inactivo', variant: 'default' },
          suspendido: { label: 'Suspendido', variant: 'destructive' },
        };
        const status = statusMap[value] || { label: value, variant: 'default' };
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
  ];

  if (isLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de usuarios del sistema</p>
        </div>
        {canManageUsers && (
          <Button onClick={() => navigate('/usuarios/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      <DataTable
        data={users}
        columns={columns}
        searchable
        searchPlaceholder="Buscar usuarios..."
        emptyMessage="No hay usuarios registrados. Crea el primer usuario para comenzar."
        onRowClick={(row) => navigate(`/usuarios/${row.id}`)}
        actions={(row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Acciones
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              <DropdownMenuItem onClick={() => navigate(`/usuarios/${row.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </DropdownMenuItem>
              {canManageUsers && (
                <>
                  <DropdownMenuItem onClick={() => navigate(`/usuarios/${row.id}/edit`)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleResetClick(row.id, row.full_name)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Restablecer contraseña
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(row.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario será eliminado permanentemente del sistema junto con todos sus roles y sesiones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setUserToDelete(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogDescription>
              Asigna una nueva contraseña para {userToReset?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetDialog(false);
                setUserToReset(null);
                setNewPassword('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResetConfirm}
              disabled={!newPassword || newPassword.length < 8 || resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Restableciendo...' : 'Restablecer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
