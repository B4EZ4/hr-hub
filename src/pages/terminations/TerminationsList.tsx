import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
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

  const { data: terminationsData, isLoading } = useQuery({
    queryKey: ['terminations', searchTerm, statusFilter, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('despidos')
        .select(`
          *,
          profiles!despidos_employee_id_fkey(full_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('estado', statusFilter);
      }

      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      query = query.range(start, start + ITEMS_PER_PAGE - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: data || [], count: count || 0 };
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

  const filteredData = terminationsData?.data.filter((item: any) =>
    item.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.motivo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil((terminationsData?.count || 0) / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Despidos</h1>
        <Button onClick={() => navigate('/despidos/nuevo')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Despido
        </Button>
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
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha Despido</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron despidos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData?.map((termination: any) => (
                    <TableRow key={termination.id}>
                      <TableCell className="font-medium">
                        {termination.profiles?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{tipoMap[termination.tipo_despido as keyof typeof tipoMap]}</TableCell>
                      <TableCell>
                        {format(new Date(termination.fecha_despido), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusMap[termination.estado as keyof typeof statusMap]?.variant}>
                          {statusMap[termination.estado as keyof typeof statusMap]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {termination.motivo}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/despidos/${termination.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/despidos/${termination.id}/editar`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(termination.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

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
