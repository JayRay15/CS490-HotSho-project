import express from "express";
import { registerOrGetUser } from "../controllers/userController.js";
import { checkJwt } from "../middleware/checkJwt.js";

const router = express.Router();

router.get("/me", checkJwt, registerOrGetUser);

export default router;
