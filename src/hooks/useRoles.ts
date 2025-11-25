import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'superadmin' | 'admin_rrhh';

export const useRoles = () => {
  const { roles: rolesFromContext } = useAuth();
  const roles = (rolesFromContext || []) as AppRole[];

  const hasRole = (role: AppRole) => roles.includes(role);
  
  const hasAnyRole = (rolesToCheck: AppRole[]) => 
    rolesToCheck.some(role => roles.includes(role));

  const isSuperadmin = hasRole('superadmin');
  const isAdminRRHH = hasRole('admin_rrhh');

  return {
    roles,
    isLoading: false,
    hasRole,
    hasAnyRole,
    isSuperadmin,
    isAdminRRHH,
    // Permisos derivados - Ambos roles (superadmin y admin_rrhh) tienen acceso completo a RRHH
    canManageUsers: isSuperadmin, // Solo superadmin puede gestionar usuarios del sistema
    canManageRRHH: isSuperadmin || isAdminRRHH, // Ambos pueden gestionar operaciones de RRHH
    canApproveVacations: isSuperadmin || isAdminRRHH,
    canManageSH: isSuperadmin || isAdminRRHH, // Seguridad e Higiene
    canViewAuditLogs: isSuperadmin, // Solo superadmin ve logs de auditoría del sistema
    canManageRecruitment: isSuperadmin || isAdminRRHH,
    canViewReports: isSuperadmin || isAdminRRHH,
    canManageSystem: isSuperadmin, // Solo superadmin tiene acceso total al sistema
  };
};
