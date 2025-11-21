import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Shield, Users, User, Lock, Bell } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const navigate = useNavigate();
  const { isSuperadmin } = useRoles();
  const { user } = useAuth();

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Administra tu perfil y la configuración del sistema
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Mi Perfil
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-2 h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          {isSuperadmin && (
            <TabsTrigger value="admin">
              <Shield className="mr-2 h-4 w-4" />
              Administración
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input id="full_name" defaultValue={profile?.full_name} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={profile?.email} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" defaultValue={profile?.phone} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Departamento</Label>
                <Input id="department" defaultValue={profile?.department} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="position">Posición</Label>
                <Input id="position" defaultValue={profile?.position} disabled />
              </div>
              <Separator />
              <Button>Guardar Cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Actualiza tu contraseña de acceso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current_password">Contraseña Actual</Label>
                <Input id="current_password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new_password">Nueva Contraseña</Label>
                <Input id="new_password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
                <Input id="confirm_password" type="password" />
              </div>
              <Separator />
              <Button>Cambiar Contraseña</Button>
            </CardContent>
          </Card>

          {profile?.must_change_password && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Cambio de Contraseña Requerido</CardTitle>
                <CardDescription>
                  Debes cambiar tu contraseña antes de continuar
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription>
                Configura cómo deseas recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir actualizaciones por correo electrónico
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones de Contratos</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas sobre entrevistas y candidatos
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones de Vacaciones</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas sobre solicitudes de vacaciones
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones de Incidencias</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas sobre nuevas incidencias
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isSuperadmin && (
          <TabsContent value="admin" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/settings/roles')}>
                <CardHeader>
                  <Shield className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Gestión de Roles</CardTitle>
                  <CardDescription>
                    Administra los roles y permisos de los usuarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Administrar Roles
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
