import { NextResponse } from "next/server";
import { errorResponse } from "./apiResponse";
import { requestContext } from "./requestContext";

export class ApiPipeline {
  constructor() {
    this.middlewares = [];
    this.controllerFn = null;
  }

  /**
   * Add a middleware to the pipeline.
   * Middleware should be an async function (ctx) => void
   * If a middleware throws an ApiError, the pipeline halts and returns the error response.
   */
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Define the final controller to execute business logic.
   * @param {function} fn - The controller function (ctx) => NextResponse
   */
  controller(fn) {
    this.controllerFn = fn;
    return this;
  }

  /**
   * Build the pipeline into a Next.js App Router compatible route handler.
   */
  build() {
    return async (req, ...args) => {
      // 🛡️ Next.js 15: params and searchParams are now Promises
      const params = await (args[0]?.params || {});

      // For standard Request objects, we need to extract searchParams from the URL
      const url = new URL(req.url);
      const searchParams = url.searchParams;
      const query = Object.fromEntries(searchParams.entries());

      // Context object available across all middleware and controllers
      const ctx = {
        req,
        args,
        params,
        query,
        user: null,           // Populated by Auth middleware
        validatedData: null,  // Populated by Validation middleware
        features: {},         // Populated by Feature Flags middleware
        rateLimitHeaders: {}, // Populated by Rate Limit middleware (for 429 responses)
        requestContext: {
          ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: req.headers.get("user-agent"),
          requestId: req.headers.get("x-request-id") || `req_${Date.now()}`,
          sessionId: req.headers.get("x-session-id"),
          deviceId: req.headers.get("x-device-id"),
        },
      };

      try {
        // Run middlewares sequentially
        for (const middleware of this.middlewares) {
          await middleware(ctx);
        }

        if (!this.controllerFn) {
          throw new Error("Pipeline execution failed: No controller defined.");
        }

        //  Forensic Wrap: Ensure requestContext is available in AsyncLocalStorage
        // This allows audit logs to capture metadata even if prop-drilling fails.
        return await requestContext.run(ctx.requestContext, () => this.controllerFn(ctx));

      } catch (error) {
        console.error(`[API Error] ${req.method} ${url.pathname}:`, error.message);
        console.error(error.stack);

        // Map expected schema errors if not caught by specific middleware logic
        let statusCode = error.statusCode || 500;
        let message = error.message || "An unexpected error occurred. Please try again later.";
        let errors = error.errors ?? error.issues ?? null;

        if (error.name === "ZodError") {
          statusCode = 400;
          message = "Validation Error";
          errors = error.issues;
        }

        // Handle Prisma Unique Constraint Errors
        if (error.code === 'P2002') {
          statusCode = 409;
          const target = error.meta?.target || [];
          message = `A record with this ${target.join(', ')} already exists.`;
        }

        // Forward rate limit headers for 429 responses (RFC 6585)
        if (statusCode === 429 && ctx.rateLimitHeaders) {
          return errorResponse(message, statusCode, errors, ctx.rateLimitHeaders);
        }

        return errorResponse(message, statusCode, errors);
      }
    };
  }
}

// Factory Helper
export const createPipeline = () => new ApiPipeline();
