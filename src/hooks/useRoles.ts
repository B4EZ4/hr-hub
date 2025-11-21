import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'superadmin' | 'admin_rrhh' | 'manager' | 'empleado' | 'oficial_sh' | 'auditor';

export const useRoles = () => {
  const { user } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []).map((r: any) => r.role as AppRole);
    },
    enabled: !!user,
  });

  const hasRole = (role: AppRole) => roles.includes(role);
  
  const hasAnyRole = (rolesToCheck: AppRole[]) => 
    rolesToCheck.some(role => roles.includes(role));

  const isSuperadmin = hasRole('superadmin');
  const isAdminRRHH = hasRole('admin_rrhh');
  const isManager = hasRole('manager');
  const isEmpleado = hasRole('empleado');
  const isOficialSH = hasRole('oficial_sh');
  const isAuditor = hasRole('auditor');

  return {
    roles,
    isLoading,
    hasRole,
    hasAnyRole,
    isSuperadmin,
    isAdminRRHH,
    isManager,
    isEmpleado,
    isOficialSH,
    isAuditor,
    canManageUsers: isSuperadmin || isAdminRRHH,
    canApproveVacations: isSuperadmin || isAdminRRHH || isManager,
    canManageSH: isSuperadmin || isOficialSH,
    canViewAuditLogs: isSuperadmin || isAuditor,
    canManageRecruitment: isSuperadmin || isAdminRRHH || isManager,
  };
};
