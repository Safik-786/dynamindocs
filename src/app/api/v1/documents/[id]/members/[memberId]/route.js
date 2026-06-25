import { createPipeline } from "@/shared/utils/apiPipeline";
import { requireAuth } from "@/shared/middlewares";
import * as docController from "@/modules/documents/controllers/document.controller";

export const PUT = createPipeline()
  .use(requireAuth)
  .controller(docController.updateMemberRole)
  .build();

export const DELETE = createPipeline()
  .use(requireAuth)
  .controller(docController.removeMember)
  .build();
