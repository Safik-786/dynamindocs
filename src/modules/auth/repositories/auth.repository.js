import { prisma } from "@/lib/prisma";

export const createUser = async (userData) => {
  return await prisma.user.create({
    data: userData,
  });
};

export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};
