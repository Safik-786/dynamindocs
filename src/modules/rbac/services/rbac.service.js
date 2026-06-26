import * as rbacRepo from "../repositories/rbac.repository";

export const getRbacData = async () => {
  const { roles, permissions } = await rbacRepo.getAllRolesAndPermissions();
  
  // Format roles for easier frontend consumption
  const formattedRoles = roles.map(role => ({
    id: role.id,
    name: role.name,
    code: role.code,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.rolePermissions.map(rp => rp.permission.code)
  }));

  return { roles: formattedRoles, permissions };
};

export const updateRolePermission = async ({ roleId, permissionId, action }) => {
  const role = await rbacRepo.getRoleById(roleId);
  if (!role) {
    const error = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }
  
  if (action === 'grant') {
    await rbacRepo.grantPermission(roleId, permissionId);
  } else if (action === 'revoke') {
    await rbacRepo.revokePermission(roleId, permissionId);
  }

  return { success: true };
};
