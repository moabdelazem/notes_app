"use client";

import type { Note } from "@/types/note";
import { NoteCard } from "./note-card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { StickyNote } from "lucide-react";

interface NoteListProps {
  notes: Note[];
  isLoading?: boolean;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  onToggleArchive: (id: number) => void;
}

export function NoteList({
  notes,
  isLoading,
  onEdit,
  onDelete,
  onToggleArchive,
}: NoteListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <StickyNote />
          </EmptyMedia>
          <EmptyTitle>No notes found</EmptyTitle>
          <EmptyDescription>
            Create your first note to get started
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleArchive={onToggleArchive}
        />
      ))}
    </div>
  );
}
