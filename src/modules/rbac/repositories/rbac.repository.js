import { prisma } from "@/lib/prisma";

export const getAllRolesAndPermissions = async () => {
  const [roles, permissions] = await Promise.all([
    prisma.rbacRole.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc'
      }
    }),
    prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ]
    }),
  ]);
  return { roles, permissions };
};

export const getRoleById = async (roleId) => {
  return await prisma.rbacRole.findUnique({ where: { id: roleId } });
};

export const grantPermission = async (roleId, permissionId) => {
  return await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId,
      }
    },
    update: {},
    create: {
      roleId,
      permissionId,
    }
  });
};

export const revokePermission = async (roleId, permissionId) => {
  return await prisma.rolePermission.delete({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId,
      }
    }
  }).catch(e => {
    // Ignore error if it doesn't exist
  });
};
