import { Router } from "express";
import {
  createLink,
  disableLink,
  deleteLink,
  getLinks,
  getLinkById,
  getLinkStats
} from "../controllers/link.controller.js";

const router = Router();

router.post("/links", createLink);

router.patch(
  "/links/:id/disable",
  disableLink
);

router.delete(
  "/links/:id",
  deleteLink
);

router.get(
  "/links",
  getLinks
);

router.get(
  "/links/:id",
  getLinkById
);

router.get(
  "/links/:id/stats",
  getLinkStats
);

export default router;