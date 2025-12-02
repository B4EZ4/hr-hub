import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Printer, User, Calendar } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
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
import { toast } from 'sonner';

export default function VacationsList() {
  const { user } = useAuth();
  const { canApproveVacations } = useRoles();
  const queryClient = useQueryClient();

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [printData, setPrintData] = useState<any | null>(null);

  // --- QUERY: CARGAR DATOS (ESTRATEGIA SEGURA MANUAL JOIN) ---
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['vacation-requests-list'],
    queryFn: async () => {
      console.log("⚡ Iniciando carga de solicitudes...");

      // 1. Cargar las solicitudes "crudas"
      let query = (supabase as any)
        .from('vacation_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!canApproveVacations) {
        query = query.eq('user_id', user?.id);
      }

      const { data: rawRequests, error: reqError } = await query;

      if (reqError) {
        console.error("❌ Error base solicitudes:", reqError);
        toast.error("Error al cargar la lista base");
        throw reqError;
      }

      if (!rawRequests || rawRequests.length === 0) return [];

      // 2. Obtener IDs de usuarios
      const userIds = [...new Set(rawRequests.map((r: any) => r.user_id))];

      // 3. Buscar perfiles
      const { data: profiles, error: profError } = await (supabase as any)
        .from('profiles')
        .select('user_id, full_name, email, areas(name), positions(title)')
        .in('user_id', userIds);

      if (profError) {
        console.error("⚠️ Error cargando perfiles:", profError);
      }

      // 4. Unir datos
     const combinedData = rawRequests.map((request: any) => {
        const profile = profiles?.find((p: any) => p.user_id === request.user_id);
        return {
          ...request,
          //AGREGAMOS ESTO: Un objeto especial que tiene ambas fechas juntas
          fechas_info: { 
            start: request.start_date, 
            end: request.end_date 
          },
          profiles: profile || {
            full_name: 'Usuario Desconocido',
            email: 'No disponible',
            areas: { name: '-' },
            positions: { title: '-' }
          }
        };
      });
      console.log("✅ Datos combinados exitosamente:", combinedData);
      return combinedData;
    },
  });

