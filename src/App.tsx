import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/layout/AppLayout";
import { useAuth } from "./contexts/AuthContext";
import { useRoles } from "./hooks/useRoles";
import UsersList from "./pages/users/UsersList";
import UserForm from "./pages/users/UserForm";
import UserDetail from "./pages/users/UserDetail";
// VACACIONES IMPORTS
import VacationRequest from "./pages/vacations/VacationRequest";
import VacationsList from "./pages/vacations/VacationsList";
import VacationsDashboard from "./pages/vacations/VacationsDashboard";
import VacationCalendar from "./pages/vacations/VacationCalendar";
import EmployeeVacationSearch from "./pages/vacations/EmployeeVacationSearch";

import IncidentsList from "./pages/incidents/IncidentsList";
import IncidentForm from "./pages/incidents/IncidentForm";
import IncidentDetail from "./pages/incidents/IncidentDetail";
import IncidentsDashboard from "./pages/incidents/IncidentsDashboard";
import TerminationsList from "./pages/terminations/TerminationsList";
import TerminationForm from "./pages/terminations/TerminationForm";
import TerminationDetail from "./pages/terminations/TerminationDetail";
import TerminationsDashboard from "./pages/terminations/TerminationsDashboard";
import InventoryList from "./pages/inventory/InventoryList";
import InventoryForm from "./pages/inventory/InventoryForm";
import InventoryAssignment from "./pages/inventory/InventoryAssignment";
import InventoryDetail from "./pages/inventory/InventoryDetail";
import DocumentsList from "./pages/documents/DocumentsList";
import DocumentForm from "./pages/documents/DocumentForm";
import SafetyHome from "./pages/safety/SafetyHome";
import InspectionsList from "./pages/safety/InspectionsList";
import InspectionForm from "./pages/safety/InspectionForm";
import InspectionDetail from "./pages/safety/InspectionDetail";
import SectorsList from "./pages/safety/SectorsList";
import SectorForm from "./pages/safety/SectorForm";
import SectorDetail from "./pages/safety/SectorDetail";
import ChecklistsList from "./pages/safety/ChecklistsList";
import ChecklistForm from "./pages/safety/ChecklistForm";
import ChecklistDetail from "./pages/safety/ChecklistDetail";
import AreaEvaluationsList from "./pages/safety/AreaEvaluationsList";
import AreaEvaluationForm from "./pages/safety/AreaEvaluationForm";
import AreaEvaluationDetail from "./pages/safety/AreaEvaluationDetail";
import MaintenancesList from "./pages/safety/MaintenancesList";
import MaintenanceForm from "./pages/safety/MaintenanceForm";
import MaintenanceDetail from "./pages/safety/MaintenanceDetail";
import AlertsList from "./pages/safety/AlertsList";
import InspectionExecution from "./pages/safety/InspectionExecution";
import InventoryHistory from "./pages/safety/InventoryHistory";
import InventoryAdjustment from "./pages/safety/InventoryAdjustment";
import DocumentDetail from "./pages/documents/DocumentDetail";
import RolesManager from "./pages/settings/RolesManager";
import Settings from "./pages/settings/Settings";
import RecruitmentDashboard from "./pages/recruitment/RecruitmentDashboard";
import RecruitmentPositionsList from "./pages/recruitment/RecruitmentPositionsList";
import RecruitmentCandidatesList from "./pages/recruitment/RecruitmentCandidatesList";
import RecruitmentInterviewsList from "./pages/recruitment/RecruitmentInterviewsList";
import CandidateDetail from "./pages/recruitment/CandidateDetail";
import AttendanceDashboard from "./pages/attendance/AttendanceDashboard";
import { AreasDashboard } from "./pages/areas/AreasDashboard";
import { AreasManagement } from "./pages/areas/AreasManagement";
import { VacanciesManagement } from "./pages/areas/VacanciesManagement";
import { PromotionsManagement } from "./pages/areas/PromotionsManagement";
import { PersonnelHub } from "./pages/areas/PersonnelHub";
import { PersonnelActivities } from "./pages/areas/PersonnelActivities";
import BiometricAccessPoint from "./pages/BiometricAccessPoint";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

