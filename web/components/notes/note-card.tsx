"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Note } from "@/types/note";
import { Archive, Edit2, Trash2, ArchiveRestore } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  onToggleArchive: (id: number) => void;
}

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onToggleArchive,
}: NoteCardProps) {
  return (
    <Card
      className={cn(
        "p-4 transition-all hover:shadow-md",
        note.archived && "opacity-60"
      )}
      style={{
        borderLeft: `4px solid ${note.color}`,
      }}
    >
      <div className="space-y-3">
        {/* Header with title and actions */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight line-clamp-2">
            {note.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(note)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleArchive(note.id)}
            >
              {note.archived ? (
                <ArchiveRestore className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(note.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {note.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {note.description}
          </p>
        )}

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer with date */}
        <div className="text-xs text-muted-foreground">
          {new Date(note.updated_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>
    </Card>
  );
}
