import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Search, User, GraduationCap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const PersonnelDevelopment = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [searchClicked, setSearchClicked] = useState(false);

  const { data: employee, isLoading: loadingEmployee } = useQuery({
    queryKey: ['employee-development', employeeId],
    queryFn: async () => {
      if (!employeeId || employeeId.length !== 5) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: searchClicked && employeeId.length === 5,
  });

  const { data: training = [] } = useQuery({
    queryKey: ['employee-training', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await (supabase as any)
        .from('employee_training')
        .select(`
          *,
          course:course_id (
            name,
            category,
            duration_hours
          )
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: searchClicked && employeeId.length === 5,
  });

  const handleSearch = () => {
    if (employeeId.length === 5) {
      setSearchClicked(true);
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5); // Solo números, máx 5 dígitos
    setEmployeeId(value);
    setSearchClicked(false);
  };

  const columns = [
    {
      header: 'Curso',
      accessorKey: 'course',
      cell: (value: any) => value?.name || 'Sin nombre',
    },
    {
      header: 'Categoría',
      accessorKey: 'course',
      cell: (value: any) => (
        <Badge variant="outline">{value?.category || 'General'}</Badge>
      ),
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: (value: string) => {
        const variants: Record<string, 'default' | 'destructive' | 'outline'> = {
          asignado: 'outline',
          en_progreso: 'default',
          completado: 'default',
          cancelado: 'destructive',
        };
        const labels: Record<string, string> = {
          asignado: 'Asignado',
          en_progreso: 'En Progreso',
          completado: 'Completado',
          cancelado: 'Cancelado',
        };
        return (
          <Badge variant={variants[value] || 'outline'}>
            {labels[value] || value}
          </Badge>
        );
      },
    },
    {
      header: 'Progreso',
      accessorKey: 'progress_percentage',
      cell: (value: number) => (
        <div className="flex items-center gap-2">
          <Progress value={value || 0} className="w-24" />
          <span className="text-sm text-muted-foreground">{value || 0}%</span>
        </div>
      ),
    },
    {
      header: 'Fecha Inicio',
      accessorKey: 'start_date',
      cell: (value: string | null) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: es }) : '-',
    },
    {
      header: 'Fecha Fin',
      accessorKey: 'end_date',
      cell: (value: string | null) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: es }) : '-',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Desarrollo y Capacitación</h1>
        <p className="text-muted-foreground mt-2">
          Consulta el historial de capacitación y desarrollo de los empleados
        </p>
      </div>

      {/* Instrucciones */}
      <Alert>
        <GraduationCap className="h-4 w-4" />
        <AlertDescription>
          <strong>Instrucciones:</strong> Ingresa el ID del empleado (5 dígitos) para ver su historial de
          capacitación y desarrollo profesional. El sistema mostrará todos los cursos asignados, en progreso
          y completados.
        </AlertDescription>
      </Alert>

      {/* Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Empleado</CardTitle>
          <CardDescription>Ingresa el ID del empleado (formato: 12345)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="employee-id">ID de Empleado</Label>
              <Input
                id="employee-id"
                placeholder="12345"
                value={employeeId}
                onChange={handleIdChange}
                maxLength={5}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Debe tener exactamente 5 dígitos numéricos
              </p>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSearch}
                disabled={employeeId.length !== 5}
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </div>

          {searchClicked && employeeId.length === 5 && !employee && !loadingEmployee && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                <strong>No encontrado:</strong> No existe un empleado con el ID {employeeId}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Información del Empleado */}
      {employee && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Empleado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre Completo</p>
                  <p className="font-medium text-lg">{employee.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{employee.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Posición</p>
                  <p className="font-medium">{employee.position || 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departamento</p>
                  <p className="font-medium">{employee.department || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Ingreso</p>
                  <p className="font-medium">
                    {employee.hire_date ? format(new Date(employee.hire_date), 'dd/MM/yyyy', { locale: es }) : 'No registrada'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={employee.status === 'activo' ? 'default' : 'secondary'}>
                    {employee.status === 'activo' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historial de Capacitación */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Capacitación</CardTitle>
              <CardDescription>
                Registro completo de cursos y programas de desarrollo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {training.length > 0 ? (
                <DataTable columns={columns} data={training} />
              ) : (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin capacitaciones registradas</h3>
                  <p className="text-muted-foreground">
                    Este empleado aún no tiene cursos o programas de capacitación asignados.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
