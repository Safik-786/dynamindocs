import { createPipeline } from "@/shared/utils/apiPipeline";
import { requireAuth, requireAdmin } from "@/shared/middlewares";
import { validateRequest } from "@/shared/middlewares/validation.middleware";
import { updatePermissionSchema } from "@/modules/rbac/validators/rbac.validator";
import * as rbacController from "@/modules/rbac/controllers/rbac.controller";

export const GET = createPipeline()
  .use(requireAuth)
  .use(requireAdmin)
  .controller(rbacController.list)
  .build();

export const POST = createPipeline()
  .use(requireAuth)
  .use(requireAdmin)
  .use(validateRequest(updatePermissionSchema))
  .controller(rbacController.updatePermission)
  .build();
