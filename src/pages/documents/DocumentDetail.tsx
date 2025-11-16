import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Eye, Trash2, Upload, History } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { FileUploader } from '@/components/shared/FileUploader';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canManageUsers } = useRoles();
  const [showUploader, setShowUploader] = useState(false);

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('documents')
        .select(`
          *,
          uploader:uploaded_by (full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Delete file from storage
      if (document?.file_path) {
        await supabase.storage.from('documents').remove([document.file_path]);
      }
      
      // Delete record from database
      const { error } = await (supabase as any)
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento eliminado');
      navigate('/documentos');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar documento');
    },
  });

  const updateVersionMutation = useMutation({
    mutationFn: async (newFilePath: string) => {
      const { error } = await (supabase as any)
        .from('documents')
        .update({
          file_path: newFilePath,
          version: (document?.version || 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('Nueva versión subida');
      setShowUploader(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar versión');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">Documento no encontrado</p>
        <Button onClick={() => navigate('/documentos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  const handleDownload = () => {
    const { data } = supabase.storage.from('documents').getPublicUrl(document.file_path);
    window.open(data.publicUrl, '_blank');
  };

  const handleView = () => {
    const { data } = supabase.storage.from('documents').getPublicUrl(document.file_path);
    window.open(data.publicUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/documentos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
            <p className="text-muted-foreground">Versión {document.version}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={document.is_public ? 'success' : 'default'}>
            {document.is_public ? 'Público' : 'Privado'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Categoría</p>
              <p className="font-medium">{document.category}</p>
            </div>
            {document.description && (
              <div>
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="font-medium">{document.description}</p>
              </div>
            )}
            {document.tags && document.tags.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Etiquetas</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {document.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            {document.file_size && (
              <div>
                <p className="text-sm text-muted-foreground">Tamaño</p>
                <p className="font-medium">{(document.file_size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles de Subida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Subido por</p>
              <p className="font-medium">{document.uploader?.full_name}</p>
              <p className="text-sm text-muted-foreground">{document.uploader?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de creación</p>
              <p className="font-medium">{new Date(document.created_at).toLocaleString('es-ES')}</p>
            </div>
            {document.updated_at && document.updated_at !== document.created_at && (
              <div>
                <p className="text-sm text-muted-foreground">Última actualización</p>
                <p className="font-medium">{new Date(document.updated_at).toLocaleString('es-ES')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleView} variant="default">
              <Eye className="mr-2 h-4 w-4" />
              Ver Documento
            </Button>
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
            {canManageUsers && (
              <>
                <Button onClick={() => setShowUploader(!showUploader)} variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Nueva Versión
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. El documento y todas sus versiones serán eliminados permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>

          {showUploader && canManageUsers && (
            <div className="mt-6 p-4 border rounded-lg">
              <h3 className="font-medium mb-4">Subir nueva versión</h3>
              <FileUploader
                bucket="documents"
                path={`${document.category}/${document.id}`}
                onUploadComplete={(path) => {
                  updateVersionMutation.mutate(path);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
