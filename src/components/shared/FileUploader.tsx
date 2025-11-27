import { useState, useCallback, useRef } from 'react';
import { Upload, X, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FileUploaderProps {
  bucket: string;
  path?: string;
  accept?: string;
  maxSize?: number; // in MB
  onFileSelected?: (file: globalThis.File | null) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export function FileUploader({
  bucket,
  path = '',
  accept = '.pdf',
  maxSize = 50,
  onFileSelected,
  onUploadError,
  className,
}: FileUploaderProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = useCallback((f: globalThis.File): string | null => {
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (f.size > maxSizeBytes) return `El archivo excede el tamaño máximo de ${maxSize}MB`;

    // Accept only PDF files (by MIME type or .pdf extension as fallback)
    const isPdfMime = f.type === 'application/pdf';
    const nameLower = f.name.toLowerCase();
    const hasPdfExt = nameLower.endsWith('.pdf');
    if (!isPdfMime && !hasPdfExt) return 'Solo se permiten archivos PDF (.pdf)';

    return null;
  }, [maxSize]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      toast.error(err);
      onUploadError?.(err);
      return;
    }
    setFile(f);
    onFileSelected?.(f);
  }, [onFileSelected, onUploadError, validateFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      toast.error(err);
      onUploadError?.(err);
      return;
    }
    setFile(f);
    onFileSelected?.(f);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'relative z-0 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors overflow-hidden',
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 bg-muted/5',
          'hover:bg-muted/10 cursor-pointer'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (!user?.id) {
            const msg = 'Debes iniciar sesión para seleccionar archivos.';
            toast.error(msg);
            onUploadError?.(msg);
            return;
          }
          fileInputRef.current?.click();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={accept}
        />

        {!file ? (
          <div className="flex flex-col items-center justify-center text-center p-6">
              <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Arrastra un PDF (.pdf) aquí o haz clic para seleccionar</p>
            <p className="text-xs text-muted-foreground">Tamaño máximo: {maxSize}MB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full p-6">
            <FileIcon className="w-12 h-12 mb-4 text-primary" />
            <p className="text-sm font-medium mb-1 truncate max-w-full px-4">{file.name}</p>
            <p className="text-xs text-muted-foreground mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setFile(null);
                  onFileSelected?.(null);
                }}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
