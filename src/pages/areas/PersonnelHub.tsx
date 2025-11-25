import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, GraduationCap, Award, ClipboardList, Info } from 'lucide-react';
import { PersonnelDevelopment } from './PersonnelDevelopment';
import { PersonnelPerformance } from './PersonnelPerformance';
import { PersonnelActivities } from './PersonnelActivities';

export const PersonnelHub = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Personal</h1>
        <p className="text-muted-foreground mt-2">
          Gestión integral de desarrollo, evaluación y actividades del personal
        </p>
      </div>

      {/* Instrucciones generales */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Bienvenido al módulo de Personal:</strong> Aquí puedes consultar y gestionar información detallada
          sobre el desarrollo profesional, evaluaciones de desempeño y actividades de los empleados. Usa las pestañas
          para navegar entre las diferentes secciones. La mayoría de búsquedas requieren el ID de empleado de 5 dígitos.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="development" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="development" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Desarrollo y Capacitación
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Evaluación de Desempeño
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Actividades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="development">
          <PersonnelDevelopment />
        </TabsContent>

        <TabsContent value="performance">
          <PersonnelPerformance />
        </TabsContent>

        <TabsContent value="activities">
          <PersonnelActivities />
        </TabsContent>
      </Tabs>
    </div>
  );
};
