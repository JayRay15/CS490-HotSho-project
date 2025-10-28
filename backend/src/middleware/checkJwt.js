import { requireAuth } from "@clerk/express";

// Use Clerk to protect routes; attaches auth info at req.auth with userId, sessionId, etc.
const checkJwt = requireAuth();

export { checkJwt };
