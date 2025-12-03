import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, User, TrendingUp, Award } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export const PersonnelPerformance = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [searchClicked, setSearchClicked] = useState(false);

  const { data: employee, isLoading: loadingEmployee } = useQuery({
    queryKey: ['employee-performance', employeeId],
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

  const { data: evaluations = [] } = useQuery({
    queryKey: ['employee-evaluations', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await (supabase as any)
        .from('performance_evaluations')
        .select('*')
        .eq('employee_id', employeeId)
        .order('evaluation_period_start', { ascending: false });

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
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setEmployeeId(value);
    setSearchClicked(false);
  };

  // Preparar datos para gráfica
  const chartData = evaluations.map((evaluation: any) => ({
    periodo: format(new Date(evaluation.evaluation_period_start), 'MMM yyyy', { locale: es }),
    'Habilidades Técnicas': evaluation.technical_skills_score || 0,
    'Productividad': evaluation.productivity_score || 0,
    'Habilidades Blandas': evaluation.soft_skills_score || 0,
    'Puntuación General': evaluation.overall_score || 0,
  })).reverse();

  const latestEvaluation = evaluations[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Evaluación de Desempeño</h1>
        <p className="text-muted-foreground mt-2">
          Consulta el historial y métricas de evaluación de los empleados
        </p>
      </div>

      {/* Instrucciones */}
      <Alert>
        <Award className="h-4 w-4" />
        <AlertDescription>
          <strong>Instrucciones:</strong> Ingresa el ID del empleado (5 dígitos) para ver su historial de
          evaluaciones de desempeño, métricas de rendimiento y gráficas evolutivas.
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

          {/* Última Evaluación */}
          {latestEvaluation && (
            <Card>
              <CardHeader>
                <CardTitle>Última Evaluación</CardTitle>
                <CardDescription>
                  Período: {format(new Date(latestEvaluation.evaluation_period_start), 'dd/MM/yyyy', { locale: es })} -{' '}
                  {format(new Date(latestEvaluation.evaluation_period_end), 'dd/MM/yyyy', { locale: es })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{latestEvaluation.overall_score || 0}</p>
                    <p className="text-sm text-muted-foreground">Puntuación General</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">{latestEvaluation.technical_skills_score || 0}</p>
                    <p className="text-sm text-muted-foreground">Habilidades Técnicas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">{latestEvaluation.productivity_score || 0}</p>
                    <p className="text-sm text-muted-foreground">Productividad</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">{latestEvaluation.soft_skills_score || 0}</p>
                    <p className="text-sm text-muted-foreground">Habilidades Blandas</p>
                  </div>
                </div>

                {latestEvaluation.strengths && (
                  <div className="mb-4">
                    <Label>Fortalezas</Label>
                    <p className="text-sm mt-1">{latestEvaluation.strengths}</p>
                  </div>
                )}

                {latestEvaluation.areas_for_improvement && (
                  <div className="mb-4">
                    <Label>Áreas de Mejora</Label>
                    <p className="text-sm mt-1">{latestEvaluation.areas_for_improvement}</p>
                  </div>
                )}

                {latestEvaluation.comments && (
                  <div>
                    <Label>Comentarios del Evaluador</Label>
                    <p className="text-sm mt-1">{latestEvaluation.comments}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Gráfica de Rendimiento Histórico */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Gráfica de Rendimiento Histórico
                </CardTitle>
                <CardDescription>Evolución de métricas de desempeño en el tiempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Puntuación General" stroke="hsl(var(--primary))" strokeWidth={3} />
                    <Line type="monotone" dataKey="Habilidades Técnicas" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                    <Line type="monotone" dataKey="Productividad" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                    <Line type="monotone" dataKey="Habilidades Blandas" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Historial de Evaluaciones */}
          {evaluations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Evaluaciones</CardTitle>
                <CardDescription>Todas las evaluaciones registradas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {evaluations.map((evaluation: any) => (
                    <div key={evaluation.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">
                            {format(new Date(evaluation.evaluation_period_start), 'MMM yyyy', { locale: es })} -{' '}
                            {format(new Date(evaluation.evaluation_period_end), 'MMM yyyy', { locale: es })}
                          </p>
                          <Badge variant={evaluation.status === 'aprobada' ? 'default' : 'outline'} className="mt-1">
                            {evaluation.status === 'aprobada' ? 'Aprobada' : evaluation.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{evaluation.overall_score || 0}</p>
                          <p className="text-xs text-muted-foreground">Puntuación</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Técnicas:</span>{' '}
                          <span className="font-medium">{evaluation.technical_skills_score || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Productividad:</span>{' '}
                          <span className="font-medium">{evaluation.productivity_score || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Blandas:</span>{' '}
                          <span className="font-medium">{evaluation.soft_skills_score || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {evaluations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sin evaluaciones registradas</h3>
                <p className="text-muted-foreground">
                  Este empleado aún no tiene evaluaciones de desempeño registradas.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
