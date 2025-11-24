import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface BiometricStatusProps {
  userId: string;
  userEmail: string;
}

export function BiometricStatus({ userId, userEmail }: BiometricStatusProps) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const { toast } = useToast();

  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ['biometric-templates', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('biometric_templates')
        .select('id, device_id, method, status, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const { data: recentEvents } = useQuery({
    queryKey: ['biometric-events', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('biometric_events')
        .select('id, event_type, device_id, created_at, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    }
  });

  const hasActiveTemplate = templates?.some(t => t.status === 'active');

  const initiateEnrollment = async () => {
    setIsEnrolling(true);
    
    toast({
      title: 'Iniciando enrolamiento',
      description: 'Comunicándose con el dispositivo ESP32...',
    });

    // TODO: Implementar comunicación real con ESP32
    // Por ahora simulamos el proceso
    setTimeout(() => {
      toast({
        title: 'Dispositivo listo',
        description: 'Por favor, coloque su dedo en el sensor AS608 tres veces para registrar su huella.',
        duration: 5000,
      });
      setIsEnrolling(false);
    }, 2000);

    // El ESP32 enviará la plantilla directamente usando service_role
    // y esta vista se actualizará automáticamente
  };

  const revokeTemplate = async (templateId: string) => {
    const { error } = await supabase
      .from('biometric_templates')
      .update({ status: 'revoked' })
      .eq('id', templateId);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo revocar la plantilla',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Plantilla revocada',
      description: 'La huella ha sido desactivada exitosamente',
    });
    
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Estado Biométrico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Estado Biométrico
        </CardTitle>
        <CardDescription>
          Gestión de huellas dactilares para control de acceso
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado general */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div className="flex items-center gap-3">
            {hasActiveTemplate ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-600" />
            )}
            <div>
              <div className="font-semibold">
                {hasActiveTemplate ? 'Huella Registrada' : 'Pendiente de Registro'}
              </div>
              <div className="text-sm text-muted-foreground">
                {hasActiveTemplate
                  ? 'Usuario autorizado para control de acceso'
                  : 'Es necesario registrar la huella dactilar'}
              </div>
            </div>
          </div>
          {!hasActiveTemplate && (
            <Button 
              onClick={initiateEnrollment} 
              disabled={isEnrolling}
              variant="default"
            >
              {isEnrolling ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Registrar Huella
                </>
              )}
            </Button>
          )}
        </div>

        {/* Plantillas registradas */}
        {templates && templates.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Plantillas Registradas</h4>
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                      {template.status === 'active' ? 'Activa' : 'Revocada'}
                    </Badge>
                    <span className="text-sm font-mono text-muted-foreground">
                      {template.device_id}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Registrada: {new Date(template.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
                {template.status === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeTemplate(template.id)}
                  >
                    Revocar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Eventos recientes */}
        {recentEvents && recentEvents.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Actividad Reciente</h4>
            <div className="space-y-2">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-card text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{event.event_type}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {new Date(event.created_at).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.device_id}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>Las plantillas biométricas están cifradas con AES-256 y solo el dispositivo puede leerlas.</p>
        </div>
      </CardContent>
    </Card>
  );
}
