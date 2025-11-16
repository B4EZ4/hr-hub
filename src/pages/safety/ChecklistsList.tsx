import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, ClipboardList } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';

export default function ChecklistsList() {
  const navigate = useNavigate();
  const { canManageSH } = useRoles();

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sh_checklists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

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
      header: 'Categoría',
      accessorKey: 'category',
      cell: (value: string) => {
        const categories: Record<string, string> = {
          inspeccion: 'Inspección',
          auditoria: 'Auditoría',
          epp: 'EPP',
          capacitacion: 'Capacitación',
          otro: 'Otro',
        };
        return categories[value] || value;
      },
    },
    {
      header: 'Items',
      accessorKey: 'items',
      cell: (value: any[]) => (
        <Badge variant="outline">{value?.length || 0} items</Badge>
      ),
    },
    {
      header: 'Estado',
      accessorKey: 'is_active',
      cell: (value: boolean) => (
        <Badge variant={value ? 'success' : 'outline'}>
          {value ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
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
          <h1 className="text-3xl font-bold tracking-tight">Checklists de S&H</h1>
          <p className="text-muted-foreground">Plantillas reutilizables para inspecciones</p>
        </div>
        {canManageSH && (
          <Button onClick={() => navigate('/seguridad-higiene/checklists/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Checklist
          </Button>
        )}
      </div>

      <DataTable
        data={checklists}
        columns={columns}
        searchable
        searchPlaceholder="Buscar checklists..."
        emptyMessage="No hay checklists creados. Crea el primero para comenzar."
        onRowClick={(row) => navigate(`/seguridad-higiene/checklists/${row.id}`)}
        actions={(row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/seguridad-higiene/checklists/${row.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalle
          </Button>
        )}
      />
    </div>
  );
}
