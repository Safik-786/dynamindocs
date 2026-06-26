import { getToken } from "next-auth/jwt";

export const requireAuth = async (ctx) => {
  // Extract token from request using next-auth/jwt
  const token = await getToken({ req: ctx.req, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    const error = new Error("Unauthorized access. Please log in.");
    error.statusCode = 401;
    throw error;
  }
  
  // Attach user to context
  ctx.user = token;
};

export const requirePermissions = (requiredPermissions) => {
  return async (ctx) => {
    // Ensure requireAuth ran first
    if (!ctx.user) {
      const error = new Error("Unauthorized access.");
      error.statusCode = 401;
      throw error;
    }

    const userPermissions = ctx.user.permissions || [];
    
    // Check if user has ALL required permissions
    const hasAllPermissions = requiredPermissions.every(p => userPermissions.includes(p));
    
    if (!hasAllPermissions) {
      const error = new Error("Forbidden: You do not have the required permissions.");
      error.statusCode = 403;
      throw error;
    }
  };
};

export const requireFeature = (featureFlag) => {
  return async (ctx) => {
    // Basic implementation - this would typically check against a DB or feature flag service
    const isFeatureEnabled = process.env[`FEATURE_${featureFlag}`] === "true";
    
    if (!isFeatureEnabled) {
      const error = new Error(`Feature '${featureFlag}' is disabled or not available in your tier.`);
      error.statusCode = 403;
      throw error;
    }
    
    ctx.features[featureFlag] = true;
  };
};

export const requireAdmin = async (ctx) => {
  if (!ctx.user) {
    const error = new Error("Unauthorized access.");
    error.statusCode = 401;
    throw error;
  }

  const hasAdminRole = ctx.user.roles?.includes("ADMIN");
  
  if (!hasAdminRole) {
    const error = new Error("Forbidden: Admin access required.");
    error.statusCode = 403;
    throw error;
  }
};
