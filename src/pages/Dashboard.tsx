import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Users, 
  Calendar, 
  AlertTriangle,
  FileSpreadsheet,
  Shield,
  Clock,
  CheckCircle,
  Plus,
  Package
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/hooks/useRoles";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canManageUsers, canManageContracts, canApproveVacations, canManageSH } = useRoles();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch contracts expiring soon
  const { data: expiringContracts = [] } = useQuery({
    queryKey: ['expiring-contracts'],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data, error } = await (supabase as any)
        .from('contracts')
        .select('*, profiles!contracts_user_id_fkey(full_name)')
        .eq('status', 'activo')
        .not('end_date', 'is', null)
        .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('end_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: canManageContracts,
  });

  // Fetch pending vacation requests
  const { data: pendingVacations = [] } = useQuery({
    queryKey: ['pending-vacations'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('vacation_requests')
        .select('*, profiles!vacation_requests_user_id_fkey(full_name)')
        .eq('status', 'pendiente')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: canApproveVacations,
  });

  // Fetch open incidents
  const { data: openIncidents = [] } = useQuery({
    queryKey: ['open-incidents'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('incidents')
        .select('*')
        .eq('status', 'abierto')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch critical stock items
  const { data: criticalStock = [] } = useQuery({
    queryKey: ['critical-stock'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inventory_items')
        .select('*')
        .filter('stock_quantity', 'lte', 'min_stock')
        .order('stock_quantity', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: canManageSH,
  });

  // Fetch upcoming inspections
  const { data: upcomingInspections = [] } = useQuery({
    queryKey: ['upcoming-inspections'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sh_inspections')
        .select('*, sh_sectors(name)')
        .eq('status', 'programada')
        .order('scheduled_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: canManageSH,
  });

  // Fetch recent documents
  const { data: recentDocuments = [] } = useQuery({
    queryKey: ['recent-documents'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('documents')
        .select('*, profiles!documents_uploaded_by_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido, {profile?.full_name || user?.email}
          </p>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
          <CardDescription>
            Accesos directos a las funciones más utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Button onClick={() => navigate('/documentos/new')} variant="outline" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Cargar Documento
            </Button>
            {canManageContracts && (
              <Button onClick={() => navigate('/contratos/new')} variant="outline" className="w-full">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Nuevo Contrato
              </Button>
            )}
            <Button onClick={() => navigate('/vacaciones/solicitar')} variant="outline" className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Solicitar Vacaciones
            </Button>
            <Button onClick={() => navigate('/incidencias/new')} variant="outline" className="w-full">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Reportar Incidencia
            </Button>
            {canManageSH && (
              <>
                <Button onClick={() => navigate('/seguridad-higiene/inventario/new')} variant="outline" className="w-full">
                  <Package className="mr-2 h-4 w-4" />
                  Agregar Ítem EPP
                </Button>
                <Button onClick={() => navigate('/seguridad-higiene/inspecciones/new')} variant="outline" className="w-full">
                  <Shield className="mr-2 h-4 w-4" />
                  Programar Inspección
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Widgets Grid - Contratos por vencer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Contratos por Vencer (30 días)</span>
              <Badge variant="destructive">{expiringContracts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringContracts.map((contract: any) => (
                <div 
                  key={contract.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent"
                  onClick={() => navigate(`/contratos/${contract.id}`)}
                >
                  <div>
                    <p className="font-medium">{contract.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{contract.position}</p>
                  </div>
                  <Badge variant="outline">
                    {contract.end_date && format(new Date(contract.end_date), 'dd/MM/yyyy')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      {/* Solicitudes de Vacaciones Pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Solicitudes de Vacaciones Pendientes</span>
              <Badge variant="secondary">{pendingVacations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingVacations.map((vacation: any) => (
                <div 
                  key={vacation.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent"
                  onClick={() => navigate('/vacaciones')}
                >
                  <div>
                    <p className="font-medium">{vacation.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(vacation.start_date), 'dd/MM/yyyy')} - {format(new Date(vacation.end_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <Badge>{vacation.days_requested} días</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      {/* Incidencias Críticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Incidencias Abiertas</span>
              <Badge variant="destructive">{openIncidents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {openIncidents.map((incident: any) => (
                <div 
                  key={incident.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent"
                  onClick={() => navigate(`/incidencias/${incident.id}`)}
                >
                  <div>
                    <p className="font-medium">{incident.title}</p>
                    <p className="text-sm text-muted-foreground">{incident.incident_type}</p>
                  </div>
                  <Badge variant={incident.severity === 'critica' ? 'destructive' : 'secondary'}>
                    {incident.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      {/* Stock Crítico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Stock Crítico - Seguridad e Higiene</span>
              <Badge variant="destructive">{criticalStock.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalStock.map((item: any) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent"
                  onClick={() => navigate(`/seguridad-higiene/inventario/${item.id}`)}
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <Badge variant="destructive">
                    {item.stock_quantity}/{item.min_stock}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      {/* Inspecciones Programadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Inspecciones Programadas</span>
              <Badge>{upcomingInspections.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingInspections.map((inspection: any) => (
                <div 
                  key={inspection.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent"
                  onClick={() => navigate(`/seguridad-higiene/inspecciones/${inspection.id}`)}
                >
                  <div>
                    <p className="font-medium">{inspection.sh_sectors?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(inspection.scheduled_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <Badge variant="outline">{inspection.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      {/* Documentos Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Documentos Recientes</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/documentos')}>
                Ver todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentDocuments.map((doc: any) => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent"
                  onClick={() => navigate(`/documentos/${doc.id}`)}
                >
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.category} • {doc.profiles?.full_name}
                    </p>
                  </div>
                  <Badge variant="outline">v{doc.version}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
