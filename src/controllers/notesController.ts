import { Request, Response, NextFunction } from "express";
import { query, queryOne, transaction } from "../database/db";
import AppError from "../models/AppError";

interface Note {
  id: number;
  title: string;
  description: string | null;
  color: string;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

interface NoteWithTags extends Note {
  tags: string[];
}

interface Tag {
  id: number;
  name: string;
  color: string;
}

export async function getAllNotes(req: Request, res: Response) {
  try {
    const { archived, tag, search } = req.query;

    let sql = `
      SELECT 
        n.id,
        n.title,
        n.description,
        n.color,
        n.is_archived,
        n.created_at,
        n.updated_at,
        COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), ARRAY[]::text[]) as tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    // Filter by archived status
    if (archived !== undefined) {
      sql += ` AND n.is_archived = $${paramCount}`;
      params.push(archived === "true");
      paramCount++;
    }

    // Filter by tag
    if (tag) {
      sql += ` AND t.name = $${paramCount}`;
      params.push(tag);
      paramCount++;
    }

    // Search in title and description
    if (search) {
      sql += ` AND (n.title ILIKE $${paramCount} OR n.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    sql += `
      GROUP BY n.id
      ORDER BY n.created_at DESC
    `;

    const notes = await query<NoteWithTags>(sql, params);

    res.json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    throw AppError.internal("Failed to fetch notes");
  }
}

export const getNoteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        n.id,
        n.title,
        n.description,
        n.color,
        n.is_archived,
        n.created_at,
        n.updated_at,
        COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), ARRAY[]::text[]) as tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      WHERE n.id = $1
      GROUP BY n.id
    `;

    const note = await queryOne<NoteWithTags>(sql, [id]);

    if (!note) {
      throw AppError.notFound("Note not found");
    }

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.internal("Failed to fetch note");
  }
};

export const createNote = async (req: Request, res: Response) => {
  try {
    const { title, description, color, tags } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      throw AppError.badRequest("Title is required");
    }

    if (!color || !color.trim()) {
      throw AppError.badRequest("Color is required");
    }

    // Use transaction to ensure all operations succeed or fail together
    const noteWithTags = await transaction(async (client) => {
      // Insert the note
      const insertNoteSql = `
        INSERT INTO notes (title, description, color, is_archived)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await client.query(insertNoteSql, [
        title.trim(),
        description?.trim() || null,
        color.trim(),
        false, // Default to not archived
      ]);

      const newNote = result.rows[0];

      if (!newNote) {
        throw AppError.internal("Failed to create note");
      }

      // If tags are provided, associate them with the note
      if (tags && Array.isArray(tags) && tags.length > 0) {
        for (const tagName of tags) {
          if (tagName && tagName.trim()) {
            // Check if tag exists
            const tagResult = await client.query(
              `SELECT * FROM tags WHERE name = $1`,
              [tagName.trim()]
            );

            let tag = tagResult.rows[0];

            // Create tag if it doesn't exist
            if (!tag) {
              const newTagResult = await client.query(
                `INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *`,
                [tagName.trim(), "#808080"]
              );
              tag = newTagResult.rows[0];
            }

            if (tag) {
              // Create note-tag association
              await client.query(
                `INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2)`,
                [newNote.id, tag.id]
              );
            }
          }
        }
      }

      // Fetch the complete note with tags
      const completeSql = `
        SELECT 
          n.id,
          n.title,
          n.description,
          n.color,
          n.is_archived,
          n.created_at,
          n.updated_at,
          COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), ARRAY[]::text[]) as tags
        FROM notes n
        LEFT JOIN note_tags nt ON n.id = nt.note_id
        LEFT JOIN tags t ON nt.tag_id = t.id
        WHERE n.id = $1
        GROUP BY n.id
      `;

      const completeResult = await client.query(completeSql, [newNote.id]);
      return completeResult.rows[0];
    });

    res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: noteWithTags,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.internal("Failed to create note");
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, color, tags } = req.body;

    // Check if note exists
    const existingNote = await queryOne<Note>(
      `SELECT * FROM notes WHERE id = $1`,
      [id]
    );

    if (!existingNote) {
      throw AppError.notFound("Note not found");
    }

    // Validate fields if provided
    if (title !== undefined && (!title || !title.trim())) {
      throw AppError.badRequest("Title cannot be empty");
    }

    if (color !== undefined && (!color || !color.trim())) {
      throw AppError.badRequest("Color cannot be empty");
    }

    // Use transaction to ensure all operations succeed or fail together
    const noteWithTags = await transaction(async (client) => {
      // Update the note
      const updateSql = `
        UPDATE notes 
        SET 
          title = COALESCE($1, title),
          description = $2,
          color = COALESCE($3, color),
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;

      const updateResult = await client.query(updateSql, [
        title?.trim() || null,
        description !== undefined
          ? description?.trim() || null
          : existingNote.description,
        color?.trim() || null,
        id,
      ]);

      const updatedNote = updateResult.rows[0];

      // Update tags if provided
      if (tags && Array.isArray(tags)) {
        // Remove existing tag associations
        await client.query(`DELETE FROM note_tags WHERE note_id = $1`, [id]);

        // Add new tags
        if (tags.length > 0) {
          for (const tagName of tags) {
            if (tagName && tagName.trim()) {
              // Check if tag exists
              const tagResult = await client.query(
                `SELECT * FROM tags WHERE name = $1`,
                [tagName.trim()]
              );

              let tag = tagResult.rows[0];

              // Create tag if it doesn't exist
              if (!tag) {
                const newTagResult = await client.query(
                  `INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *`,
                  [tagName.trim(), "#808080"]
                );
                tag = newTagResult.rows[0];
              }

              if (tag) {
                // Create note-tag association
                await client.query(
                  `INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2)`,
                  [id, tag.id]
                );
              }
            }
          }
        }
      }

      // Fetch the complete note with tags
      const completeSql = `
        SELECT 
          n.id,
          n.title,
          n.description,
          n.color,
          n.is_archived,
          n.created_at,
          n.updated_at,
          COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), ARRAY[]::text[]) as tags
        FROM notes n
        LEFT JOIN note_tags nt ON n.id = nt.note_id
        LEFT JOIN tags t ON nt.tag_id = t.id
        WHERE n.id = $1
        GROUP BY n.id
      `;

      const completeResult = await client.query(completeSql, [id]);
      return completeResult.rows[0];
    });

    res.json({
      success: true,
      message: "Note updated successfully",
      data: noteWithTags,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.internal("Failed to update note");
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if note exists
    const existingNote = await queryOne<Note>(
      `SELECT * FROM notes WHERE id = $1`,
      [id]
    );

    if (!existingNote) {
      throw AppError.notFound("Note not found");
    }

    // Delete note (this will cascade delete note_tags due to foreign key constraints)
    await query(`DELETE FROM notes WHERE id = $1`, [id]);

    res.json({
      success: true,
      message: "Note deleted successfully",
      data: existingNote,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.internal("Failed to delete note");
  }
};

export const toggleArchiveNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if note exists
    const existingNote = await queryOne<Note>(
      `SELECT * FROM notes WHERE id = $1`,
      [id]
    );

    if (!existingNote) {
      throw AppError.notFound("Note not found");
    }

    // Toggle archive status
    const updateSql = `
      UPDATE notes 
      SET 
        is_archived = NOT is_archived,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const updatedNote = await queryOne<Note>(updateSql, [id]);

    // Fetch complete note with tags
    const completeSql = `
      SELECT 
        n.id,
        n.title,
        n.description,
        n.color,
        n.is_archived,
        n.created_at,
        n.updated_at,
        COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), ARRAY[]::text[]) as tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      WHERE n.id = $1
      GROUP BY n.id
    `;

    const noteWithTags = await queryOne<NoteWithTags>(completeSql, [id]);

    res.json({
      success: true,
      message: `Note ${noteWithTags?.is_archived ? "archived" : "unarchived"} successfully`,
      data: noteWithTags,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.internal("Failed to toggle archive status");
  }
};