const RequireManageUsers = ({ children }: { children: React.ReactNode }) => {
  const { canManageUsers, isLoading } = useRoles();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!canManageUsers) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* Usuarios */}
            <Route path="/usuarios" element={<ProtectedRoute><RequireManageUsers><UsersList /></RequireManageUsers></ProtectedRoute>} />
            <Route path="/usuarios/new" element={<ProtectedRoute><RequireManageUsers><UserForm /></RequireManageUsers></ProtectedRoute>} />
            <Route path="/usuarios/:id" element={<ProtectedRoute><RequireManageUsers><UserDetail /></RequireManageUsers></ProtectedRoute>} />
            <Route path="/usuarios/:id/edit" element={<ProtectedRoute><RequireManageUsers><UserForm /></RequireManageUsers></ProtectedRoute>} />

            {/* Contratos legacy - redirect to Recruitment */}
            <Route path="/contratos/*" element={<Navigate to="/reclutamiento" replace />} />

            {/* Vacaciones - ACTUALIZADO AQUI */}
            <Route path="/vacaciones" element={<ProtectedRoute><VacationsDashboard /></ProtectedRoute>} />
            <Route path="/vacaciones/solicitar" element={<ProtectedRoute><VacationRequest /></ProtectedRoute>} />
            <Route path="/vacaciones/historial" element={<ProtectedRoute><VacationsList /></ProtectedRoute>} />
            <Route path="/vacaciones/calendario" element={<ProtectedRoute><VacationCalendar /></ProtectedRoute>} />
            <Route path="/vacaciones/buscar" element={<ProtectedRoute><EmployeeVacationSearch /></ProtectedRoute>} />

            {/* Asistencia */}
            <Route path="/asistencia" element={<ProtectedRoute><AttendanceDashboard /></ProtectedRoute>} />

            {/* Incidencias */}
            <Route path="/incidencias" element={<ProtectedRoute><IncidentsList /></ProtectedRoute>} />
            <Route path="/incidencias/dashboard" element={<ProtectedRoute><IncidentsDashboard /></ProtectedRoute>} />
            <Route path="/incidencias/new" element={<ProtectedRoute><IncidentForm /></ProtectedRoute>} />
            <Route path="/incidencias/:id" element={<ProtectedRoute><IncidentDetail /></ProtectedRoute>} />
            <Route path="/incidencias/:id/edit" element={<ProtectedRoute><IncidentForm /></ProtectedRoute>} />

            {/* Despidos */}
            <Route path="/despidos" element={<ProtectedRoute><TerminationsList /></ProtectedRoute>} />
            <Route path="/despidos/dashboard" element={<ProtectedRoute><TerminationsDashboard /></ProtectedRoute>} />
            <Route path="/despidos/nuevo" element={<ProtectedRoute><TerminationForm /></ProtectedRoute>} />
            <Route path="/despidos/:id" element={<ProtectedRoute><TerminationDetail /></ProtectedRoute>} />
            <Route path="/despidos/:id/editar" element={<ProtectedRoute><TerminationForm /></ProtectedRoute>} />

            {/* Inventario */}
            <Route path="/inventario" element={<ProtectedRoute><InventoryList /></ProtectedRoute>} />
            <Route path="/inventario/new" element={<ProtectedRoute><InventoryForm /></ProtectedRoute>} />
            <Route path="/inventario/:id/edit" element={<ProtectedRoute><InventoryForm /></ProtectedRoute>} />
            <Route path="/inventario/asignar" element={<ProtectedRoute><InventoryAssignment /></ProtectedRoute>} />

            {/* Reclutamiento */}
            <Route path="/reclutamiento" element={<ProtectedRoute><RecruitmentDashboard /></ProtectedRoute>} />
            <Route path="/reclutamiento/posiciones" element={<ProtectedRoute><RecruitmentPositionsList /></ProtectedRoute>} />
            <Route path="/reclutamiento/candidatos" element={<ProtectedRoute><RecruitmentCandidatesList /></ProtectedRoute>} />
            <Route path="/reclutamiento/candidatos/:id" element={<ProtectedRoute><CandidateDetail /></ProtectedRoute>} />
            <Route path="/reclutamiento/entrevistas" element={<ProtectedRoute><RecruitmentInterviewsList /></ProtectedRoute>} />

            {/* Documentos */}
            <Route path="/documentos" element={<ProtectedRoute><DocumentsList /></ProtectedRoute>} />
            <Route path="/documentos/new" element={<ProtectedRoute><DocumentForm /></ProtectedRoute>} />
            <Route path="/documentos/:id" element={<ProtectedRoute><DocumentDetail /></ProtectedRoute>} />
            <Route path="/documentos/:id/edit" element={<ProtectedRoute><DocumentForm /></ProtectedRoute>} />

            {/* Seguridad e Higiene */}
            <Route path="/seguridad-higiene" element={<ProtectedRoute><SafetyHome /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inspecciones" element={<ProtectedRoute><InspectionsList /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inspecciones/new" element={<ProtectedRoute><InspectionForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inspecciones/:id" element={<ProtectedRoute><InspectionDetail /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inspecciones/:id/edit" element={<ProtectedRoute><InspectionForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inspecciones/:id/ejecutar" element={<ProtectedRoute><InspectionExecution /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/sectores" element={<ProtectedRoute><SectorsList /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/sectores/new" element={<ProtectedRoute><SectorForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/sectores/:id" element={<ProtectedRoute><SectorDetail /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/sectores/:id/edit" element={<ProtectedRoute><SectorForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/checklists" element={<ProtectedRoute><ChecklistsList /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/checklists/new" element={<ProtectedRoute><ChecklistForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/checklists/:id" element={<ProtectedRoute><ChecklistDetail /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/checklists/:id/edit" element={<ProtectedRoute><ChecklistForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/evaluaciones" element={<ProtectedRoute><AreaEvaluationsList /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/evaluaciones/new" element={<ProtectedRoute><AreaEvaluationForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/evaluaciones/:id" element={<ProtectedRoute><AreaEvaluationDetail /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/evaluaciones/:id/edit" element={<ProtectedRoute><AreaEvaluationForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/mantenimientos" element={<ProtectedRoute><MaintenancesList /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/mantenimientos/new" element={<ProtectedRoute><MaintenanceForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/mantenimientos/:id" element={<ProtectedRoute><MaintenanceDetail /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/mantenimientos/:id/edit" element={<ProtectedRoute><MaintenanceForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/alertas" element={<ProtectedRoute><AlertsList /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inventario/:id/historial" element={<ProtectedRoute><InventoryHistory /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inventario/:id/ajustar" element={<ProtectedRoute><InventoryAdjustment /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inventario/:id/asignar" element={<ProtectedRoute><InventoryAssignment /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inventario" element={<ProtectedRoute><InventoryList /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inventario/new" element={<ProtectedRoute><InventoryForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inventario/:id" element={<ProtectedRoute><InventoryDetail /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inventario/:id/edit" element={<ProtectedRoute><InventoryForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inventario/asignar" element={<ProtectedRoute><InventoryAssignment /></ProtectedRoute>} />

            {/* Áreas y Asignaciones */}
            <Route path="/areas" element={<ProtectedRoute><AreasDashboard /></ProtectedRoute>} />
            <Route path="/areas/lista" element={<ProtectedRoute><AreasManagement /></ProtectedRoute>} />
            <Route path="/areas/vacantes" element={<ProtectedRoute><VacanciesManagement /></ProtectedRoute>} />
            <Route path="/areas/promociones" element={<ProtectedRoute><PromotionsManagement /></ProtectedRoute>} />
            <Route path="/areas/personal" element={<ProtectedRoute><PersonnelHub /></ProtectedRoute>} />
            <Route path="/areas/capacitacion" element={<ProtectedRoute><PersonnelHub /></ProtectedRoute>} />
            <Route path="/areas/evaluaciones" element={<ProtectedRoute><PersonnelHub /></ProtectedRoute>} />
            <Route path="/areas/actividades" element={<ProtectedRoute><PersonnelActivities /></ProtectedRoute>} />

            {/* Punto de Acceso Biométrico */}
            <Route path="/punto-acceso" element={<BiometricAccessPoint />} />

            {/* Configuración */}
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/settings/roles" element={<ProtectedRoute><RolesManager /></ProtectedRoute>} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;