// --- MUTATION: APROBAR / RECHAZAR (CONECTADA A EDGE FUNCTION) ---
  const approvalMutation = useMutation({
    mutationFn: async ({ request, status }: { request: any; status: 'approved' | 'rejected' }) => {
      console.log("⚡ INICIANDO PROCESO DE APROBACIÓN PARA:", request.id);
      toast.info("Procesando solicitud y generando documento oficial...");

      // 1. Actualizar el estado en 'vacation_requests'
      const { error: updateError } = await (supabase as any)
        .from('vacation_requests')
        .update({ status })
        .eq('id', request.id);

      if (updateError) {
        console.error("❌ Error actualizando solicitud:", updateError);
        throw updateError;
      }

      // 2. LLAMAR AL SERVIDOR PARA GENERAR PDF
      // Obtenemos el token de sesión actual para validar permiso si es necesario
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let generatedFilePath = '';

      try {
          const response = await fetch(
            `https://dzwxepnmyoawcikkldof.supabase.co/functions/v1/generate-vacation-pdf`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                  request_id: request.id, 
                  status: status 
              }),
            }
          );

          if (!response.ok) {
              const errText = await response.text();
              throw new Error(`Error del servidor generando PDF: ${errText}`);
          }

          const result = await response.json();
          generatedFilePath = result.file_path; // La ruta REAL del archivo en Storage
          console.log("✅ PDF generado en servidor:", generatedFilePath);

      } catch (pdfError: any) {
          console.error("⚠️ Falló la generación del PDF:", pdfError);
          toast.warning("La solicitud se procesó, pero hubo un error generando el PDF.");
          // Opcional: Podrías detener aquí si el PDF es obligatorio, 
          // pero usualmente dejamos pasar para no bloquear la operación administrativa.
      }

      // 3. GENERAR REGISTRO EN DOCUMENTOS (Con la ruta real)
      const docStatus = status === 'approved' ? 'validado' : 'rechazado'; 
      
      const docTitle = status === 'approved' 
        ? `Vacaciones Aprobadas: ${request.profiles?.full_name || 'Empleado'}`
        : `Vacaciones Rechazadas: ${request.profiles?.full_name || 'Empleado'}`;

      // Usamos la ruta generada si existe, si no, ponemos un placeholder de error para no romper la app
      // Nota: Si generatedFilePath está vacío, el botón "Ver" no funcionará, pero el registro existirá.
      const finalPath = generatedFilePath || `error/logs/${request.id}`; 

      const newDocument = {
          title: docTitle,
          category: 'Recursos Humanos',
          description: `Solicitud del ${safeDate(request.start_date)} al ${safeDate(request.end_date)}.`,
          
          file_path: finalPath, // <--- AQUÍ VA LA RUTA REAL
          file_size: 0,         // Podrías devolver el tamaño desde la función si quisieras ser preciso
          mime_type: 'application/pdf', // Ahora sí es un PDF real
          
          uploaded_by: user?.id,
          employee_id: request.user_id,
          
          estado: docStatus,
          is_public: false
      };

      console.log("📄 Insertando documento oficial:", newDocument);

      const { data: insertData, error: docError } = await (supabase as any)
        .from('documents')
        .insert(newDocument)
        .select();

      if (docError) {
          console.error("❌ Error insertando registro de documento:", docError);
          toast.error(`Error guardando el registro: ${docError.message}`);
      } else {
          console.log("✅ ÉXITO: Documento registrado:", insertData);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vacation-requests-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-pending'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'todos', 'todos'] });
      
      toast.success(variables.status === 'approved' ? 'Aprobado y documento generado' : 'Rechazado y documento generado');
      setSelectedRequest(null);
      setActionType(null);
    },
    onError: (err: any) => toast.error("Error general: " + err.message),
  });
  // --- IMPRESIÓN ---
  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [printData]);

  // --- HELPER PARA FECHAS SEGURAS (Evita error de zona horaria) ---
  const safeDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
  };
  // --- COLUMNAS ---
  const columns: any[] = [
    {
      header: 'Colaborador',
      accessorKey: 'profiles',
      cell: (value: any) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
            {value?.full_name?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-medium text-sm">{value?.full_name || 'Desconocido'}</p>
            <p className="text-xs text-muted-foreground">{value?.positions?.title || 'General'}</p>
          </div>
        </div>
      ),
    },
    {
    header: 'Departamento',
      // Reutilizamos 'profiles' porque ahí vive la info del área
      accessorKey: 'profiles', 
      id: 'dept_col', // ID único para no confundir a la tabla
      cell: (p: any) => <span className="text-sm">{p?.areas?.name || '-'}</span>,
    },
    {
    header: 'Fechas',
      // 1. Apuntamos al nuevo campo que creamos arriba
      accessorKey: 'fechas_info', 
      id: 'date_range', 
      // 2. Recibimos 'val', que YA ES el objeto { start, end }
      cell: (val: any) => {
        // Validación de seguridad por si viene vacío
        if (!val) return <span className="text-muted-foreground">-</span>;
        
        return (
          <div className="flex flex-col justify-center">
            <span className="font-medium text-sm text-gray-900">
                Del {safeDate(val.start)}
            </span>
            <span className="text-xs text-muted-foreground">
                al {safeDate(val.end)}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Días',
      accessorKey: 'days_requested',
      cell: (val: number) => <Badge variant="outline" className="font-bold">{val} días</Badge>
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: (status: string) => {
        const s = status?.toLowerCase() || 'pending';
        let className = 'bg-gray-100 text-gray-800 border-gray-200';
        let label = 'Pendiente';

        if (s === 'approved' || s === 'aprobado') {
          className = 'bg-green-100 text-green-700 border-green-200';
          label = 'Aprobado';
        } else if (s === 'rejected' || s === 'rechazado') {
          className = 'bg-red-100 text-red-700 border-red-200';
          label = 'Rechazado';
        } else {
          className = 'bg-yellow-50 text-yellow-700 border-yellow-200';
          label = 'Pendiente';
        }

        return <Badge className={`border ${className} hover:${className}`}>{label}</Badge>;
      }
    }
  ];

  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-doc, #printable-doc * { visibility: visible; }
          #printable-doc {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white; z-index: 9999;
            display: block !important;
            overflow: hidden; /* Corta cualquier sobrante */
            max-height: 100vh; /* Fuerza a que no mida más de 1 "pantalla/hoja" */
            page-break-after: avoid; /* Evita saltos de página forzados */
            page-break-inside: avoid;
          }
          @page {size: auto; margin: 0mm; }
        }
      `}</style>

      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Revisión de Solicitudes</h2>
          <p className="text-muted-foreground">
            {canApproveVacations ? 'Autoriza o rechaza las solicitudes pendientes.' : 'Historial de tus solicitudes.'}
          </p>
        </div>
      </div>
      <DataTable
        data={requests}
        columns={columns}
        searchable
        searchPlaceholder="Buscar por nombre..."
        emptyMessage="No se encontraron solicitudes registradas."
        actions={(row: any) => (
          <div className="flex items-center gap-1 justify-end">
            <Button
              size="icon"
              variant="ghost"
              title="Imprimir Formato"
              className="h-8 w-8 text-gray-500 hover:text-blue-600"
              onClick={(e) => { e.stopPropagation(); setPrintData(row); }}
            >
              <Printer className="h-4 w-4" />
            </Button>

            {canApproveVacations && (row.status === 'pending' || row.status === 'pendiente') && (
              <>
                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                <Button
                  size="sm"
                  className="h-8 px-3 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRequest(row);
                    setActionType('approve');
                  }}
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> Aprobar
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3 bg-white text-red-600 hover:bg-red-50 border border-red-200 shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRequest(row);
                    setActionType('reject');
                  }}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Rechazar
                </Button>
              </>
            )}
          </div>
        )}
      />

      {/* MODAL CONFIRMACIÓN */}
      <AlertDialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? '¿Autorizar Vacaciones?' : '¿Rechazar Solicitud?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve'
                ? `Estás autorizando ${selectedRequest?.days_requested} días para el colaborador.`
                : 'Esta acción rechazará la solicitud de forma permanente.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              onClick={() => approvalMutation.mutate({
                request: selectedRequest,
                status: actionType === 'approve' ? 'approved' : 'rejected'
              })}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DOCUMENTO IMPRESIÓN */}
      {printData && (
        <div id="printable-doc" className="hidden">
            <div className="w-full h-screen bg-white text-black font-sans relative box-border overflow-hidden flex flex-col justify-between p-12">
            <div className="absolute inset-4 border-[4px] border-blue-700 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-12 px-8 pt-8">
              <div>
                <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight">RRHH</h1>
                <p className="text-sm text-gray-500 font-semibold tracking-wider uppercase mt-1">Gestión de Capital Humano</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-gray-900">SOLICITUD DE VACACIONES</h2>
                <p className="text-xs text-gray-400 font-mono mt-1">ID: {printData.id ? printData.id.toUpperCase().slice(0, 8) : '---'}</p>
                <div className="mt-3 inline-block px-4 py-1 rounded border-2 text-sm font-bold uppercase tracking-wide border-gray-400 text-gray-600">
                  {printData.status === 'approved' ? 'AUTORIZADO' : printData.status === 'rejected' ? 'RECHAZADO' : 'PENDIENTE'}
                </div>
              </div>
            </div>

            <div className="px-8 space-y-10">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Información del Colaborador</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Nombre Completo</p>
                    <p className="text-xl font-bold text-gray-800">{printData.profiles?.full_name || '---'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">No. Empleado</p>
                    <p className="text-lg font-medium text-gray-800">{printData.profiles?.employee_number || 'S/N'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Departamento</p>
                    <p className="text-base font-medium text-gray-700">{printData.profiles?.areas?.name || 'General'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Puesto</p>
                    <p className="text-base font-medium text-gray-700">{printData.profiles?.positions?.title || 'General'}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Detalle del Periodo</h3>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded shadow-sm">
                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">Desde el día</p>
                    {/* AQUI SE APLICA EL FIX DE LA FECHA */}
                    <p className="text-lg font-bold">{safeDate(printData.start_date)}</p>
                  </div>
                  <div className="text-center p-4 border rounded shadow-sm">
                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">Hasta el día</p>
                    {/* AQUI SE APLICA EL FIX DE LA FECHA */}
                    <p className="text-lg font-bold">{safeDate(printData.end_date)}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-600 text-white rounded shadow-sm">
                    <p className="text-xs text-blue-100 font-bold uppercase mb-1">Días Solicitados</p>
                    <p className="text-3xl font-bold">{printData.days_requested}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Observaciones / Motivo</h3>
                <div className="w-full p-4 bg-gray-50 border rounded text-sm italic text-gray-600 min-h-[80px]">
                  {printData.employee_note || "Sin observaciones registradas."}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-24 pt-16">
                <div className="text-center border-t-2 border-black pt-2"><p className="font-bold text-sm">{printData.profiles?.full_name}</p><p className="text-[10px] text-gray-500 uppercase">Firma Colaborador</p></div>
                <div className="text-center border-t-2 border-black pt-2"><p className="font-bold text-sm">RECURSOS HUMANOS</p><p className="text-[10px] text-gray-500 uppercase">Autorización</p></div>
              </div>
            </div>
            <div className="absolute bottom-6 w-full text-center text-[10px] text-blue-700 font-bold uppercase tracking-widest">Departamento de Recursos Humanos • Documento Oficial</div>
          </div>
        </div>
      )}
    </div>
  );
}