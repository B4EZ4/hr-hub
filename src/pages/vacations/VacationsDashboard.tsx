import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ClipboardCheck,
  Clock,
  AlertCircle,
  TrendingUp,
  PlusCircle,
  Calendar,
  Search,
  History,
  ArrowLeft,
  Users,
  User
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
// AÑADIR ESTAS IMPORTACIONES NUEVAS
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// IMPORTS DE TUS COMPONENTES
import VacationRequest from "./VacationRequest";
import VacationsList from "./VacationsList";
import VacationCalendar from "./VacationCalendar";
import EmployeeVacationSearch from "./EmployeeVacationSearch";

const VacationsDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 2. ESTADO PARA CONTROLAR VISTAS ('dashboard' | 'form' | 'list')
  const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'list' | 'calendar' | 'search'>('dashboard');
// --- INICIO BLOQUE NUEVO (Directorio) ---
  const [directorySearch, setDirectorySearch] = useState('');

  // Consulta para obtener TODOS los perfiles para el directorio
  const { data: allProfiles } = useQuery({
    queryKey: ['all-profiles-directory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      if (error) return [];
      return data || [];
    }
  });

  // Lógica de filtrado para el modal
  const filteredDirectory = allProfiles?.filter((emp: any) => {
    if (!directorySearch) return true;
    const searchLower = directorySearch.toLowerCase();
    const nameMatch = emp.full_name?.toLowerCase().includes(searchLower);
    const deptMatch = emp.department?.toLowerCase().includes(searchLower);
    return nameMatch || deptMatch;
  }) || [];
  // --- FIN BLOQUE NUEVO ---
  // --- CONSULTA 1: Solicitudes Pendientes ---
  const { data: pendingCount = 0, isLoading: loadingPending } = useQuery({
    queryKey: ['dashboard-pending'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('vacation_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (error) throw error;
      return count || 0;
    }
  });

  // --- CONSULTA 2: Aprobadas este mes ---
  const { data: approvedMonthCount = 0, isLoading: loadingApproved } = useQuery({
    queryKey: ['dashboard-approved-month'],
    queryFn: async () => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const { count, error } = await supabase
        .from('vacation_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved') 
        .gte('start_date', firstDay)
        .lte('start_date', lastDay);
      
      if (error) throw error;
      return count || 0;
    }
  });

  // --- CONSULTA 3: Promedio de Días Disponibles ---
  const { data: avgDays = 0, isLoading: loadingAvg } = useQuery({
    queryKey: ['dashboard-avg-balance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vacation_balances')
        .select('available_days')
        .eq('year', new Date().getFullYear());

      if (error) throw error;
      if (!data || data.length === 0) return 0;

      const total = data.reduce((acc, curr) => acc + (curr.available_days || 0), 0);
      return Math.round((total / data.length) * 10) / 10;
    }
  });

  // --- CONSULTA 4: Total de Empleados ---
  const { data: activeEmployees = 0, isLoading: loadingEmployees } = useQuery({
    queryKey: ['dashboard-active-employees'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('vacation_balances')
        .select('*', { count: 'exact', head: true })
        .eq('year', new Date().getFullYear());
      
      if (error) throw error;
      return count || 0;
    }
  });

  const isLoading = loadingPending || loadingApproved || loadingAvg || loadingEmployees;

  const containerClasses = "p-6 space-y-6 max-w-[1400px] mx-auto w-full";
  const gridClasses = "grid gap-4 md:grid-cols-2 lg:grid-cols-4";

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>
        <div className={gridClasses}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  // --- VISTA 1: Formulario de Solicitud (Nueva Solicitud) ---
  if (currentView === 'form') {
    return <VacationRequest onBack={() => setCurrentView('dashboard')} />;
  }

  // --- VISTA 2: Lista de Revisión (VacationsList) ---
  if (currentView === 'list') {
    return (
      <div className={containerClasses}>
        {/* Botón manual para volver, ya que VacationsList no tiene prop onBack */}
        <div className="flex items-center gap-2 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('dashboard')} 
            className="pl-0 hover:pl-2 transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </div>
        <VacationsList />
      </div>
    );
  }
