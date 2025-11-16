import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, ArrowLeft } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';

export default function SectorsList() {
  const navigate = useNavigate();
  const { canManageSH } = useRoles();

  const { data: sectors = [], isLoading } = useQuery({
    queryKey: ['sh-sectors'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sh_sectors')
        .select(`
          *,
          responsible:responsible_id (full_name)
        `)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const riskMap: Record<string, { label: string; variant: any }> = {
    bajo: { label: 'Bajo', variant: 'success' },
    medio: { label: 'Medio', variant: 'default' },
    alto: { label: 'Alto', variant: 'destructive' },
  };

  const columns = [
    {
      header: 'Nombre',
      accessorKey: 'name',
    },
    {
      header: 'Descripción',
      accessorKey: 'description',
      cell: (value: string) => value || '-',
    },
    {
      header: 'Nivel de Riesgo',
      accessorKey: 'risk_level',
      cell: (value: string) => {
        const risk = riskMap[value] || { label: value, variant: 'default' };
        return <Badge variant={risk.variant}>{risk.label}</Badge>;
      },
    },
    {
      header: 'Responsable',
      accessorKey: 'responsible',
      cell: (value: any) => value?.full_name || 'Sin asignar',
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
            <h1 className="text-3xl font-bold tracking-tight">Sectores</h1>
            <p className="text-muted-foreground">Gestión de sectores de seguridad e higiene</p>
          </div>
        </div>
        {canManageSH && (
          <Button onClick={() => navigate('/seguridad-higiene/sectores/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Sector
          </Button>
        )}
      </div>

      <DataTable
        data={sectors}
        columns={columns}
        searchable
        searchPlaceholder="Buscar sectores..."
        emptyMessage="No hay sectores registrados."
        onRowClick={(row) => navigate(`/seguridad-higiene/sectores/${row.id}/edit`)}
        actions={(row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/seguridad-higiene/sectores/${row.id}/edit`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver
          </Button>
        )}
      />
    </div>
  );
}
