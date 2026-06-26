import { prisma } from "@/lib/prisma";

export const createUser = async (userData) => {
  const defaultRole = await prisma.rbacRole.findUnique({
    where: { code: 'EDITOR' }
  });

  return await prisma.user.create({
    data: {
      ...userData,
      roles: defaultRole ? {
        create: {
          roleId: defaultRole.id
        }
      } : undefined
    },
  });
};

export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};
