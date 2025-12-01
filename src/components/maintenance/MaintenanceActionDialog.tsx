import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface MaintenanceActionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    actionType: 'complete' | 'cancel';
    onConfirm: (notes: string) => void;
    isLoading?: boolean;
}

export function MaintenanceActionDialog({
    open,
    onOpenChange,
    actionType,
    onConfirm,
    isLoading = false,
}: MaintenanceActionDialogProps) {
    const [notes, setNotes] = useState('');

    const handleConfirm = () => {
        onConfirm(notes);
        setNotes('');
    };

    const handleCancel = () => {
        setNotes('');
        onOpenChange(false);
    };

    const getDialogConfig = () => {
        if (actionType === 'complete') {
            return {
                title: 'Completar Mantenimiento',
                description: '¿Estás seguro de que deseas marcar este mantenimiento como completado?',
                label: 'Notas de finalización (opcional)',
                placeholder: 'Describe el trabajo realizado o cualquier observación adicional...',
                confirmText: 'Completar',
                confirmVariant: 'default' as const,
            };
        }
        return {
            title: 'Cancelar Mantenimiento',
            description: '¿Estás seguro de que deseas cancelar este mantenimiento?',
            label: 'Razón de cancelación (opcional)',
            placeholder: 'Explica por qué se cancela este mantenimiento...',
            confirmText: 'Cancelar',
            confirmVariant: 'destructive' as const,
        };
    };

    const config = getDialogConfig();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{config.title}</DialogTitle>
                    <DialogDescription>
                        {config.description}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="notes">{config.label}</Label>
                        <Textarea
                            id="notes"
                            placeholder={config.placeholder}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                        Regresar
                    </Button>
                    <Button
                        variant={config.confirmVariant}
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Procesando...' : config.confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}