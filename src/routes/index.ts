import { Router } from "express";
import notesRouter from "./notes.routes";

const router = Router();

router.use("/notes", notesRouter);

export default router;