// --- VISTA 3: Calendario Global ---
  if (currentView === 'calendar') {
    return (
   <div className={containerClasses}>
        {/* Botón manual para volver, ya que VacationsList no tiene prop onBack */}
        <div className="flex items-center gap-2 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('dashboard')} 
            className="pl-0 hover:pl-2 transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </div>
        <VacationCalendar/>
      </div>
    );
  } 
  //VISTA 4: BUSCADOR DE EMPLEADO
  if (currentView === 'search') {
    return (
      <div className={containerClasses}>
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
          </Button>
        </div>
        <EmployeeVacationSearch />
      </div>
    );
  }
  // --- VISTA 5: Dashboard Principal ---
  return (
    <div className={containerClasses}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Gestión de Vacaciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Sistema de solicitudes según Ley Federal del Trabajo (Vacaciones Dignas 2023)
          </p>
        </div>
        {/* Botón Nueva Solicitud */}
        <Button
          onClick={() => setCurrentView('form')} // Cambia a vista formulario
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Solicitud
        </Button>
      </div>

      {/* Stats Cards */}
      <div className={gridClasses}>
        {/* Tarjeta 1: Pendientes (Clickeable -> Va a Lista) */}
        <Card 
            className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100/50 transition-colors"
            onClick={() => setCurrentView('list')} // <-- CONEXIÓN AQUÍ
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {pendingCount}
            </div>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Requieren revisión</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas (Mes)</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {approvedMonthCount}
            </div>
            <p className="text-xs text-green-600/80 dark:text-green-400/80">Listas para documentación</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50/50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Días Disponibles</CardTitle>
            <CalendarDays className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {avgDays}
            </div>
            <p className="text-xs text-purple-600/80 dark:text-purple-400/80">Por empleado activo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeEmployees}
            </div>
            <p className="text-xs text-muted-foreground">Con balance activo</p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Acciones Rápidas</h2>
        <div className={gridClasses}>

      <Card
            className="hover:bg-muted/50 transition-colors cursor-pointer hover:border-blue-500/50 group"
            onClick={() => setCurrentView('search')} // <--- AHORA ABRE LA VISTA 'search'
          >
            <CardHeader className="pb-2">
              <Search className="h-5 w-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Buscador Avanzado</CardTitle>
              <CardDescription>Encontrar empleado por nombre o ID</CardDescription>
            </CardHeader>
          </Card>
          <Card
            className="hover:bg-muted/50 transition-colors cursor-pointer hover:border-purple-500/50 group"
            
            // ANTES: onClick={() => navigate('/vacaciones/calendario')}
            // AHORA:
            onClick={() => setCurrentView('calendar')} 
          >
            <CardHeader className="pb-2">
              <Calendar className="h-5 w-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Calendario Global</CardTitle>
              <CardDescription>Ver días festivos y ocupados</CardDescription>
            </CardHeader>
          </Card>
          {/* Tarjeta 4: También lleva a la lista (igual que la tarjeta 1) */}
          <Card
            className="hover:bg-muted/50 transition-colors cursor-pointer hover:border-orange-500/50 group"
            onClick={() => setCurrentView('list')} // <-- CONEXIÓN AQUÍ
          >
            <CardHeader className="pb-2">
               <History className="h-5 w-5 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Historial Completo</CardTitle>
              <CardDescription>{pendingCount} Todas las solicitudes pasadas</CardDescription>
            </CardHeader>
          </Card>
          
          {/* --- INICIO BLOQUE NUEVO (TARJETA DIRECTORIO + MODAL) --- */}
          <Dialog>
            <DialogTrigger asChild>
              <Card
                className="hover:bg-muted/50 transition-colors cursor-pointer hover:border-blue-500/50 group"
              >
                <CardHeader className="pb-2">
                  <Users className="h-5 w-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-lg">Directorio</CardTitle>
                  <CardDescription>Ver lista total de empleados</CardDescription>
                </CardHeader>
              </Card>
            </DialogTrigger>
            
            {/* Contenido de la Ventana Modal */}
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Directorio de Personal
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Buscador dentro del Modal */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o departamento..."
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {/* Tabla de Resultados */}
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Puesto</TableHead>
                        <TableHead>Fecha Ingreso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDirectory.length > 0 ? (
                        filteredDirectory.map((emp: any) => (
                          <TableRow key={emp.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                  <User className="h-4 w-4" />
                                </div>
                                {emp.full_name}
                              </div>
                            </TableCell>
                            <TableCell>{emp.department || '-'}</TableCell>
                            <TableCell>{emp.position || '-'}</TableCell>
                            <TableCell>
                              {emp.hire_date 
                                ? new Date(emp.hire_date).toLocaleDateString('es-MX') 
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                            No se encontraron empleados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  Mostrando {filteredDirectory.length} registros
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {/* --- FIN BLOQUE NUEVO --- */}
        </div>
      </div>
    </div>
  );
};

export default VacationsDashboard;