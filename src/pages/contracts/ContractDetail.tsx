import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, FileText, Calendar, Briefcase, DollarSign } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { Loader2 } from 'lucide-react';

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManageContracts } = useRoles();

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
        <div className="flex items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          {canManageContracts && (
            <Button onClick={() => navigate(`/contratos/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
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
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Posición</p>
                <p className="font-medium">{contract.position}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Departamento</p>
                <p className="font-medium">{contract.department}</p>
              </div>
            </div>

            {contract.salary && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Salario</p>
                  <p className="font-medium">{contract.salary.toLocaleString('es-ES')} €</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fechas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
                <p className="font-medium">
                  {new Date(contract.start_date).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Fin</p>
                <p className="font-medium">
                  {contract.end_date
                    ? new Date(contract.end_date).toLocaleDateString('es-ES')
                    : 'Indefinido'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documento</CardTitle>
          </CardHeader>
          <CardContent>
            {contract.file_path ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const { data } = (supabase as any).storage
                    .from('contracts')
                    .getPublicUrl(contract.file_path);
                  window.open(data.publicUrl, '_blank');
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver Contrato PDF
              </Button>
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
    </div>
  );
}
