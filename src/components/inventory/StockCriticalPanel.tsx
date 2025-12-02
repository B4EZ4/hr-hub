import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-with-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function StockCriticalPanel() {
  const navigate = useNavigate();

  const { data: criticalItems = [], isLoading } = useQuery({
    queryKey: ['inventory-critical'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inventory_items')
        .select('*')
        .order('stock_quantity', { ascending: true });

      if (error) throw error;

      // Filtrar items críticos en el cliente (stock <= min_stock)
      const filtered = (data || []).filter((item: any) =>
        item.stock_quantity <= (item.min_stock || 0)
      );

      return filtered;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Stock Crítico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (criticalItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Stock Crítico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay artículos con stock crítico. ¡Todos los ítems están bien abastecidos!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Stock Crítico
          <Badge variant="destructive">{criticalItems.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          Los siguientes artículos necesitan reabastecimiento urgente:
        </p>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {criticalItems.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => {
                const basePath = window.location.pathname.startsWith('/seguridad-higiene')
                  ? '/seguridad-higiene/inventario'
                  : '/inventario';
                navigate(`${basePath}/${item.id}/edit`);
              }}
            >
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.category}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    Stock: <span className="text-destructive">{item.stock_quantity}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mín: {item.min_stock}
                  </p>
                </div>
                {item.stock_quantity === 0 && (
                  <Badge variant="destructive">AGOTADO</Badge>
                )}
                {item.stock_quantity > 0 && item.stock_quantity <= item.min_stock && (
                  <Badge variant="default">BAJO</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
