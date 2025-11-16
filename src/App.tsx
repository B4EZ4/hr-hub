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
import UsersList from "./pages/users/UsersList";
import UserForm from "./pages/users/UserForm";
import UserDetail from "./pages/users/UserDetail";
import ContractsList from "./pages/contracts/ContractsList";
import ContractForm from "./pages/contracts/ContractForm";
import ContractDetail from "./pages/contracts/ContractDetail";
import VacationRequest from "./pages/vacations/VacationRequest";
import VacationsList from "./pages/vacations/VacationsList";
import IncidentsList from "./pages/incidents/IncidentsList";
import IncidentForm from "./pages/incidents/IncidentForm";
import IncidentDetail from "./pages/incidents/IncidentDetail";
import InventoryList from "./pages/inventory/InventoryList";
import InventoryForm from "./pages/inventory/InventoryForm";
import InventoryAssignment from "./pages/inventory/InventoryAssignment";
import DocumentsList from "./pages/documents/DocumentsList";
import DocumentForm from "./pages/documents/DocumentForm";
import InspectionsList from "./pages/safety/InspectionsList";
import InspectionForm from "./pages/safety/InspectionForm";
import InspectionDetail from "./pages/safety/InspectionDetail";
import SectorsList from "./pages/safety/SectorsList";
import SectorForm from "./pages/safety/SectorForm";
import Settings from "./pages/settings/Settings";

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
            <Route path="/usuarios" element={<ProtectedRoute><UsersList /></ProtectedRoute>} />
            <Route path="/usuarios/new" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
            <Route path="/usuarios/:id" element={<ProtectedRoute><UserDetail /></ProtectedRoute>} />
            <Route path="/usuarios/:id/edit" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
            
            {/* Contratos */}
            <Route path="/contratos" element={<ProtectedRoute><ContractsList /></ProtectedRoute>} />
            <Route path="/contratos/new" element={<ProtectedRoute><ContractForm /></ProtectedRoute>} />
            <Route path="/contratos/:id" element={<ProtectedRoute><ContractDetail /></ProtectedRoute>} />
            <Route path="/contratos/:id/edit" element={<ProtectedRoute><ContractForm /></ProtectedRoute>} />
            
            {/* Vacaciones */}
            <Route path="/vacaciones/solicitar" element={<ProtectedRoute><VacationRequest /></ProtectedRoute>} />
            <Route path="/vacaciones" element={<ProtectedRoute><VacationsList /></ProtectedRoute>} />
            
            {/* Incidencias */}
            <Route path="/incidencias" element={<ProtectedRoute><IncidentsList /></ProtectedRoute>} />
            <Route path="/incidencias/new" element={<ProtectedRoute><IncidentForm /></ProtectedRoute>} />
            <Route path="/incidencias/:id" element={<ProtectedRoute><IncidentDetail /></ProtectedRoute>} />
            <Route path="/incidencias/:id/edit" element={<ProtectedRoute><IncidentForm /></ProtectedRoute>} />
            
            {/* Inventario */}
            <Route path="/inventario" element={<ProtectedRoute><InventoryList /></ProtectedRoute>} />
            <Route path="/inventario/new" element={<ProtectedRoute><InventoryForm /></ProtectedRoute>} />
            <Route path="/inventario/:id/edit" element={<ProtectedRoute><InventoryForm /></ProtectedRoute>} />
            <Route path="/inventario/asignar" element={<ProtectedRoute><InventoryAssignment /></ProtectedRoute>} />
            
            {/* Documentos */}
            <Route path="/documentos" element={<ProtectedRoute><DocumentsList /></ProtectedRoute>} />
            <Route path="/documentos/new" element={<ProtectedRoute><DocumentForm /></ProtectedRoute>} />
            
            {/* Seguridad e Higiene */}
            <Route path="/seguridad-higiene" element={<ProtectedRoute><InspectionsList /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inspecciones" element={<ProtectedRoute><InspectionsList /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inspecciones/new" element={<ProtectedRoute><InspectionForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inspecciones/:id" element={<ProtectedRoute><InspectionDetail /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/inspecciones/:id/edit" element={<ProtectedRoute><InspectionForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/sectores" element={<ProtectedRoute><SectorsList /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/sectores/new" element={<ProtectedRoute><SectorForm /></ProtectedRoute>} />
            <Route path="/seguridad-higiene/sectores/:id/edit" element={<ProtectedRoute><SectorForm /></ProtectedRoute>} />
            
            {/* Configuración */}
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
