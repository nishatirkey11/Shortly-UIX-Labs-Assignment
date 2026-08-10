import { Router } from "express";
import { redirectLink } from "../controllers/link.controller.js";

const router = Router();

router.get("/r/:slug", redirectLink);

export default router;