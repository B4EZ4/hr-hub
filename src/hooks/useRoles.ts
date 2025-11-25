import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'superadmin' | 'admin_rrhh' | 'manager' | 'empleado' | 'oficial_sh' | 'auditor';

export const useRoles = () => {
  const { roles: rolesFromContext } = useAuth();
  const roles = (rolesFromContext || []) as AppRole[];

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
    isLoading: false,
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
