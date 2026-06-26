import { z } from "zod";

export const updatePermissionSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
  permissionId: z.string().min(1, "Permission ID is required"),
  action: z.enum(['grant', 'revoke'], {
    errorMap: () => ({ message: "Action must be 'grant' or 'revoke'" })
  })
});
