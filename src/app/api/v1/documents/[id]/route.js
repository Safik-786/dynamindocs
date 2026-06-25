import { createPipeline } from "@/shared/utils/apiPipeline";
import { requireAuth } from "@/shared/middlewares";
import { validateRequest } from "@/shared/middlewares/validation.middleware";
import { renameDocumentSchema } from "@/modules/documents/validators/document.validator";
import * as docController from "@/modules/documents/controllers/document.controller";

export const GET = createPipeline()
  .use(requireAuth)
  .controller(docController.getById)
  .build();

export const PATCH = createPipeline()
  .use(requireAuth)
  .use(validateRequest(renameDocumentSchema))
  .controller(docController.rename)
  .build();
