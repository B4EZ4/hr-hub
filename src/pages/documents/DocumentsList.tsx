import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, Download, Eye, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoles } from '@/hooks/useRoles';
import { useState } from 'react';

type EstadoFilter = 'todos' | 'pendiente' | 'validado' | 'rechazado';

export default function DocumentsList() {
  const { canManageUsers, roles } = useRoles();
  const navigate = useNavigate();
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState('todos');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', estadoFilter, categoriaFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from('documents')
        .select(`
          *,
          uploader:uploaded_by (full_name),
          employee:employee_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (estadoFilter !== 'todos') {
        query = query.eq('estado', estadoFilter);
      }

      if (categoriaFilter !== 'todos') {
        query = query.eq('category', categoriaFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline'> = {
      pendiente: 'outline',
      validado: 'default',
      rechazado: 'destructive',
    };
    return (
      <Badge variant={variants[estado] || 'default'}>
        {estado.toUpperCase()}
      </Badge>
    );
  };

  const columns = [
    {
      header: 'Título',
      accessorKey: 'title',
    },
    {
      header: 'Categoría',
      accessorKey: 'category',
    },
    {
      header: 'Empleado',
      accessorKey: 'employee',
      cell: (value: any) => value?.full_name || '-',
    },
    {
      header: 'Estado',
      accessorKey: 'estado',
      cell: (value: string) => getEstadoBadge(value),
    },
    {
      header: 'Subido por',
      accessorKey: 'uploader',
      cell: (value: any) => value?.full_name || '-',
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">Repositorio de documentos corporativos</p>
        </div>
        {(() => {
          const showUpload = canManageUsers || (roles?.length ?? 0) === 0;
          if (!showUpload) return null;
          return (
            <Button onClick={() => navigate('/documentos/new')} size="lg" className="font-semibold" disabled={!canManageUsers}>
              <Plus className="mr-2 h-5 w-5" />
              Cargar Documento
            </Button>
          );
        })()}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            <Select value={estadoFilter} onValueChange={(value: EstadoFilter) => setEstadoFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="validado">Validado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las categorías</SelectItem>
                <SelectItem value="contrato">Contrato</SelectItem>
                <SelectItem value="identificacion">Identificación</SelectItem>
                <SelectItem value="certificado">Certificado</SelectItem>
                <SelectItem value="nomina">Nómina</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {documents.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
            <p className="text-muted-foreground mb-4">
              Comienza subiendo el primer documento al repositorio.
            </p>
            {(() => {
              const showUpload = canManageUsers || (roles?.length ?? 0) === 0;
              if (!showUpload) return null;
              return (
                <Button onClick={() => navigate('/documentos/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cargar Primer Documento
                </Button>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {documents.length > 0 && (
        <DataTable
          data={documents}
          columns={columns}
          searchable
          searchPlaceholder="Buscar documentos..."
          emptyMessage="No hay documentos disponibles."
          onRowClick={(row) => navigate(`/documentos/${row.id}`)}
          actions={(row) => (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/documentos/${row.id}`);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const { data } = (supabase as any).storage
                    .from('documents')
                    .getPublicUrl((row as any).file_path);
                  window.open(data.publicUrl, '_blank');
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
            </div>
          )}
        />
      )}
    </div>
  );
}
