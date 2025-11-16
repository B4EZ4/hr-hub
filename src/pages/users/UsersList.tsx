import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Pencil } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function UsersList() {
  const navigate = useNavigate();
  const { canManageUsers } = useRoles();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const columns = [
    {
      header: 'Nombre',
      accessorKey: 'full_name' as const,
    },
    {
      header: 'Email',
      accessorKey: 'email' as const,
    },
    {
      header: 'Departamento',
      accessorKey: 'department' as const,
    },
    {
      header: 'Posición',
      accessorKey: 'position' as const,
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
                <DropdownMenuItem onClick={() => navigate(`/usuarios/${row.id}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
    </div>
  );
}
