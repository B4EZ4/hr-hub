import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Clock, StickyNote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
    const [note, setNote] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Cargar nota desde localStorage cuando se abre el diálogo
    useEffect(() => {
        if (open && record) {
            const savedNote = localStorage.getItem(`attendance_note_${record.id}`);
            setNote(savedNote || "");
        }
    }, [record, open]);

    const handleSave = () => {
        if (!record) return;

        // Guardar nota localmente
        localStorage.setItem(`attendance_note_${record.id}`, note);

        toast({
            title: "✅ Nota guardada",
            description: "La nota se ha guardado localmente.",
        });
        onOpenChange(false);
    };

    const handleDelete = async () => {
        if (!record) return;
        setIsDeleting(true);

        try {
            console.log('Attempting to delete record:', record.id);

            const { error, count } = await supabase
                .from("attendance_records")
                .delete({ count: "exact" })
                .eq("id", record.id);

            if (error) throw error;

            // Limpiar la nota local si existe
            localStorage.removeItem(`attendance_note_${record.id}`);

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
        } catch (error: any) {
            console.error('Delete mutation error:', error);
            toast({
                title: "❌ Error al eliminar",
                description: error.message || "No se pudo eliminar el registro.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    if (!record) return null;

    const initials = record.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??";

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return "No registrado";
        return format(new Date(dateString), "dd/MM/yyyy hh:mm a");
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Detalles de Asistencia</DialogTitle>
                        <DialogDescription>
                            Visualiza los detalles de asistencia y agrega notas personales.
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
                            <p>{format(new Date(record.attendance_date), "dd MMM yyyy")}</p>
                        </div>
                    </div>

                    <div className="grid gap-4 py-4">
                        {/* Check-in Info */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right flex items-center justify-end gap-2">
                                <Clock className="h-4 w-4" />
                                Entrada
                            </Label>
                            <div className="col-span-3 font-medium">
                                {formatDateTime(record.check_in)}
                            </div>
                        </div>

                        {/* Check-out Info */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right flex items-center justify-end gap-2">
                                <Clock className="h-4 w-4" />
                                Salida
                            </Label>
                            <div className="col-span-3 font-medium">
                                {formatDateTime(record.check_out)}
                            </div>
                        </div>

                        {/* Local Note */}
                        <div className="grid gap-2">
                            <Label htmlFor="note" className="flex items-center gap-2">
                                <StickyNote className="h-4 w-4" />
                                Nota (Local)
                            </Label>
                            <Textarea
                                id="note"
                                placeholder="Escribe una nota personal para este registro..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="min-h-[100px]"
                            />
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
                                Cerrar
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSave}
                            >
                                Guardar nota
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
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}