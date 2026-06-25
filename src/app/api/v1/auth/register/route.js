import { createPipeline } from "@/shared/utils/apiPipeline";
import { validateRequest } from "@/shared/middlewares/validation.middleware";
import { registerSchema } from "@/modules/auth/validators/auth.validator";
import * as authController from "@/modules/auth/controllers/auth.controller";

export const POST = createPipeline()
  .use(validateRequest(registerSchema))
  .controller(authController.register)
  .build();
