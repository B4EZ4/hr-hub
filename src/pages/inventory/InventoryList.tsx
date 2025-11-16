import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Package, Edit } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';

export default function InventoryList() {
  const navigate = useNavigate();
  const { canManageUsers } = useRoles();

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
      header: 'Precio Unit.',
      accessorKey: 'unit_price',
      cell: (value: number) => value ? `${value.toFixed(2)} €` : '-',
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">Gestión de EPP, herramientas y equipos</p>
        </div>
        {canManageUsers && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/inventario/asignar')}>
              <Package className="mr-2 h-4 w-4" />
              Asignar Inventario
            </Button>
            <Button onClick={() => navigate('/inventario/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Artículo
            </Button>
          </div>
        )}
      </div>

      <DataTable
        data={items}
        columns={columns}
        searchable
        searchPlaceholder="Buscar artículos..."
        emptyMessage="No hay artículos en inventario."
        onRowClick={(row) => navigate(`/inventario/${row.id}/edit`)}
        actions={(row) => (
          <Button variant="ghost" size="sm" onClick={() => navigate(`/inventario/${row.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}
      />
    </div>
  );
}
