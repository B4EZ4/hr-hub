import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoles } from '@/hooks/useRoles';

export default function DocumentsList() {
  const { canManageUsers } = useRoles();
  const navigate = useNavigate();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('documents')
        .select(`
          *,
          uploader:uploaded_by (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

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
      header: 'Versión',
      accessorKey: 'version',
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
    {
      header: 'Acceso',
      accessorKey: 'is_public',
      cell: (value: boolean) => (
        <Badge variant={value ? 'success' : 'default'}>
          {value ? 'Público' : 'Privado'}
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
          <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">Repositorio de documentos corporativos</p>
        </div>
        {canManageUsers && (
          <Button onClick={() => navigate('/documentos/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Cargar Documento
          </Button>
        )}
      </div>

      <DataTable
        data={documents}
        columns={columns}
        searchable
        searchPlaceholder="Buscar documentos..."
        emptyMessage="No hay documentos disponibles."
        actions={(row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const { data } = (supabase as any).storage
                .from('documents')
                .getPublicUrl((row as any).file_path);
              window.open(data.publicUrl, '_blank');
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar
          </Button>
        )}
      />
    </div>
  );
}
