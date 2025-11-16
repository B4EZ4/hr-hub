import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, FileText, Download, RotateCw, X, Trash2 } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canManageContracts } = useRoles();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('contracts')
        .select(`
          *,
          profiles:user_id (full_name, email, phone, department)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">Contrato no encontrado</p>
        <Button onClick={() => navigate('/contratos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  const statusMap: Record<string, { label: string; variant: any }> = {
    activo: { label: 'Activo', variant: 'success' },
    por_vencer: { label: 'Por Vencer', variant: 'default' },
    vencido: { label: 'Vencido', variant: 'destructive' },
    renovado: { label: 'Renovado', variant: 'secondary' },
    terminado: { label: 'Terminado', variant: 'outline' },
  };

  const contractTypes: Record<string, string> = {
    indefinido: 'Indefinido',
    temporal: 'Temporal',
    obra: 'Obra o Servicio',
    practicas: 'Prácticas',
    formacion: 'Formación',
  };

  const status = statusMap[contract.status] || { label: contract.status, variant: 'default' };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (contract?.file_path) {
        const filePath = contract.file_path.replace('/storage/v1/object/public/contracts/', '');
        await (supabase as any).storage.from('contracts').remove([filePath]);
      }

      const { error } = await (supabase as any)
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato eliminado correctamente');
      navigate('/contratos');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el contrato');
    },
  });

  const renewMutation = useMutation({
    mutationFn: async (endDate: string) => {
      const { error } = await (supabase as any)
        .from('contracts')
        .update({
          end_date: endDate,
          status: 'activo',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato renovado correctamente');
      setShowRenewDialog(false);
      setNewEndDate('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al renovar el contrato');
    },
  });

  const terminateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from('contracts')
        .update({
          status: 'terminado',
          end_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato terminado correctamente');
      setShowTerminateDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al terminar el contrato');
    },
  });

  const handleDownload = () => {
    if (contract?.file_path) {
      const { data } = (supabase as any).storage
        .from('contracts')
        .getPublicUrl(contract.file_path);
      window.open(data.publicUrl, '_blank');
    }
  };

  const handleRenew = () => {
    if (!newEndDate) {
      toast.error('Debe especificar una fecha de fin');
      return;
    }
    renewMutation.mutate(newEndDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/contratos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Contrato de {contract.profiles?.full_name}
            </h1>
            <p className="text-muted-foreground">{contractTypes[contract.contract_type]}</p>
          </div>
        </div>
        {canManageContracts && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/contratos/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            {contract.status !== 'terminado' && (
              <>
                <Button variant="outline" onClick={() => setShowRenewDialog(true)}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Renovar
                </Button>
                <Button variant="outline" onClick={() => setShowTerminateDialog(true)}>
                  <X className="mr-2 h-4 w-4" />
                  Terminar
                </Button>
              </>
            )}
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Empleado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre Completo</p>
              <p className="font-medium">{contract.profiles?.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{contract.profiles?.email}</p>
            </div>
            {contract.profiles?.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium">{contract.profiles.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles del Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Número de Contrato</p>
              <p className="font-medium">{contract.contract_number}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{contractTypes[contract.contract_type] || contract.contract_type}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Posición</p>
              <p className="font-medium">{contract.position}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Departamento</p>
              <p className="font-medium">{contract.department || 'No especificado'}</p>
            </div>

            {contract.salary && (
              <div>
                <p className="text-sm text-muted-foreground">Salario</p>
                <p className="font-medium">
                  ${parseFloat(contract.salary).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fechas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
              <p className="font-medium">
                {new Date(contract.start_date).toLocaleDateString('es-ES')}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Fecha de Fin</p>
              <p className="font-medium">
                {contract.end_date
                  ? new Date(contract.end_date).toLocaleDateString('es-ES')
                  : 'Indefinido'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Creado</p>
              <p className="font-medium">
                {new Date(contract.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documento</CardTitle>
          </CardHeader>
          <CardContent>
            {contract.file_path ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownload}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay archivo adjunto</p>
            )}
          </CardContent>
        </Card>

        {contract.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el contrato y el archivo asociado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renovar Contrato</DialogTitle>
            <DialogDescription>
              Especifica la nueva fecha de finalización del contrato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="end_date">Nueva Fecha de Fin</Label>
              <Input
                id="end_date"
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRenew} disabled={renewMutation.isPending}>
              {renewMutation.isPending ? 'Renovando...' : 'Renovar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Terminar contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              El contrato será marcado como terminado con fecha de hoy. Esta acción puede revertirse editando el contrato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => terminateMutation.mutate()}
              disabled={terminateMutation.isPending}
            >
              {terminateMutation.isPending ? 'Terminando...' : 'Terminar Contrato'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
