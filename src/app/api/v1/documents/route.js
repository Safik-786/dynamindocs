import { createPipeline } from "@/shared/utils/apiPipeline";
import { requireAuth } from "@/shared/middlewares";
import { validateRequest } from "@/shared/middlewares/validation.middleware";
import { createDocumentSchema } from "@/modules/documents/validators/document.validator";
import * as docController from "@/modules/documents/controllers/document.controller";

export const GET = createPipeline()
  .use(requireAuth)
  .controller(docController.list)
  .build();

export const POST = createPipeline()
  .use(requireAuth)
  .use(validateRequest(createDocumentSchema))
  .controller(docController.create)
  .build();
