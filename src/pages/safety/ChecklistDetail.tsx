import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, ListChecks, FileText, AlertCircle } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';

export default function ChecklistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManageSH } = useRoles();

  const { data: checklist, isLoading } = useQuery({
    queryKey: ['checklist-detail', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sh_checklists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const categoryMap: Record<string, { label: string; icon: string }> = {
    inspeccion: { label: 'Inspección', icon: '🔍' },
    auditoria: { label: 'Auditoría', icon: '📋' },
    epp: { label: 'EPP', icon: '🦺' },
    capacitacion: { label: 'Capacitación', icon: '📚' },
    otro: { label: 'Otro', icon: '📄' },
  };

  const severityMap: Record<string, { label: string; variant: any }> = {
    baja: { label: 'Baja', variant: 'default' },
    media: { label: 'Media', variant: 'default' },
    alta: { label: 'Alta', variant: 'destructive' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <ListChecks className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Checklist no encontrado</h2>
        <Button onClick={() => navigate('/seguridad-higiene/checklists')}>
          Volver a Checklists
        </Button>
      </div>
    );
  }

  const category = categoryMap[checklist.category] || { label: checklist.category, icon: '📄' };
  const items = checklist.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/seguridad-higiene/checklists')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ListChecks className="h-8 w-8 text-primary" />
              {checklist.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl">{category.icon}</span>
              <Badge variant="outline">{category.label}</Badge>
              {checklist.is_active ? (
                <Badge variant="success">Activo</Badge>
              ) : (
                <Badge variant="outline">Inactivo</Badge>
              )}
            </div>
          </div>
        </div>
        {canManageSH && (
          <Button onClick={() => navigate(`/seguridad-higiene/checklists/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Categoría</label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                <span className="font-medium">{category.label}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <div className="mt-1">
                {checklist.is_active ? (
                  <Badge variant="success">✅ Activo</Badge>
                ) : (
                  <Badge variant="outline">❌ Inactivo</Badge>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Total de Items</label>
              <p className="mt-1 text-2xl font-bold">{items.length}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Creado</label>
              <p className="mt-1 text-sm">
                {new Date(checklist.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            {checklist.description ? (
              <p className="whitespace-pre-wrap">{checklist.description}</p>
            ) : (
              <p className="text-muted-foreground italic">Sin descripción</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Items del Checklist ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item: any, index: number) => {
                const severity = item.severity ? severityMap[item.severity] : null;
                
                return (
                  <div 
                    key={item.id || index} 
                    className="p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-muted-foreground">#{index + 1}</span>
                          <p className="font-medium">{item.question}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm">
                          <Badge variant="outline" className="capitalize">
                            {item.type === 'boolean' ? '☑️ Sí/No' : 
                             item.type === 'text' ? '📝 Texto' : 
                             item.type === 'select' ? '📋 Selección' : 
                             item.type}
                          </Badge>
                          
                          {severity && (
                            <Badge variant={severity.variant} className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Severidad: {severity.label}
                            </Badge>
                          )}
                          
                          {item.required && (
                            <Badge variant="destructive">⚠️ Obligatorio</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ListChecks className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay items en este checklist</p>
              <p className="text-sm mt-2">Edita el checklist para agregar items</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate('/seguridad-higiene/checklists')}>
          Volver a Checklists
        </Button>
        {canManageSH && (
          <Button onClick={() => navigate(`/seguridad-higiene/checklists/${id}/edit`)}>
            Editar Checklist
          </Button>
        )}
      </div>
    </div>
  );
}
