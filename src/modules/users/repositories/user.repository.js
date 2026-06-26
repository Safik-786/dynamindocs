import { prisma } from "@/lib/prisma";

export const getUsersList = async ({ search, skip, limit }) => {
  const whereClause = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  return await prisma.user.findMany({
    where: whereClause,
    skip,
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      isVerified: true,
      createdAt: true,
      roles: {
        include: {
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

export const countUsers = async ({ search }) => {
  const whereClause = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  return await prisma.user.count({
    where: whereClause,
  });
};
