import { successResponse } from "@/shared/utils/apiResponse";
import * as authService from "../services/auth.service";

export const register = async (ctx) => {
  // Use ctx.validatedData since we should use a validation middleware, 
  // or validate directly if validation middleware isn't present yet.
  const data = ctx.validatedData || await ctx.req.json();
  
  const newUser = await authService.registerUser(data);
  
  return successResponse("User registered successfully", newUser, 201);
};
