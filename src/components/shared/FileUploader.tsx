import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, File as FileIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase as publicSupabase } from '@/integrations/supabase/client';
import { getSupabaseWithAuth } from '@/lib/supabase-with-auth';
import { toast } from 'sonner';

interface FileUploaderProps {
  bucket: string;
  path?: string;
  accept?: string;
  maxSize?: number; // in MB
  onUploadComplete?: (path: string) => void;
  onUploadError?: (error: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  className?: string;
}

export function FileUploader({
  bucket,
  path = '',
  accept,
  maxSize = 50,
  onUploadComplete,
  onUploadError,
  onUploadingChange,
  className,
}: FileUploaderProps) {
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [bucketExists, setBucketExists] = useState<boolean | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: globalThis.File): string | null => {
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `El archivo excede el tamaño máximo de ${maxSize}MB`;
    }
    return null;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const droppedFile = e.dataTransfer.files[0];
        const error = validateFile(droppedFile);
        if (error) {
          toast.error(error);
          return;
        }
        setFile(droppedFile);
      }
    },
    [maxSize]
  );

    // Preflight: comprobar si el bucket existe para evitar intentar subir y mostrar instrucciones
    useEffect(() => {
      let mounted = true;
      // Allow explicit `any` here because the integration module may not export a typed client.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storage = (publicSupabase as any).storage;
      const check = async () => {
        if (!storage) return setBucketExists(null);
        try {
          // Usar el cliente público para las operaciones de Storage (evita depender de RLS en storage.objects)
          // use authenticated client when available to respect RLS policies
          const client = getSupabaseWithAuth();
          const { data, error } = await client.storage.from(bucket).list('', { limit: 1 });
          if (!mounted) return;
          if (error) {
            console.error('Bucket preflight list error', { bucket, status, error });
            setBucketExists(false);
          } else {
            setBucketExists(true);
          }
        } catch (e) {
          console.error('Bucket preflight caught error', { bucket, e });
          if (!mounted) return;
          setBucketExists(false);
        }
      };
      check();
      return () => {
        mounted = false;
      };
    }, [bucket]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const error = validateFile(selectedFile);
      if (error) {
        toast.error(error);
        return;
      }
      setFile(selectedFile);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    onUploadingChange?.(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      const client = getSupabaseWithAuth();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: uploadError } = await (client as any).storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onUploadProgress: (progress: any) => {
            const percent = (progress.loaded / progress.total) * 100;
            setProgress(percent);
          },
        });

      if (uploadError) {
        // Detect common bucket-not-found patterns and return a helpful message
        const raw = String(uploadError.message || uploadError.error || uploadError);
        if (/bucket not found/i.test(raw) || (/not found/i.test(raw) && /bucket/i.test(raw))) {
          const userMessage = `Bucket "${bucket}" not found in Supabase Storage. Crea el bucket en la consola de Supabase o usa otro nombre.`;
          console.error('Bucket not found:', bucket, uploadError);
          toast.error(userMessage);
          onUploadError?.(userMessage);
          setUploading(false);
          onUploadingChange?.(false);
          return;
        }

        throw uploadError;
      }

      toast.success('Archivo subido exitosamente');
      onUploadComplete?.(filePath);
      setFile(null);
      setProgress(0);
      onUploadingChange?.(false);
    } catch (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: any
    ) {
      console.error('Error uploading file:', error);
      const errorMessage = error.message || 'Error al subir el archivo';
      toast.error(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'relative z-0 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors overflow-hidden',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 bg-muted/5',
          !uploading && 'hover:bg-muted/10 cursor-pointer'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          // Open file dialog only if bucket seems available and not uploading
          if (bucketExists === false) return;
          if (!uploading && fileInputRef.current) fileInputRef.current.click();
        }}
      >
        {/* hidden input triggered programmatically to avoid covering adjacent buttons */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={accept}
          disabled={uploading}
        />

        {!file ? (
          <div className="flex flex-col items-center justify-center text-center p-6">
            <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Arrastra un archivo aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground">
              Tamaño máximo: {maxSize}MB
            </p>
            {bucketExists === false && (
              <p className="mt-2 text-xs text-yellow-600">
                Bucket "{bucket}" no encontrado. Crea el bucket en la consola de Supabase o cambia el nombre del bucket.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full p-6">
            <FileIcon className="w-12 h-12 mb-4 text-primary" />
            <p className="text-sm font-medium mb-1 truncate max-w-full px-4">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>

            {uploading && (
              <div className="w-full max-w-xs space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  Subiendo... {Math.round(progress)}%
                </p>
              </div>
            )}

            {!uploading && (
              <div className="flex gap-2">
                <Button onClick={uploadFile} size="sm">
                  Subir archivo
                </Button>
                <Button
                  onClick={() => setFile(null)}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
