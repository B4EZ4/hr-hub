import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Package } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';

export default function InventoryHistory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ['inventory-item', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inventory_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: movements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ['inventory-movements', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inventory_movements')
        .select(`
          *,
          user:user_id (full_name),
          authorized:authorized_by (full_name)
        `)
        .eq('item_id', id)
        .order('movement_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['inventory-assignments', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inventory_assignments')
        .select(`
          *,
          user:user_id (full_name)
        `)
        .eq('item_id', id)
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: maintenances = [], isLoading: maintenancesLoading } = useQuery({
    queryKey: ['inventory-maintenance-history', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inventory_maintenance')
        .select(`
          *,
          performer:performed_by (full_name)
        `)
        .eq('item_id', id)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: states = [], isLoading: statesLoading } = useQuery({
    queryKey: ['inventory-states', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inventory_item_states')
        .select(`
          *,
          changer:changed_by (full_name)
        `)
        .eq('item_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const movementTypeMap: Record<string, string> = {
    entrada: 'Entrada',
    salida: 'Salida',
    ajuste: 'Ajuste',
    asignacion: 'Asignación',
    devolucion: 'Devolución',
    baja: 'Baja',
  };

  const movementColumns = [
    {
      header: 'Fecha',
      accessorKey: 'movement_date',
      cell: (value: string) => new Date(value).toLocaleString('es-ES'),
    },
    {
      header: 'Tipo',
      accessorKey: 'movement_type',
      cell: (value: string) => movementTypeMap[value] || value,
    },
    {
      header: 'Cantidad',
      accessorKey: 'quantity',
      cell: (value: number, row: any) => (
        <span className={row.movement_type === 'salida' ? 'text-destructive' : 'text-success'}>
          {row.movement_type === 'salida' ? '-' : '+'}{value}
        </span>
      ),
    },
    {
      header: 'Usuario',
      accessorKey: 'user',
      cell: (value: any) => value?.full_name || '-',
    },
    {
      header: 'Observaciones',
      accessorKey: 'observations',
      cell: (value: string) => value || '-',
    },
  ];

  const assignmentColumns = [
    {
      header: 'Fecha Asignación',
      accessorKey: 'assigned_date',
      cell: (value: string) => new Date(value).toLocaleDateString('es-ES'),
    },
    {
      header: 'Usuario',
      accessorKey: 'user',
      cell: (value: any) => value?.full_name || '-',
    },
    {
      header: 'Cantidad',
      accessorKey: 'quantity',
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: (value: string) => {
        const variants: Record<string, any> = {
          asignado: 'default',
          devuelto: 'success',
          perdido: 'destructive',
        };
        return <Badge variant={variants[value] || 'default'}>{value}</Badge>;
      },
    },
    {
      header: 'Fecha Devolución',
      accessorKey: 'return_date',
      cell: (value: string) => value ? new Date(value).toLocaleDateString('es-ES') : 'Pendiente',
    },
  ];

  const maintenanceColumns = [
    {
      header: 'Fecha Programada',
      accessorKey: 'scheduled_date',
      cell: (value: string) => value ? new Date(value).toLocaleDateString('es-ES') : '-',
    },
    {
      header: 'Tipo',
      accessorKey: 'maintenance_type',
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: (value: string) => {
        const variants: Record<string, any> = {
          pendiente: 'default',
          en_proceso: 'default',
          completado: 'success',
          cancelado: 'outline',
        };
        return <Badge variant={variants[value] || 'default'}>{value}</Badge>;
      },
    },
    {
      header: 'Costo',
      accessorKey: 'cost',
      cell: (value: number) => value ? `$${value.toFixed(2)}` : '-',
    },
  ];

  const stateColumns = [
    {
      header: 'Fecha',
      accessorKey: 'created_at',
      cell: (value: string) => new Date(value).toLocaleString('es-ES'),
    },
    {
      header: 'Estado Anterior',
      accessorKey: 'previous_state',
      cell: (value: string) => value || '-',
    },
    {
      header: 'Nuevo Estado',
      accessorKey: 'state',
    },
    {
      header: 'Motivo',
      accessorKey: 'change_reason',
      cell: (value: string) => value || '-',
    },
    {
      header: 'Responsable',
      accessorKey: 'changer',
      cell: (value: any) => value?.full_name || '-',
    },
  ];

  const isLoading = itemLoading || movementsLoading || assignmentsLoading || maintenancesLoading || statesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/seguridad-higiene/inventario/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial de Ítem</h1>
          <p className="text-muted-foreground">{item?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimientos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movements.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignaciones</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mantenimientos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenances.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={movements}
            columns={movementColumns}
            emptyMessage="No hay movimientos registrados."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asignaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={assignments}
            columns={assignmentColumns}
            emptyMessage="No hay asignaciones registradas."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mantenimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={maintenances}
            columns={maintenanceColumns}
            emptyMessage="No hay mantenimientos registrados."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambios de Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={states}
            columns={stateColumns}
            emptyMessage="No hay cambios de estado registrados."
          />
        </CardContent>
      </Card>
    </div>
  );
}
