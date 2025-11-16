import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Key, Database, Settings as SettingsIcon } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { isSuperadmin, isAdminRRHH } = useRoles();
  const navigate = useNavigate();

  const settingsCards = [
    {
      title: 'Roles y Permisos',
      description: 'Gestiona roles de usuario y permisos del sistema',
      icon: Shield,
      action: () => navigate('/settings/roles'),
      visible: isSuperadmin,
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Administra cuentas y accesos de usuarios',
      icon: Users,
      action: () => navigate('/usuarios'),
      visible: isSuperadmin || isAdminRRHH,
    },
    {
      title: 'Configuración de Sistema',
      description: 'Ajustes generales y preferencias del sistema',
      icon: SettingsIcon,
      action: () => {},
      visible: isSuperadmin,
    },
    {
      title: 'Logs de Auditoría',
      description: 'Revisa el historial de actividades del sistema',
      icon: Database,
      action: () => navigate('/settings/audit-logs'),
      visible: isSuperadmin,
    },
    {
      title: 'Seguridad',
      description: 'Políticas de seguridad y autenticación',
      icon: Key,
      action: () => {},
      visible: isSuperadmin,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Administra la configuración del sistema
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {settingsCards
          .filter((card) => card.visible)
          .map((card) => (
            <Card key={card.title} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={card.action}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <card.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>

      {!isSuperadmin && !isAdminRRHH && (
        <Card>
          <CardHeader>
            <CardTitle>Acceso Restringido</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a la configuración del sistema.
              Contacta con un administrador si necesitas realizar cambios.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