export const getAllTags = async (req: Request, res: Response) => {
  try {
    const sql = `
      SELECT 
        t.id,
        t.name,
        t.color,
        COUNT(nt.note_id) as note_count
      FROM tags t
      LEFT JOIN note_tags nt ON t.id = nt.tag_id
      GROUP BY t.id, t.name, t.color
      ORDER BY t.name ASC
    `;

    const tags = await query<Tag & { note_count: number }>(sql);

    res.json({
      success: true,
      count: tags.length,
      data: tags,
    });
  } catch (error) {
    throw AppError.internal("Failed to fetch tags");
  }
};

export const bulkDeleteNotes = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw AppError.badRequest("Note IDs array is required");
    }

    // Validate that all IDs are numbers
    const validIds = ids.filter((id) => Number.isInteger(Number(id)));

    if (validIds.length === 0) {
      throw AppError.badRequest("No valid note IDs provided");
    }

    // Create placeholders for SQL IN clause ($1, $2, $3, ...)
    const placeholders = validIds.map((_, index) => `$${index + 1}`).join(", ");

    // Check which notes exist
    const existingNotesSql = `SELECT id FROM notes WHERE id IN (${placeholders})`;
    const existingNotes = await query<{ id: number }>(
      existingNotesSql,
      validIds
    );

    if (existingNotes.length === 0) {
      throw AppError.notFound("No notes found with the provided IDs");
    }

    // Delete notes (cascades to note_tags)
    const deleteSql = `DELETE FROM notes WHERE id IN (${placeholders}) RETURNING id`;
    const deletedNotes = await query<{ id: number }>(deleteSql, validIds);

    res.json({
      success: true,
      message: `Successfully deleted ${deletedNotes.length} note(s)`,
      data: {
        deletedCount: deletedNotes.length,
        deletedIds: deletedNotes.map((note) => note.id),
        requestedCount: validIds.length,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.internal("Failed to delete notes");
  }
};
