export const validateRequest = (schema) => {
  return async (ctx) => {
    // Determine the data source depending on method
    let data = {};
    if (["POST", "PUT", "PATCH"].includes(ctx.req.method)) {
      data = await ctx.req.json();
    } else {
      data = ctx.query;
    }

    // Validate using Zod schema
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const error = new Error("Validation Error");
      error.statusCode = 400;
      error.name = "ZodError";
      error.issues = result.error.errors;
      throw error;
    }

    // Attach validated data to context
    ctx.validatedData = result.data;
  };
};
