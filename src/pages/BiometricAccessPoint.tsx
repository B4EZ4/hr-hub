import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BiometricEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  device_id: string;
  created_at: string;
  hash: string | null;
  metadata: any;
}

export default function BiometricAccessPoint() {
  const [events, setEvents] = useState<BiometricEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Cargar últimos eventos
    loadRecentEvents();

    // Suscribirse a nuevos eventos en tiempo real
    const channel = supabase
      .channel('biometric_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'biometric_events'
        },
        (payload) => {
          const newEvent = payload.new as BiometricEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, 10));
          
          // Mostrar notificación según el tipo de evento
          if (newEvent.event_type === 'verify') {
            toast({
              title: '✓ Acceso autorizado',
              description: newEvent.metadata?.user_name || 'Usuario verificado',
              variant: 'default',
            });
          } else if (newEvent.event_type === 'fail' || newEvent.event_type === 'access_denied') {
            toast({
              title: '✗ Acceso denegado',
              description: 'Huella no reconocida',
              variant: 'destructive',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const loadRecentEvents = async () => {
    const { data, error } = await supabase
      .from('biometric_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading events:', error);
      return;
    }

    setEvents(data || []);
  };

  const simulateVerification = async () => {
    setIsProcessing(true);
    
    // Simular comunicación con ESP32
    setTimeout(() => {
      toast({
        title: 'Esperando huella...',
        description: 'Por favor coloque su dedo en el sensor',
      });
      setIsProcessing(false);
    }, 1000);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'verify':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'fail':
      case 'access_denied':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'enroll':
        return <Fingerprint className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getEventBadgeVariant = (eventType: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (eventType) {
      case 'verify':
        return 'default';
      case 'fail':
      case 'access_denied':
        return 'destructive';
      case 'enroll':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatEventType = (eventType: string) => {
    const types: Record<string, string> = {
      'verify': 'Verificación exitosa',
      'fail': 'Fallo de verificación',
      'access_denied': 'Acceso denegado',
      'enroll': 'Enrolamiento'
    };
    return types[eventType] || eventType;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Fingerprint className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl">Control de Acceso Biométrico</CardTitle>
            <CardDescription className="text-lg">
              Sistema de marcaje con lector de huellas AS608
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={simulateVerification}
              disabled={isProcessing}
              size="lg"
              className="w-full h-16 text-lg"
            >
              {isProcessing ? (
                <>
                  <Clock className="mr-2 h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-5 w-5" />
                  Iniciar Verificación
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Dispositivo conectado: <span className="font-mono text-foreground">ESP32-001</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eventos Recientes</CardTitle>
            <CardDescription>Últimos 10 registros biométricos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay eventos registrados
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getEventIcon(event.event_type)}
                      <div>
                        <div className="font-medium">
                          {event.metadata?.user_name || 'Usuario no identificado'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleString('es-ES')}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getEventBadgeVariant(event.event_type)}>
                      {formatEventType(event.event_type)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>Sistema de Control Biométrico v1.0</p>
          <p>Solo para uso en punto de acceso • Sin acceso a otros módulos</p>
        </div>
      </div>
    </div>
  );
}
