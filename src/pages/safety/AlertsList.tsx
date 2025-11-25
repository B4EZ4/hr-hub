import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, AlertTriangle, CheckCircle2, Eye, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function AlertsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: async () => {
      const { data: alertsData, error } = await supabase
        .from('inventory_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener items relacionados
      const itemIds = alertsData?.map(a => a.item_id).filter(Boolean) || [];
      let itemsMap: Record<string, any> = {};
      
      if (itemIds.length > 0) {
        const { data: items } = await supabase
          .from('inventory_items')
          .select('id, name, category, stock_quantity, min_stock, location')
          .in('id', itemIds);

        itemsMap = (items || []).reduce((acc: any, item: any) => {
          acc[item.id] = item;
          return acc;
        }, {});
      }

      return (alertsData || []).map(alert => ({
        ...alert,
        item: alert.item_id ? itemsMap[alert.item_id] : null,
      }));
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id 
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
      toast.success('Alerta marcada como resuelta');
      setSelectedAlert(null);
    },
    onError: () => {
      toast.error('Error al resolver la alerta');
    },
  });

  const severityMap: Record<string, { label: string; variant: any; color: string }> = {
    baja: { label: 'Baja', variant: 'default', color: 'text-blue-600' },
    media: { label: 'Media', variant: 'default', color: 'text-yellow-600' },
    alta: { label: 'Alta', variant: 'destructive', color: 'text-orange-600' },
    critica: { label: 'Crítica', variant: 'destructive', color: 'text-red-600' },
  };

  const typeMap: Record<string, { label: string; description: string }> = {
    stock_bajo: { 
      label: 'Stock Bajo', 
      description: 'El nivel de inventario está por debajo del mínimo requerido' 
    },
    caducidad_proxima: { 
      label: 'Caducidad Próxima', 
      description: 'Producto próximo a vencer, requiere atención inmediata' 
    },
    mantenimiento_pendiente: { 
      label: 'Mantenimiento Pendiente', 
      description: 'Equipo requiere mantenimiento programado' 
    },
    revision_requerida: { 
      label: 'Revisión Requerida', 
      description: 'El ítem requiere inspección o verificación' 
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
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
              <p className="text-muted-foreground">
                {alerts.length} {alerts.length === 1 ? 'alerta activa' : 'alertas activas'}
              </p>
            </div>
          </div>
        </div>

        {alerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-16 w-16 text-success mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay alertas activas</h3>
              <p className="text-muted-foreground text-center">
                Todos los ítems del inventario están en condiciones normales
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {alerts.map((alert: any) => {
              const severity = severityMap[alert.severity] || severityMap.media;
              const alertType = typeMap[alert.alert_type] || { label: alert.alert_type, description: '' };
              
              return (
                <Card 
                  key={alert.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={severity.variant}>{severity.label}</Badge>
                          <Badge variant="outline">{alertType.label}</Badge>
                        </div>
                        <CardTitle className="text-lg mt-2">{alert.title}</CardTitle>
                        <CardDescription>{alert.description}</CardDescription>
                      </div>
                      <AlertTriangle className={`h-6 w-6 ${severity.color} flex-shrink-0 ml-4`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          <span>{alert.item?.name}</span>
                        </div>
                        <span>•</span>
                        <span>{new Date(alert.created_at).toLocaleDateString('es-ES')}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlert(alert);
                      }}>
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-6 w-6 ${selectedAlert ? severityMap[selectedAlert.severity]?.color : ''}`} />
              Detalle de Alerta
            </DialogTitle>
          </DialogHeader>
          
          {selectedAlert && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                <div>
                  <div className="flex gap-2 mb-3">
                    <Badge variant={severityMap[selectedAlert.severity]?.variant}>
                      {severityMap[selectedAlert.severity]?.label}
                    </Badge>
                    <Badge variant="outline">
                      {typeMap[selectedAlert.alert_type]?.label || selectedAlert.alert_type}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{selectedAlert.title}</h3>
                  <p className="text-muted-foreground">{selectedAlert.description}</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Información del Ítem</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                      <p className="text-base font-medium">{selectedAlert.item?.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Categoría</label>
                        <p className="capitalize">{selectedAlert.item?.category}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
                        <p>{selectedAlert.item?.location || 'No especificada'}</p>
                      </div>
                    </div>
                    {selectedAlert.alert_type === 'stock_bajo' && (
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Stock Actual</label>
                          <p className="text-lg font-bold text-destructive">{selectedAlert.item?.stock_quantity}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Mínimo Requerido</label>
                          <p className="text-lg font-bold">{selectedAlert.item?.min_stock}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha de Alerta</label>
                  <p>{new Date(selectedAlert.created_at).toLocaleString('es-ES')}</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => navigate(`/seguridad-higiene/inventario/${selectedAlert.item?.id}`)}
                    variant="outline"
                    className="flex-1"
                  >
                    Ver Ítem
                  </Button>
                  <Button
                    onClick={() => resolveAlertMutation.mutate(selectedAlert.id)}
                    disabled={resolveAlertMutation.isPending}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar como Resuelta
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}