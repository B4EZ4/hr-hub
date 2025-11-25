import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Eye, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
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
  const { canManageSH } = useRoles();
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const statusMap: Record<string, { label: string; variant: any }> = {
    disponible: { label: 'Disponible', variant: 'success' },
    asignado: { label: 'Asignado', variant: 'default' },
    mantenimiento: { label: 'En Mantenimiento', variant: 'default' },
    baja: { label: 'Dado de Baja', variant: 'outline' },
  };

  const categoryMap: Record<string, string> = {
    epp: 'EPP',
    herramienta: 'Herramienta',
    equipo: 'Equipo',
    limpieza: 'Limpieza',
    otro: 'Otro',
  };

  const lowStockItems = items.filter(
    (item: any) => item.stock_quantity <= item.min_stock
  );

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
        const isLow = value <= row.min_stock;
        return (
          <div className="flex items-center gap-2">
            <span className={isLow ? 'text-destructive font-bold' : ''}>{value}</span>
            {isLow && <AlertTriangle className="h-4 w-4 text-destructive" />}
          </div>
        );
      },
    },
    {
      header: 'Ubicación',
      accessorKey: 'location',
      cell: (value: string) => value || '-',
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: (value: string) => {
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Inventario de S&H
          </h1>
          <p className="text-muted-foreground">
            Gestión de equipos, EPP y herramientas de seguridad
          </p>
        </div>
        <Button
          onClick={() => navigate('/seguridad-higiene/inventario/new')}
          disabled={!canManageSH}
          title={canManageSH ? undefined : 'Requiere rol Oficial S&H o Superadmin'}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Ítem
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-destructive">
                Alertas de Stock Bajo
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {lowStockItems.length} ítem(s) con stock crítico o por debajo del mínimo
            </p>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={items}
        columns={columns}
        searchable
        searchPlaceholder="Buscar ítems..."
        emptyMessage="No hay ítems en el inventario."
        onRowClick={(row) => navigate(`/seguridad-higiene/inventario/${row.id}`)}
        actions={(row) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/seguridad-higiene/inventario/${row.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver
            </Button>
            {canManageSH && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/seguridad-higiene/inventario/${row.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
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
              </>
            )}
          </div>
        )}
      />
    </div>
  );
}
