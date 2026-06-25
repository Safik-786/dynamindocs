import { createPipeline } from "@/shared/utils/apiPipeline";
import { requireAuth } from "@/shared/middlewares";
import { validateRequest } from "@/shared/middlewares/validation.middleware";
import { syncOperationsSchema } from "@/modules/documents/validators/document.validator";
import * as docController from "@/modules/documents/controllers/document.controller";

export const POST = createPipeline()
  .use(requireAuth)
  .use(validateRequest(syncOperationsSchema))
  .controller(docController.sync)
  .build();
