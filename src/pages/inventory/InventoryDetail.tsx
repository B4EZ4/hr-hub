import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Package, MapPin, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { useRoles } from '@/hooks/useRoles';
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
import { useState } from 'react';
import { DataTable } from '@/components/shared/DataTable';

export default function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canManageUsers } = useRoles();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ['inventory-item', id],
    queryFn: async () => {
      if (!id || id === 'undefined') {
        return null;
      }
      
      const { data, error } = await (supabase as any)
        .from('inventory_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id && id !== 'undefined',
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['inventory-assignments', id],
    queryFn: async () => {
      if (!id || id === 'undefined') {
        return [];
      }
      
      const { data, error } = await (supabase as any)
        .from('inventory_assignments')
        .select(`
          *,
          profiles:user_id (full_name, department)
        `)
        .eq('item_id', id)
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id && id !== 'undefined',
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Artículo eliminado correctamente');
      navigate('/seguridad-higiene/inventario');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el artículo');
    },
  });

  const categoryMap: Record<string, string> = {
    epp: 'EPP',
    herramienta: 'Herramienta',
    equipo: 'Equipo',
    material: 'Material',
    otro: 'Otro',
  };

  const assignmentColumns = [
    {
      header: 'Empleado',
      accessorKey: 'profiles',
      cell: (value: any) => value?.full_name || '-',
    },
    {
      header: 'Departamento',
      accessorKey: 'profiles',
      cell: (value: any) => value?.department || '-',
    },
    {
      header: 'Cantidad',
      accessorKey: 'quantity',
    },
    {
      header: 'Fecha Asignación',
      accessorKey: 'assigned_date',
      cell: (value: string) => new Date(value).toLocaleDateString('es-ES'),
    },
    {
      header: 'Fecha Devolución',
      accessorKey: 'return_date',
      cell: (value: string) => value ? new Date(value).toLocaleDateString('es-ES') : 'Pendiente',
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
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/inventario')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Artículo no encontrado</h1>
        </div>
      </div>
    );
  }

  const stockStatus = item.stock_quantity <= item.min_stock ? 'crítico' : 'normal';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/inventario')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
              {stockStatus === 'crítico' && (
                <Badge variant="destructive">Stock Crítico</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{categoryMap[item.category] || item.category}</p>
          </div>
        </div>
        {canManageUsers && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/seguridad-higiene/inventario/${id}/historial`)}>
              Ver Historial
            </Button>
            <Button variant="outline" onClick={() => navigate(`/seguridad-higiene/inventario/${id}/ajustar`)}>
              Ajustar Stock
            </Button>
            <Button variant="outline" onClick={() => navigate(`/seguridad-higiene/inventario/${id}/asignar`)}>
              <Package className="mr-2 h-4 w-4" />
              Asignar
            </Button>
            <Button variant="outline" onClick={() => navigate(`/seguridad-higiene/mantenimientos/new?item=${id}`)}>
              Registrar Mantenimiento
            </Button>
            <Button variant="outline" onClick={() => navigate(`/seguridad-higiene/inventario/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Stock Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{item.stock_quantity}</span>
                <span className="text-muted-foreground">unidades</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Mínimo requerido: {item.min_stock}
              </div>
              {stockStatus === 'crítico' && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <TrendingDown className="h-4 w-4" />
                  <span>Reabastecer urgentemente</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{item.location || 'No especificada'}</p>
            <p className="text-sm text-muted-foreground mt-2">Estado: {item.status}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valor Unitario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">
                ${item.unit_price ? parseFloat(item.unit_price).toFixed(2) : '0.00'}
              </p>
              <p className="text-sm text-muted-foreground">
                Total en stock: ${item.unit_price ? (parseFloat(item.unit_price) * item.stock_quantity).toFixed(2) : '0.00'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {item.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{item.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historial de Asignaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length > 0 ? (
            <DataTable
              data={assignments}
              columns={assignmentColumns}
              searchable={false}
              emptyMessage="No hay asignaciones registradas"
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay asignaciones registradas para este artículo
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar artículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el artículo y todo su historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
