import { Router } from "express";
import { getAllTags } from "../controllers/notesController";

const router = Router();

// GET /api/tags - Get all tags with usage count
router.get("/", getAllTags);

export default router;
