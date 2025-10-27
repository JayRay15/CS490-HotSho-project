import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse } from "../utils/responseFormat.js";

// POST /api/register - Public registration endpoint for local (email/password) users
export const registerPublic = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      const { response, statusCode } = errorResponse("Missing required fields", 400);
      return sendResponse(res, response, statusCode);
    }

    // Basic email lowercase normalization
    const normalizedEmail = String(email).toLowerCase();

    // Check duplicate email
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      const { response, statusCode } = errorResponse("Email already registered", 400);
      return sendResponse(res, response, statusCode);
    }

    // Create a local auth id so schema's auth0Id requirement is satisfied
    const auth0Id = `local:${normalizedEmail}`;

    const userData = {
      auth0Id,
      email: normalizedEmail,
      password,
      name: `${firstName.trim()} ${lastName.trim()}`,
    };

    const user = await User.create(userData);

    // Remove password from response
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;

    const { response, statusCode } = successResponse("User registered successfully", userObj, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Public registration error:", err);
    if (err.code === 11000) {
      const { response, statusCode } = errorResponse("Email already registered", 400);
      return sendResponse(res, response, statusCode);
    }
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};
