import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Package, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';

export default function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManageSH } = useRoles();

  const { data: item, isLoading } = useQuery({
    queryKey: ['inventory-item', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['inventory-movements', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('item_id', id)
        .order('movement_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: maintenances = [] } = useQuery({
    queryKey: ['item-maintenances', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_maintenance')
        .select('*')
        .eq('item_id', id)
        .order('scheduled_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
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

  const movementTypeMap: Record<string, { label: string; icon: any }> = {
    entrada: { label: 'Entrada', icon: TrendingUp },
    salida: { label: 'Salida', icon: TrendingDown },
    ajuste: { label: 'Ajuste', icon: Package },
    asignacion: { label: 'Asignación', icon: Package },
    devolucion: { label: 'Devolución', icon: TrendingUp },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Ítem no encontrado</h2>
        <Button onClick={() => navigate('/seguridad-higiene/inventario')}>
          Volver al Inventario
        </Button>
      </div>
    );
  }

  const status = statusMap[item.status] || { label: item.status, variant: 'default' };
  const isLowStock = item.stock_quantity <= item.min_stock;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/inventario')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              {item.name}
            </h1>
            <p className="text-muted-foreground">{categoryMap[item.category]}</p>
          </div>
        </div>
        {canManageSH && (
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/seguridad-higiene/inventario/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="outline" onClick={() => navigate(`/seguridad-higiene/inventario/${id}/ajustar`)}>
              Ajustar Stock
            </Button>
          </div>
        )}
      </div>

      {isLowStock && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">Stock Bajo</h3>
                <p className="text-sm text-muted-foreground">
                  El stock actual ({item.stock_quantity}) está por debajo del mínimo requerido ({item.min_stock})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <div className="mt-1">
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Categoría</label>
              <p className="mt-1 font-medium">{categoryMap[item.category]}</p>
            </div>

            {item.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                <p className="mt-1">{item.description}</p>
              </div>
            )}

            {item.location && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
                <p className="mt-1 font-medium">{item.location}</p>
              </div>
            )}

            {item.unit_price && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Precio Unitario</label>
                <p className="mt-1 font-medium text-lg">
                  ${item.unit_price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Control de Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Stock Actual</label>
              <p className={`mt-1 text-3xl font-bold ${isLowStock ? 'text-destructive' : ''}`}>
                {item.stock_quantity}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Stock Mínimo</label>
              <p className="mt-1 text-xl font-medium">{item.min_stock}</p>
            </div>

            {item.stock_quantity > 0 && item.unit_price && (
              <div className="pt-2 border-t">
                <label className="text-sm font-medium text-muted-foreground">Valor Total en Stock</label>
                <p className="mt-1 text-xl font-bold">
                  ${(item.stock_quantity * item.unit_price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {movements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Movimientos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {movements.map((movement: any) => {
                const type = movementTypeMap[movement.movement_type] || { label: movement.movement_type, icon: Package };
                const Icon = type.icon;
                return (
                  <div key={movement.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(movement.movement_date).toLocaleString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {movement.movement_type === 'entrada' || movement.movement_type === 'devolucion' ? '+' : '-'}
                        {movement.quantity}
                      </p>
                      {movement.observations && (
                        <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {movement.observations}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {maintenances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mantenimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {maintenances.map((maintenance: any) => (
                <div
                  key={maintenance.id}
                  className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-accent"
                  onClick={() => navigate(`/seguridad-higiene/mantenimientos/${maintenance.id}`)}
                >
                  <div>
                    <p className="font-medium capitalize">{maintenance.maintenance_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {maintenance.scheduled_date
                        ? new Date(maintenance.scheduled_date).toLocaleDateString('es-ES')
                        : 'Sin fecha'}
                    </p>
                  </div>
                  <Badge variant={maintenance.status === 'completado' ? 'success' : 'default'}>
                    {maintenance.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
