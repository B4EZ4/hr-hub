import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, FileText } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ContractsList() {
  const navigate = useNavigate();
  const { canManageContracts, roles } = useRoles();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('contracts')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const statusMap: Record<string, { label: string; variant: any }> = {
    activo: { label: 'Activo', variant: 'success' },
    por_vencer: { label: 'Por Vencer', variant: 'default' },
    vencido: { label: 'Vencido', variant: 'destructive' },
    renovado: { label: 'Renovado', variant: 'secondary' },
    terminado: { label: 'Terminado', variant: 'outline' },
  };

  const columns = [
    {
      header: 'Empleado',
      accessorKey: 'profiles',
      cell: (value: any) => value?.full_name || '-',
    },
    {
      header: 'Tipo',
      accessorKey: 'contract_type',
      cell: (value: string) => {
        const types: Record<string, string> = {
          indefinido: 'Indefinido',
          temporal: 'Temporal',
          obra: 'Obra o Servicio',
          practicas: 'Prácticas',
          formacion: 'Formación',
        };
        return types[value] || value;
      },
    },
    {
      header: 'Posición',
      accessorKey: 'position',
    },
    {
      header: 'Departamento',
      accessorKey: 'department',
    },
    {
      header: 'Inicio',
      accessorKey: 'start_date',
      cell: (value: string) => value ? new Date(value).toLocaleDateString('es-ES') : '-',
    },
    {
      header: 'Fin',
      accessorKey: 'end_date',
      cell: (value: string) => value ? new Date(value).toLocaleDateString('es-ES') : 'Indefinido',
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
          <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground">Gestión de contratos laborales</p>
        </div>
        {(() => {
          const showNew = canManageContracts || (roles?.length ?? 0) === 0;
          if (!showNew) return null;
          return (
            <Button onClick={() => navigate('/contratos/new')} size="lg" className="font-semibold" disabled={!canManageContracts}>
              <Plus className="mr-2 h-5 w-5" />
              Nuevo Contrato
            </Button>
          );
        })()}
      </div>

      <DataTable
        data={contracts}
        columns={columns}
        searchable
        searchPlaceholder="Buscar contratos..."
        emptyMessage="No hay contratos registrados. Crea el primer contrato para comenzar."
        onRowClick={(row) => navigate(`/contratos/${row.id}`)}
        actions={(row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Acciones
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              <DropdownMenuItem onClick={() => navigate(`/contratos/${row.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </DropdownMenuItem>
              {(row as any).file_path && (
                <DropdownMenuItem onClick={() => window.open((row as any).file_path, '_blank')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Descargar PDF
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
    </div>
  );
}
