import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ClipboardList, Package, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SafetyHome() {
  const navigate = useNavigate();

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Seguridad e Higiene</h1>
        <p className="text-muted-foreground">Centro de control de inspecciones, sectores e inventario (EPP y equipos)</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Inspecciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Planificación, ejecución y seguimiento de inspecciones.</p>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/seguridad-higiene/inspecciones')}>Ver</Button>
              <Button variant="outline" onClick={() => navigate('/seguridad-higiene/sectores')}>Sectores</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" /> Checklists
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Listas de verificación reutilizables para inspecciones.</p>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/seguridad-higiene/checklists')}>Ver</Button>
              <Button variant="outline" onClick={() => navigate('/seguridad-higiene/checklists/new')}>Crear</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Inventario S&H
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Gestión de EPP, herramientas y equipos vinculados a S&H.</p>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/seguridad-higiene/inventario')}>Ver</Button>
              <Button variant="outline" onClick={() => navigate('/seguridad-higiene/inventario/asignar')}>Asignar</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Documentación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Accede al repositorio de documentación corporativa.</p>
            <div>
              <Button onClick={() => navigate('/documentos')}>Abrir</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
