import { Router } from "express";
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  toggleArchiveNote,
  bulkDeleteNotes,
} from "../controllers/notesController";

const router = Router();

// GET /api/notes - Get all notes (with optional filters)
// Query params: ?archived=true&tag=work&search=meeting
router.get("/", getAllNotes);

// GET /api/notes/:id - Get single note by ID
router.get("/:id", getNoteById);

// POST /api/notes - Create a new note
router.post("/", createNote);

// PUT /api/notes/:id - Update a note
router.put("/:id", updateNote);

// DELETE /api/notes/:id - Delete a note
router.delete("/:id", deleteNote);

// PATCH /api/notes/:id/archive - Toggle archive status
router.patch("/:id/archive", toggleArchiveNote);

// POST /api/notes/bulk-delete - Delete multiple notes
router.post("/bulk-delete", bulkDeleteNotes);

export default router;
