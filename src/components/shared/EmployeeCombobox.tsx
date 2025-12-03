import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeeComboboxProps {
  value?: string; // employee_number or id as fallback
  onSelect: (employeeIdentifier: string) => void;
}

export const EmployeeCombobox = ({ value, onSelect }: EmployeeComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      console.log('Iniciando carga de empleados...');
      
      try {
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('id, full_name, position, department, status');

        if (queryError) {
          console.error('Error Supabase:', queryError);
          throw new Error(`Error Supabase: ${queryError.message} (Código: ${queryError.code})`);
        }

        console.log(`✅ Empleados cargados exitosamente: ${data?.length || 0} registros`);
        if (data && data.length > 0) {
          console.log('Primeros 3:', data.slice(0, 3));
        }
        return data || [];
      } catch (err: any) {
        console.error('Error en queryFn completo:', err);
        throw err;
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Filter employees by search term
  const filteredEmployees = employees.filter((emp: any) => {
    if (!search) return true; // Show all if no search
    
    const searchLower = search.toLowerCase();
    const fullName = (emp.full_name || '').toLowerCase();
    const position = (emp.position || '').toLowerCase();
    const idStr = (emp.id || '').toLowerCase();
    
    return (
      fullName.includes(searchLower) ||
      position.includes(searchLower) ||
      idStr.includes(searchLower)
    );
  });

  const selectedEmployee = employees.find((emp: any) => emp.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedEmployee ? (
            <span className="truncate">
              {selectedEmployee.id.slice(0, 8)} - {selectedEmployee.full_name}
            </span>
          ) : (
            'Selecciona un empleado...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Busca por nombre, ID o posición..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Cargando empleados...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-sm text-destructive">
                Error al cargar empleados: {(error as Error)?.message}
              </div>
            ) : employees.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No hay empleados en la base de datos (tabla vacía)
              </div>
            ) : filteredEmployees.length === 0 ? (
              <CommandEmpty>No se encontraron empleados con ese criterio.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredEmployees.map((emp: any) => (
                  <CommandItem
                    key={emp.id}
                    value={emp.id}
                    onSelect={(currentValue) => {
                      onSelect(currentValue === value ? '' : currentValue);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === emp.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{emp.full_name || 'Sin nombre'}</span>
                      <span className="text-xs text-muted-foreground">
                        {emp.id.slice(0, 8)} • {emp.position || 'Sin posición'} {emp.status ? `(${emp.status})` : ''}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
