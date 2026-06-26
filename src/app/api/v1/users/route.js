import { createPipeline } from "@/shared/utils/apiPipeline";
import { requireAuth, requireAdmin } from "@/shared/middlewares";
import * as userController from "@/modules/users/controllers/user.controller";

export const GET = createPipeline()
  .use(requireAuth)
  .use(requireAdmin)
  .controller(userController.list)
  .build();
