import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, Package } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { StockCriticalPanel } from '@/components/inventory/StockCriticalPanel';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function InventoryList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { canManageUsers } = useRoles();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('inventory_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Ítem eliminado correctamente');
    },
    onError: (error: any) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inventory_items')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const categoryMap: Record<string, string> = {
    epp: 'EPP',
    herramienta: 'Herramienta',
    equipo: 'Equipo',
    otro: 'Otro',
  };

  const columns = [
    {
      header: 'Nombre',
      accessorKey: 'name',
    },
    {
      header: 'Categoría',
      accessorKey: 'category',
      cell: (value: string) => categoryMap[value] || value,
    },
    {
      header: 'Stock',
      accessorKey: 'stock_quantity',
      cell: (value: number, row: any) => {
        const isLow = row.min_stock && value <= row.min_stock;
        return (
          <div className="flex items-center gap-2">
            <span>{value}</span>
            {isLow && <Badge variant="destructive">Bajo</Badge>}
          </div>
        );
      },
    },
    {
      header: 'Mín. Stock',
      accessorKey: 'min_stock',
    },

    {
      header: 'Ubicación',
      accessorKey: 'location',
      cell: (value: string) => value || '-',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  const basePath = location.pathname.startsWith('/seguridad-higiene') ? '/seguridad-higiene/inventario' : '/inventario';
  return (
    <div className="space-y-6">
      <StockCriticalPanel />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {location.pathname.startsWith('/seguridad-higiene') ? 'Seguridad e Higiene - Inventario' : 'Inventario'}
          </h1>
          <p className="text-muted-foreground">Gestión de EPP, herramientas y equipos de seguridad</p>
        </div>
        {location.pathname.startsWith('/seguridad-higiene') ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`${basePath}/asignar`)}
              disabled={!canManageUsers}
              title={canManageUsers ? undefined : 'Requiere rol Admin RRHH o Superadmin'}
            >
              <Package className="mr-2 h-4 w-4" />
              Asignar Inventario
            </Button>
            <Button
              onClick={() => navigate(`${basePath}/new`)}
              size="lg"
              className="font-semibold"
              disabled={!canManageUsers}
              title={canManageUsers ? undefined : 'Requiere rol Admin RRHH o Superadmin'}
            >
              <Plus className="mr-2 h-5 w-5" />
              Agregar Ítem
            </Button>
          </div>
        ) : (
          canManageUsers && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`${basePath}/asignar`)}>
                <Package className="mr-2 h-4 w-4" />
                Asignar Inventario
              </Button>
              <Button onClick={() => navigate(`${basePath}/new`)} size="lg" className="font-semibold">
                <Plus className="mr-2 h-5 w-5" />
                Agregar Ítem
              </Button>
            </div>
          )
        )}
      </div>

      <DataTable
        data={items}
        columns={columns}
        searchable
        searchPlaceholder="Buscar artículos..."
        emptyMessage="No hay artículos en inventario."
        onRowClick={(row) => navigate(`${basePath}/${row.id}/edit`)}
        actions={(row) => (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/${row.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`${basePath}/${row.id}/asignar`)}
              disabled={!canManageUsers}
              title={canManageUsers ? undefined : 'Requiere rol Admin RRHH o Superadmin'}
            >
              <Package className="mr-2 h-4 w-4" />
              Asignar
            </Button>
            {canManageUsers && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar ítem?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente el ítem del inventario.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate(row.id)}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      />
    </div>
  );
}
