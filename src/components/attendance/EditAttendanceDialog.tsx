import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Clock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AttendanceRecord = Database["public"]["Tables"]["attendance_records"]["Row"] & {
    full_name?: string;
    avatar_url?: string;
    area_name?: string;
    position_title?: string;
};

interface EditAttendanceDialogProps {
    record: AttendanceRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditAttendanceDialog({
    record,
    open,
    onOpenChange,
}: EditAttendanceDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    const [checkInDate, setCheckInDate] = useState("");
    const [checkInTime, setCheckInTime] = useState("");
    const [checkOutDate, setCheckOutDate] = useState("");
    const [checkOutTime, setCheckOutTime] = useState("");

    // ACTUALIZACIÓN IMPORTANTE: Usamos useEffect para resetear el form cada vez que cambia el 'record' o se abre el diálogo.
    useEffect(() => {
        if (open && record) {
            // Check-in
            if (record.check_in) {
                // El navegador convierte automáticamente UTC a tu hora local aquí
                const checkIn = new Date(record.check_in);
                setCheckInDate(format(checkIn, "yyyy-MM-dd"));
                setCheckInTime(format(checkIn, "HH:mm"));
            } else {
                setCheckInDate("");
                setCheckInTime("");
            }

            // Check-out
            if (record.check_out) {
                const checkOut = new Date(record.check_out);
                setCheckOutDate(format(checkOut, "yyyy-MM-dd"));
                setCheckOutTime(format(checkOut, "HH:mm"));
            } else {
                setCheckOutDate("");
                setCheckOutTime("");
            }
        }
    }, [record, open]);

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!record) return;

            // Construimos la fecha localmente.
            // Al unir fecha + "T" + hora, el navegador crea un objeto Date en TU zona horaria.
            // Luego .toISOString() lo convierte a UTC para guardarlo en la base de datos.

            let checkInTimestamp = null;
            if (checkInDate && checkInTime) {
                const localDate = new Date(`${checkInDate}T${checkInTime}:00`);
                checkInTimestamp = localDate.toISOString();
            }

            let checkOutTimestamp = null;
            if (checkOutDate && checkOutTime) {
                const localDate = new Date(`${checkOutDate}T${checkOutTime}:00`);
                checkOutTimestamp = localDate.toISOString();
            }

            const { error } = await supabase
                .from("attendance_records")
                .update({
                    check_in: checkInTimestamp,
                    check_out: checkOutTimestamp,
                    status: checkOutTimestamp ? "completado" : "presente",
                })
                .eq("id", record.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["attendance-records"],
                exact: false
            });
            queryClient.invalidateQueries({ queryKey: ["attendance-employees"] });
            toast({
                title: "✅ Registro actualizado",
                description: "Los cambios se han guardado correctamente.",
            });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({
                title: "❌ Error al actualizar",
                description: error.message || "No se pudo actualizar el registro.",
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!record) return;

            console.log('Attempting to delete record:', record.id);

            const { data, error, count } = await supabase
                .from("attendance_records")
                .delete({ count: "exact" })
                .eq("id", record.id)
                .select();

            if (error) throw error;

            if (count === 0) {
                throw new Error("La operación fue exitosa pero no se borró ninguna fila (count: 0). Posible problema de RLS.");
            }

            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ["attendance-records"],
                exact: false
            });
            queryClient.invalidateQueries({ queryKey: ["attendance-employees"] });

            toast({
                title: "🗑️ Registro eliminado",
                description: "El registro de asistencia ha sido eliminado.",
            });
            setShowDeleteAlert(false);
            onOpenChange(false);
        },
        onError: (error: any) => {
            console.error('Delete mutation error:', error);
            toast({
                title: "❌ Error al eliminar",
                description: error.message || "No se pudo eliminar el registro.",
                variant: "destructive",
            });
        },
    });

    if (!record) return null;

    const initials = record.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??";

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Registro de Asistencia</DialogTitle>
                        <DialogDescription>
                            Modifica los horarios de entrada y salida del empleado.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Employee Info */}
                    <div className="flex items-center gap-4 rounded-lg border p-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={record.avatar_url || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold">{record.full_name || "Sin nombre"}</p>
                            <p className="text-sm text-muted-foreground">
                                {record.position_title || record.area_name || "Sin asignar"}
                            </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                            {/* Convertimos fecha a local para mostrarla bien */}
                            <p>{format(new Date(record.attendance_date), "dd MMM yyyy")}</p>
                        </div>
                    </div>

                    {/* Check-in */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="check-in-date" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Entrada (Check-in)
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label htmlFor="check-in-date" className="text-xs text-muted-foreground">
                                        Fecha
                                    </Label>
                                    <Input
                                        id="check-in-date"
                                        type="date"
                                        value={checkInDate}
                                        onChange={(e) => setCheckInDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="check-in-time" className="text-xs text-muted-foreground">
                                        Hora
                                    </Label>
                                    <Input
                                        id="check-in-time"
                                        type="time"
                                        value={checkInTime}
                                        onChange={(e) => setCheckInTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Check-out */}
                        <div className="space-y-2">
                            <Label htmlFor="check-out-date" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Salida (Check-out)
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label htmlFor="check-out-date" className="text-xs text-muted-foreground">
                                        Fecha
                                    </Label>
                                    <Input
                                        id="check-out-date"
                                        type="date"
                                        value={checkOutDate}
                                        onChange={(e) => setCheckOutDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="check-out-time" className="text-xs text-muted-foreground">
                                        Hora
                                    </Label>
                                    <Input
                                        id="check-out-time"
                                        type="time"
                                        value={checkOutTime}
                                        onChange={(e) => setCheckOutTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setShowDeleteAlert(true)}
                            className="sm:mr-auto"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={() => updateMutation.mutate()}
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El registro de asistencia de{" "}
                            <strong>{record.full_name}</strong> del{" "}
                            <strong>{format(new Date(record.attendance_date), "dd/MM/yyyy")}</strong>{" "}
                            será eliminado permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}