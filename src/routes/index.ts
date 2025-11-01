import { Router } from "express";
import notesRouter from "./notes.routes";
import tagsRouter from "./tags.routes";

const router = Router();

router.use("/notes", notesRouter);
router.use("/tags", tagsRouter);

export default router;
