import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function AlertsList() {
  const navigate = useNavigate();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inventory_alerts')
        .select(`
          *,
          item:item_id (name, category)
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const severityMap: Record<string, { label: string; variant: any }> = {
    baja: { label: 'Baja', variant: 'default' },
    media: { label: 'Media', variant: 'default' },
    alta: { label: 'Alta', variant: 'destructive' },
    critica: { label: 'Crítica', variant: 'destructive' },
  };

  const typeMap: Record<string, string> = {
    stock_bajo: 'Stock Bajo',
    caducidad_proxima: 'Caducidad Próxima',
    mantenimiento_pendiente: 'Mantenimiento Pendiente',
    revision_requerida: 'Revisión Requerida',
  };

  const columns = [
    {
      header: 'Severidad',
      accessorKey: 'severity',
      cell: (value: string) => {
        const severity = severityMap[value] || { label: value, variant: 'default' };
        return <Badge variant={severity.variant}>{severity.label}</Badge>;
      },
    },
    {
      header: 'Tipo',
      accessorKey: 'alert_type',
      cell: (value: string) => typeMap[value] || value,
    },
    {
      header: 'Ítem',
      accessorKey: 'item',
      cell: (value: any) => value?.name || '-',
    },
    {
      header: 'Título',
      accessorKey: 'title',
    },
    {
      header: 'Fecha',
      accessorKey: 'created_at',
      cell: (value: string) => new Date(value).toLocaleDateString('es-ES'),
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              Alertas Activas
            </h1>
            <p className="text-muted-foreground">Alertas de inventario y mantenimiento</p>
          </div>
        </div>
      </div>

      <DataTable
        data={alerts}
        columns={columns}
        searchable
        searchPlaceholder="Buscar alertas..."
        emptyMessage="No hay alertas activas."
      />
    </div>
  );
}