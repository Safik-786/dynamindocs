import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useRbacData = ({ enabled }) => {
  return useQuery({
    queryKey: ["rbac"],
    queryFn: async () => {
      const res = await fetch("/api/v1/rbac");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch RBAC data');
      return data;
    },
    enabled,
  });
};

export const useUpdateRolePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, permissionId, action }) => {
      const response = await fetch('/api/v1/rbac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId, permissionId, action }),
      });

      if (!response.ok) {
        throw new Error('Failed to update permission');
      }
      return response.json();
    },
    onMutate: async ({ roleId, permissionId, action }) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ["rbac"] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(["rbac"]);

      // Optimistically update
      if (previousData) {
        const isGranted = action === 'grant';
        const updatedRoles = previousData.roles.map(r => {
          if (r.id === roleId) {
            const permissionCode = previousData.permissions.find(p => p.id === permissionId)?.code;
            if (!permissionCode) return r;
            
            const newPermissions = isGranted 
              ? [...r.permissions, permissionCode]
              : r.permissions.filter(pCode => pCode !== permissionCode);
            return { ...r, permissions: newPermissions };
          }
          return r;
        });

        queryClient.setQueryData(["rbac"], { ...previousData, roles: updatedRoles });
      }

      return { previousData };
    },
    onError: (err, newTodo, context) => {
      // Revert if error
      if (context?.previousData) {
        queryClient.setQueryData(["rbac"], context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["rbac"] });
    },
  });
};
