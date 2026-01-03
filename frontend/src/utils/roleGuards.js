import { ROLES } from './constants';

export const hasRole = (userRole, allowedRoles) => {
  return allowedRoles.includes(userRole);
};

export const isAdmin = (userRole) => {
  return userRole === ROLES.ADMIN;
};

export const isHR = (userRole) => {
  return userRole === ROLES.HR_OFFICER;
};

export const isPayroll = (userRole) => {
  return userRole === ROLES.PAYROLL_OFFICER;
};

export const isEmployee = (userRole) => {
  return userRole === ROLES.EMPLOYEE;
};

export const canManageUsers = (userRole) => {
  return hasRole(userRole, [ROLES.ADMIN, ROLES.HR_OFFICER]);
};

export const canManageLeaves = (userRole) => {
  return hasRole(userRole, [ROLES.ADMIN, ROLES.HR_OFFICER, ROLES.MANAGER]);
};

export const canManagePayroll = (userRole) => {
  return hasRole(userRole, [ROLES.ADMIN, ROLES.PAYROLL_OFFICER]);
};

export const canViewAllData = (userRole) => {
  return hasRole(userRole, [ROLES.ADMIN, ROLES.HR_OFFICER, ROLES.PAYROLL_OFFICER]);
};