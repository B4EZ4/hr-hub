import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';

export default function InspectionsList() {
  const navigate = useNavigate();
  const { canManageSH } = useRoles();

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['sh-inspections'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sh_inspections')
        .select(`
          *,
          sector:sector_id (name),
          inspector:inspector_id (full_name)
        `)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const statusMap: Record<string, { label: string; variant: any }> = {
    programada: { label: 'Programada', variant: 'default' },
    en_progreso: { label: 'En Progreso', variant: 'default' },
    completada: { label: 'Completada', variant: 'success' },
    cancelada: { label: 'Cancelada', variant: 'outline' },
  };

  const columns = [
    {
      header: 'Sector',
      accessorKey: 'sector',
      cell: (value: any) => value?.name || 'Sin asignar',
    },
    {
      header: 'Inspector',
      accessorKey: 'inspector',
      cell: (value: any) => value?.full_name || '-',
    },
    {
      header: 'Fecha',
      accessorKey: 'scheduled_date',
      cell: (value: string) => new Date(value).toLocaleDateString('es-ES'),
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
          <h1 className="text-3xl font-bold tracking-tight">Inspecciones de Seguridad</h1>
          <p className="text-muted-foreground">Gestión de inspecciones y auditorías</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/seguridad-higiene/sectores')}>
            Sectores
          </Button>
          <Button
            onClick={() => navigate('/seguridad-higiene/inspecciones/new')}
            disabled={!canManageSH}
            title={canManageSH ? undefined : 'Requiere rol Oficial S&H o Superadmin'}
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear Inspección
          </Button>
        </div>
      </div>

      <DataTable
        data={inspections}
        columns={columns}
        searchable
        searchPlaceholder="Buscar inspecciones..."
        emptyMessage="No hay inspecciones programadas."
        onRowClick={(row) => navigate(`/seguridad-higiene/inspecciones/${row.id}`)}
        actions={(row: any) => (
          <div className="flex gap-2">
            {row.status === 'programada' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate(`/seguridad-higiene/inspecciones/${row.id}/ejecutar`)}
                disabled={!canManageSH}
                title={canManageSH ? undefined : 'Requiere rol Oficial S&H o Superadmin'}
              >
                Iniciar Inspección
              </Button>
            )}
            {row.status === 'en_progreso' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/seguridad-higiene/inspecciones/${row.id}/ejecutar`)}
                disabled={!canManageSH}
                title={canManageSH ? undefined : 'Requiere rol Oficial S&H o Superadmin'}
              >
                Continuar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/seguridad-higiene/inspecciones/${row.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </Button>
          </div>
        )}
      />
    </div>
  );
}
