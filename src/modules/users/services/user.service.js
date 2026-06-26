import * as userRepo from "../repositories/user.repository";

export const getUsers = async ({ page, limit, search }) => {
  const skip = (page - 1) * limit;

  const [users, totalCount] = await Promise.all([
    userRepo.getUsersList({ search, skip, limit }),
    userRepo.countUsers({ search }),
  ]);

  // Format roles to be simpler array of strings for the frontend
  const formattedUsers = users.map(user => ({
    ...user,
    roles: user.roles.map(ur => ur.role.name)
  }));

  return {
    data: formattedUsers,
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};
