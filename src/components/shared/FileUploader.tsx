import { useState, useCallback } from 'react';
import { Upload, X, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileUploaderProps {
  bucket: string;
  path?: string;
  accept?: string;
  maxSize?: number; // in MB
  onUploadComplete?: (path: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export function FileUploader({
  bucket,
  path = '',
  accept,
  maxSize = 50,
  onUploadComplete,
  onUploadError,
  className,
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
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
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      const { error: uploadError } = await (supabase as any).storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress: any) => {
            const percent = (progress.loaded / progress.total) * 100;
            setProgress(percent);
          },
        });

      if (uploadError) throw uploadError;

      toast.success('Archivo subido exitosamente');
      onUploadComplete?.(filePath);
      setFile(null);
      setProgress(0);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      const errorMessage = error.message || 'Error al subir el archivo';
      toast.error(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg transition-colors',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 bg-muted/5',
          !uploading && 'hover:bg-muted/10 cursor-pointer'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full p-6">
            <File className="w-12 h-12 mb-4 text-primary" />
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
