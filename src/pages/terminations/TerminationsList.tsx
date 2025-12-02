import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-with-auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/shared/DataTable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, Eye, Check, X , BarChart3} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


const ITEMS_PER_PAGE = 10;

const statusMap = {
  pendiente: { label: 'Pendiente', variant: 'secondary' as const },
  en_proceso: { label: 'En Proceso', variant: 'default' as const },
  completado: { label: 'Completado', variant: 'success' as const },
  cancelado: { label: 'Cancelado', variant: 'destructive' as const },
};

const tipoMap = {
  voluntario: 'Voluntario',
  involuntario: 'Involuntario',
  mutuo_acuerdo: 'Mutuo Acuerdo',
  termino_contrato: 'Término de Contrato',
};

export default function TerminationsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: terminationsData, isLoading } = useQuery({
    // Exclude `searchTerm` from the key so typing doesn't trigger refetches
    queryKey: ['terminations', statusFilter, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('despidos')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('estado', statusFilter);
      }

      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      query = query.range(start, start + ITEMS_PER_PAGE - 1);

      const { data: rows, error, count } = await query;
      if (error) throw error;

      const items = rows || [];

      // Enrich with profiles: collect employee ids and query profiles
      const userIdsSet = new Set<string>();
      items.forEach((r: any) => {
        if (r.employee_id) userIdsSet.add(r.employee_id);
      });

      const userIds = Array.from(userIdsSet);
      if (userIds.length === 0) {
        return { data: items, count: count || 0 };
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (profilesError) {
        return { data: items, count: count || 0 };
      }

      const profileMap = new Map<string, any>();
      (profiles || []).forEach((p: any) => profileMap.set(p.user_id, p));

      const enriched = items.map((r: any) => ({
        ...r,
        employee: profileMap.get(r.employee_id) || null,
      }));

      return { data: enriched, count: count || 0 };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Registrar auditoría
      await supabase.from('despido_audit').insert({
        despido_id: id,
        action: 'DELETE',
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      const { error } = await supabase.from('despidos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminations'] });
      toast.success('Despido eliminado correctamente');
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el despido');
    },
  });

  const updateTerminationStatus = async (id: string, newStatus: string, employeeId?: string) => {
    try {
      setUpdatingId(id);

      const { error } = await supabase.from('despidos').update({ estado: newStatus }).eq('id', id);
      if (error) throw error;

      // Si se marca como completado -> marcar profile como inactivo
      if (newStatus === 'completado' && employeeId) {
        const { error: pErr } = await supabase.from('profiles').update({ status: 'inactivo' }).eq('user_id', employeeId);
        if (pErr) console.error('Error updating profile status', pErr);
      }

      // Si se marca como cancelado -> volver a activo
      if (newStatus === 'cancelado' && employeeId) {
        const { error: pErr } = await supabase.from('profiles').update({ status: 'activo' }).eq('user_id', employeeId);
        if (pErr) console.error('Error updating profile status', pErr);
      }

      await queryClient.invalidateQueries({ queryKey: ['terminations'] });
      toast.success('Estado actualizado');
    } catch (e: any) {
      console.error('Error updating termination status', e);
      toast.error(e?.message || 'Error al actualizar estado');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredData = terminationsData?.data.filter((item: any) =>
    item.employee?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.motivo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil((terminationsData?.count || 0) / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Despidos</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/despidos/dashboard')}>
          <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button onClick={() => navigate('/despidos/nuevo')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Despido
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por empleado o motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <>
          <DataTable
            data={filteredData || []}
            columns={[
              { header: 'Empleado', accessorKey: 'employee', cell: (v: any) => v?.full_name || 'N/A' },
              { header: 'Tipo', accessorKey: 'tipo_despido', cell: (v: string) => tipoMap[v as keyof typeof tipoMap] || v },
              { header: 'Fecha Despido', accessorKey: 'fecha_despido', cell: (v: string) => format(new Date(v), 'dd/MM/yyyy', { locale: es }) },
              { header: 'Estado', accessorKey: 'estado', cell: (v: string) => {
                  const s = statusMap[v as keyof typeof statusMap];
                  return <Badge variant={s?.variant}>{s?.label}</Badge>;
                }
              },
              { header: 'Motivo', accessorKey: 'motivo', cell: (v: string) => <div className="max-w-xs truncate">{v}</div> },
            ]}
            onRowClick={(row) => navigate(`/despidos/${row.id}`)}
            actions={(row: any) => (
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/despidos/${row.id}`)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/despidos/${row.id}/editar`)}>
                  <Edit className="h-4 w-4" />
                </Button>
                {/* Botón: marcar completado */}
                {row.estado !== 'completado' && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => updateTerminationStatus(row.id, 'completado', row.employee_id)}
                    disabled={updatingId === row.id}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                {/* Botón: marcar cancelado */}
                {row.estado !== 'cancelado' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateTerminationStatus(row.id, 'cancelado', row.employee_id)}
                    disabled={updatingId === row.id}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
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
        </>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro de despido
              y todos sus documentos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
