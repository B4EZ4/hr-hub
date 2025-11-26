import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-with-auth';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Eye, BarChart3 } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function IncidentsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: incidentsData, isLoading } = useQuery({
    // Exclude `searchTerm` from the query key so typing doesn't trigger refetches.
    queryKey: ['incidents', statusFilter, severityFilter, currentPage],
    queryFn: async () => {
      // 1) Obtener incidents (paginado)
      let query = supabase
        .from('incidents')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (severityFilter !== 'all') query = query.eq('severity', severityFilter);

      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      query = query.range(start, start + ITEMS_PER_PAGE - 1);

      const { data: incidents, error, count } = await query;
      if (error) throw error;

      const rows = incidents || [];

      // 2) Recolectar user ids para assigned_to y reported_by
      const userIdsSet = new Set<string>();
      rows.forEach((r: any) => {
        if (r.assigned_to) userIdsSet.add(r.assigned_to);
        if (r.reported_by) userIdsSet.add(r.reported_by);
      });

      const userIds = Array.from(userIdsSet);

      if (userIds.length === 0) {
        return { data: rows, count: count || 0 };
      }

      // 3) Consultar profiles por user_id para obtener full_name
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      if (profilesError) {
        // Si falla la consulta de profiles, devolvemos incidents sin enrich
        return { data: rows, count: count || 0 };
      }

      const profileMap = new Map<string, any>();
      (profiles || []).forEach((p: any) => profileMap.set(p.user_id, p));

      // 4) Adjuntar reporter/assignee con full_name cuando exista
      const enriched = rows.map((r: any) => ({
        ...r,
        reporter: profileMap.get(r.reported_by) || null,
        assignee: profileMap.get(r.assigned_to) || null,
      }));

      return { data: enriched, count: count || 0 };
    },
  });

  const filteredData = incidentsData?.data.filter((item: any) =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil((incidentsData?.count || 0) / ITEMS_PER_PAGE);

  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
      const { error } = await supabase.from('incidents').update({ status }).eq('id', id);
      if (error) throw error;
      // invalidate queries to refresh list
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    } catch (e: any) {
      console.error('Error updating status', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusMap: Record<string, { label: string; variant: any }> = {
    abierto: { label: 'Abierto', variant: 'default' },
    en_progreso: { label: 'En Progreso', variant: 'warning' },
    resuelto: { label: 'Resuelto', variant: 'success' },
    cerrado: { label: 'Cerrado', variant: 'outline' },
  };

  const severityMap: Record<string, { label: string; variant: any }> = {
    baja: { label: 'Baja', variant: 'default' },
    media: { label: 'Media', variant: 'default' },
    alta: { label: 'Alta', variant: 'destructive' },
    critica: { label: 'Crítica', variant: 'destructive' },
  };

  const columns = [
    {
      header: 'Título',
      accessorKey: 'title',
    },
    {
      header: 'Tipo',
      accessorKey: 'incident_type',
      cell: (value: string) => {
        const types: Record<string, string> = {
          // legacy
          accidente: 'Accidente',
          incidente: 'Incidente',
          casi_accidente: 'Casi Accidente',
          condicion_insegura: 'Condición Insegura',
          // nuevos slugs
          falta_injustificada: 'Falta injustificada',
          falta_justificada: 'Falta justificada',
          permiso_laboral: 'Permiso laboral',
          accidente_laboral: 'Accidente laboral',
          despido: 'Despido',
        };
        return types[value] || value;
      },
    },
    {
      header: 'Severidad',
      accessorKey: 'severity',
      cell: (value: string) => {
        const severity = severityMap[value] || { label: value, variant: 'default' };
        return <Badge variant={severity.variant}>{severity.label}</Badge>;
      },
    },
    {
      header: 'Asignado a',
      accessorKey: 'assignee',
      cell: (value: any) => value?.full_name || 'Sin asignar',
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: (value: string) => {
        const status = statusMap[value] || { label: value, variant: 'default' };
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Incidencias</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/incidencias/dashboard')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/despidos')}>
            Despidos
          </Button>
          <Button onClick={() => navigate('/incidencias/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Reportar Incidencia
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar por título, descripción o ubicación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="abierto">Abierto</SelectItem>
              <SelectItem value="en_progreso">En Progreso</SelectItem>
            <SelectItem value="resuelto">Resuelto</SelectItem>
            <SelectItem value="cerrado">Cerrado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Severidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="critica">Crítica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
            data={filteredData || []}
            columns={columns}
            searchPlaceholder="Buscar incidencias..."
            onRowClick={(row) => navigate(`/incidencias/${row.id}`)}
            actions={(row: any) => (
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/incidencias/${row.id}`)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={row.status === 'abierto' ? 'default' : 'outline'}
                  onClick={() => updateStatus(row.id, 'abierto')}
                  disabled={updatingId === row.id}
                >
                  Abierto
                </Button>
                <Button
                  size="sm"
                  variant={row.status === 'en_progreso' ? 'warning' : 'outline'}
                  onClick={() => updateStatus(row.id, 'en_progreso')}
                  disabled={updatingId === row.id}
                >
                  En Progreso
                </Button>
                <Button
                  size="sm"
                  variant={row.status === 'cerrado' ? 'destructive' : 'outline'}
                  onClick={() => updateStatus(row.id, 'cerrado')}
                  disabled={updatingId === row.id}
                >
                  Finalizar
                </Button>
              </div>
            )}
          />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="py-2 px-4">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
