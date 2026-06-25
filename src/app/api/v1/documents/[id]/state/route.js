import { createPipeline } from "@/shared/utils/apiPipeline";
import { requireAuth } from "@/shared/middlewares";
import * as docController from "@/modules/documents/controllers/document.controller";

export const GET = createPipeline()
  .use(requireAuth)
  .controller(docController.getState)
  .build();
