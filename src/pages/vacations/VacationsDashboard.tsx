import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  ClipboardCheck,
  Clock,
  FileText,
  AlertCircle,
  TrendingUp,
  PlusCircle,
  Calendar,
  Search,
  History,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Mock data - Reemplazar con datos reales de React Query más adelante
const mockStats = {
  pendingRequests: 12,
  approvedRequests: 45,
  availableDaysAvg: 8.5,
  activeEmployees: 150,
};

const VacationsDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
        {/* CAMBIO 1: Botón superior actualizado */}
        <Button
          onClick={() => navigate('/vacaciones/solicitar')}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Solicitud
        </Button>
      </div>

      {/* Stats Cards - (Sin cambios aquí) */}
      <div className={gridClasses}>
        <Card className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{mockStats.pendingRequests}</div>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Requieren revisión</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas (Mes)</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{mockStats.approvedRequests}</div>
            <p className="text-xs text-green-600/80 dark:text-green-400/80">Listas para documentación</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50/50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Días Disponibles</CardTitle>
            <CalendarDays className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{mockStats.availableDaysAvg}</div>
            <p className="text-xs text-purple-600/80 dark:text-purple-400/80">Por empleado activo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">Con balance activo</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Acciones Rápidas</h2>
        <div className={gridClasses}>

          {/* CAMBIO 2: Tarjeta 1 mejorada (Buscador) */}
          <Card
            className="hover:bg-muted/50 transition-colors cursor-pointer hover:border-blue-500/50 group"
            onClick={() => navigate('/vacaciones/buscar')}
          >
            <CardHeader className="pb-2">
              <Search className="h-5 w-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Buscador Avanzado</CardTitle>
              <CardDescription>Encontrar empleado por nombre o ID</CardDescription>
            </CardHeader>
          </Card>

          {/* Tarjeta 2 (Calendario) con navegación */}
          <Card
            className="hover:bg-muted/50 transition-colors cursor-pointer hover:border-purple-500/50 group"
            onClick={() => navigate('/vacaciones/calendario')}
          >
            <CardHeader className="pb-2">
              <Calendar className="h-5 w-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Calendario Global</CardTitle>
              <CardDescription>Ver días festivos y ocupados</CardDescription>
            </CardHeader>
          </Card>

          {/* Tarjeta 3 (Historial) con navegación */}
          <Card
            className="hover:bg-muted/50 transition-colors cursor-pointer hover:border-green-500/50 group"
            // Nota: Si aún no tienes ruta de historial, esto no hará nada o irá al dashboard.
            // Puedes cambiarlo a '/vacaciones/lista' si prefieres.
            onClick={() => toast({ description: "Navegando al historial completo..." })}
          >
            <CardHeader className="pb-2">
              <History className="h-5 w-5 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Historial Completo</CardTitle>
              <CardDescription>Todas las solicitudes pasadas</CardDescription>
            </CardHeader>
          </Card>

          {/* Tarjeta 4 (Pendientes) */}
          <Card
            className="hover:bg-muted/50 transition-colors cursor-pointer hover:border-orange-500/50 group"
            onClick={() => toast({ description: "Filtrando pendientes..." })}
          >
            <CardHeader className="pb-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Revisar Pendientes</CardTitle>
              <CardDescription>{mockStats.pendingRequests} solicitudes por revisar</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VacationsDashboard;