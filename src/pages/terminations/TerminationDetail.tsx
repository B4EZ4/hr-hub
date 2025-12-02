import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileUploader } from '@/components/shared/FileUploader';
import { ArrowLeft, Edit, FileText, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

const statusMap = {
  pendiente: { label: 'Pendiente', variant: 'secondary' as const },
  en_proceso: { label: 'En Proceso', variant: 'default' as const },
  completado: { label: 'Completado', variant: 'success' as const },
  cancelado: { label: 'Cancelado', variant: 'destructive' as const },
};

const tipoMap = {
  voluntario: 'Voluntario',
  involuntario: 'Involuntario',
  mutuo_acuerdo: 'Mutuo Acuerdo',
  termino_contrato: 'Término de Contrato',
};

export default function TerminationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  const { data: termination, isLoading } = useQuery({
    queryKey: ['termination', id],
    queryFn: async () => {
      const { data: despido, error: despidoError } = await supabase
        .from('despidos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (despidoError) throw despidoError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, phone, department, position')
        .eq('user_id', despido.employee_id)
        .single();

      if (profileError) throw profileError;

      return { ...despido, profiles: profile };
    },
  });

  const { data: documents } = useQuery({
    queryKey: ['termination-documents', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('despido_documentos')
        .select('*')
        .eq('despido_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;
    if (!termination?.employee_id) {
      toast.error('No se encontró el empleado asociado al despido');
      return;
    }

    try {
      const bucketName = 'documents';
      const prefix = 'despidos';
      const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storagePath = `${prefix}/${termination.employee_id}/${safeFileName}`;

      const { data, error } = await supabase.storage.from(bucketName).upload(storagePath, file);
      if (error) throw error;

      const storedPath = (data as any)?.path ?? storagePath;
      // Call the mutation that inserts the document row and registers audit
      uploadMutation.mutate(storedPath);
    } catch (err: any) {
      console.error('Error uploading termination document', err);
      toast.error(err?.message || 'Error al subir el documento');
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (filePath: string) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const fileName = filePath.split('/').pop() || 'documento';

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { error } = await supabase.from('despido_documentos').insert({
        despido_id: id,
        tipo_documento: 'general',
        nombre_archivo: fileName,
        file_path: filePath,
        uploaded_by: userId,
      });

      if (error) {
        // Compensación: borrar archivo si falla la inserción
        await supabase.storage.from('documents').remove([filePath]);
        throw error;
      }

      // Registrar auditoría
      await supabase.from('despido_audit').insert({
        despido_id: id,
        action: 'UPLOAD_DOCUMENT',
        user_id: userId,
        new_values: { file_path: filePath, nombre_archivo: fileName },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['termination-documents', id] });
      toast.success('Documento subido correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al subir el documento');
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const doc = documents?.find(d => d.id === docId);

      // Registrar auditoría
      await supabase.from('despido_audit').insert({
        despido_id: id,
        action: 'DELETE_DOCUMENT',
        user_id: userId,
        old_values: doc,
      });

      const { error } = await supabase
        .from('despido_documentos')
        .delete()
        .eq('id', docId);
      
      if (error) throw error;

      // Borrar archivo del storage (bucket `documents`, path stored in file_path)
      if (doc?.file_path) {
        await supabase.storage.from('documents').remove([doc.file_path]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['termination-documents', id] });
      toast.success('Documento eliminado correctamente');
      setDeleteDocId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el documento');
    },
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Cargando...</div>;
  }

  if (!termination) {
    return <div className="text-center py-8">No se encontró el despido</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate('/despidos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Button onClick={() => navigate(`/despidos/${id}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Detalle del Despido</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Registrado el {format(new Date(termination.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
              </p>
            </div>
            <Badge variant={statusMap[termination.estado as keyof typeof statusMap]?.variant}>
              {statusMap[termination.estado as keyof typeof statusMap]?.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Información del Empleado</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Nombre:</span>
                <p className="font-medium">{termination.profiles?.full_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{termination.profiles?.email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Teléfono:</span>
                <p className="font-medium">{termination.profiles?.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Departamento:</span>
                <p className="font-medium">{termination.profiles?.department || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cargo:</span>
                <p className="font-medium">{termination.profiles?.position || 'N/A'}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">Información del Despido</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Fecha de Despido:</span>
                <p className="font-medium">
                  {format(new Date(termination.fecha_despido), 'dd/MM/yyyy', { locale: es })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <p className="font-medium">{tipoMap[termination.tipo_despido as keyof typeof tipoMap]}</p>
              </div>
              {termination.indemnizacion && (
                <div>
                  <span className="text-muted-foreground">Indemnización:</span>
                  <p className="font-medium">${termination.indemnizacion.toLocaleString()}</p>
                </div>
              )}
              {termination.liquidacion_final && (
                <div>
                  <span className="text-muted-foreground">Liquidación Final:</span>
                  <p className="font-medium">${termination.liquidacion_final.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="text-muted-foreground text-sm">Motivo:</span>
            <p className="mt-1">{termination.motivo}</p>
          </div>

          {termination.observaciones && (
            <div>
              <span className="text-muted-foreground text-sm">Observaciones:</span>
              <p className="mt-1">{termination.observaciones}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos Asociados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUploader
            bucket="documents"
            accept={'image/*,.pdf'}
            maxSize={10}
            onFileSelected={handleFileSelected}
            onUploadError={(err) => toast.error(`Error: ${err}`)}
          />

          {documents && documents.length > 0 && (
            <div className="space-y-2 mt-6">
              <h4 className="font-medium text-sm">Documentos cargados:</h4>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.nombre_archivo}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const { data } = supabase.storage.from('documents').getPublicUrl(doc.file_path);
                          window.open(data.publicUrl, '_blank');
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDocId(doc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDocId && deleteDocMutation.mutate(deleteDocId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
