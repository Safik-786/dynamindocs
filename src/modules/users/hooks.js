import { useQuery } from "@tanstack/react-query";

export const useUsers = ({ page, limit, debouncedSearch, enabled }) => {
  return useQuery({
    queryKey: ["users", page, limit, debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`/api/v1/users?page=${page}&limit=${limit}&q=${debouncedSearch}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
      return data;
    },
    enabled,
  });
};
