import { createPipeline } from "@/shared/utils/apiPipeline";
import { requireAuth } from "@/shared/middlewares";
import * as aiController from "@/modules/ai/controllers/ai.controller";

export const POST = createPipeline()
  .use(requireAuth)
  .controller(aiController.actionItems)
  .build();
