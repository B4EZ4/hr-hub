import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export function AttendanceHistory() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

    // Fetch departments for the filter
    const { data: departments = [] } = useQuery({
        queryKey: ["departments"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("areas")
                .select("id, name")
                .order("name");

            if (error) {
                console.error("Error fetching departments:", error);
                return [];
            }
            return data || [];
        },
    });

    const { data: history = [], isLoading } = useQuery({
        queryKey: ["attendance-history", dateRange, searchTerm, selectedDepartment],
        queryFn: async () => {
            // 1. Fetch attendance records
            let query = (supabase as any)
                .from("attendance_records")
                .select("*")
                .order("attendance_date", { ascending: false })
                .order("check_in", { ascending: true });

            if (dateRange?.from) {
                query = query.gte("attendance_date", format(dateRange.from, "yyyy-MM-dd"));
            }
            if (dateRange?.to) {
                query = query.lte("attendance_date", format(dateRange.to, "yyyy-MM-dd"));
            }

            const { data: records, error: recordsError } = await query;

            if (recordsError) {
                console.error("Error fetching history:", recordsError);
                throw recordsError;
            }

            if (!records || records.length === 0) return [];

            // 2. Fetch profiles for these records
            const userIds = [...new Set(records.map((r: any) => r.user_id))];

            const { data: profiles, error: profilesError } = await (supabase as any)
                .from("profiles")
                .select("user_id, full_name, avatar_url, areas(name), positions(title)")
                .in("user_id", userIds);

            if (profilesError) {
                console.warn("Error fetching profiles:", profilesError);
                // Continue without profiles if error
            }

            // 3. Combine data
            const combinedData = records.map((record: any) => {
                const profile = profiles?.find((p: any) => p.user_id === record.user_id);
                return {
                    ...record,
                    profiles: profile || {
                        full_name: "Usuario Desconocido",
                        avatar_url: null,
                        areas: { name: "Sin área" },
                        positions: { title: "-" }
                    }
                };
            });

            // Client-side filtering
            return combinedData.filter((record: any) => {
                const matchesSearch = !searchTerm || (
                    record.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    record.profiles?.areas?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                );

                const matchesDepartment = selectedDepartment === "all" || record.profiles?.areas?.name === selectedDepartment;

                return matchesSearch && matchesDepartment;
            });
        },
    });

    const statusVariant: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
        puntual: { label: "Puntual", variant: "default" },
        tarde: { label: "Tarde", variant: "destructive" },
        ausente: { label: "Ausente", variant: "secondary" },
        permiso: { label: "Permiso", variant: "outline" },
        pendiente: { label: "Pendiente", variant: "secondary" },
        approved: { label: "Vacaciones", variant: "default" },
    };

    const formatTime = (value?: string | null) => value ? value.slice(0, 5) : "—";

    return (
        <div className="space-y-6">
            {/* Filtros */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 flex-col md:flex-row gap-4">
                    <div className="relative flex-1 md:max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por empleado..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Departamento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los departamentos</SelectItem>
                            {departments.map((dept: any) => (
                                <SelectItem key={dept.id} value={dept.name}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full md:w-[240px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "dd/MM/y")} -{" "}
                                            {format(dateRange.to, "dd/MM/y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "dd/MM/y")
                                    )
                                ) : (
                                    <span>Seleccionar fechas</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                locale={es}
                            />
                            <div className="p-3 border-t">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-center text-sm"
                                    onClick={() => setDateRange(undefined)}
                                >
                                    Limpiar filtro
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                    Mostrando {history.length} registros
                </div>
            </div>

            {/* Tabla */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empleado</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Horario</TableHead>
                            <TableHead>Entrada</TableHead>
                            <TableHead>Salida</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Retardo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Cargando historial...
                                </TableCell>
                            </TableRow>
                        ) : history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No se encontraron registros con los filtros seleccionados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map((record: any) => {
                                const statusKey = record.status || "pendiente";
                                const status = statusVariant[statusKey] || statusVariant.pendiente;
                                const profile = record.profiles;

                                return (
                                    <TableRow key={record.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={profile?.avatar_url} />
                                                    <AvatarFallback>
                                                        {profile?.full_name?.substring(0, 2).toUpperCase() || "EM"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">{profile?.full_name || "Desconocido"}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {profile?.areas?.name || "Sin área"}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(record.attendance_date), "dd MMM yyyy", { locale: es })}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatTime(record.scheduled_start)} - {formatTime(record.scheduled_end)}
                                        </TableCell>
                                        <TableCell>
                                            {record.check_in ? format(new Date(record.check_in), "HH:mm") : "—"}
                                        </TableCell>
                                        <TableCell>
                                            {record.check_out ? format(new Date(record.check_out), "HH:mm") : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={status.variant}>{status.label}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {record.minutes_late > 0 ? (
                                                <span className="text-destructive font-medium">{record.minutes_late} min</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
