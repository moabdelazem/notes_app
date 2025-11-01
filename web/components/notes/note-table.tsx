"use client";

import type { Note } from "@/types/note";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Archive,
  Edit2,
  Trash2,
  ArchiveRestore,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteTableProps {
  notes: Note[];
  isLoading?: boolean;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  onToggleArchive: (id: number) => void;
  onNoteClick: (note: Note) => void;
  selectedNotes?: number[];
  onSelectNote?: (id: number) => void;
  onSelectAll?: () => void;
}

export function NoteTable({
  notes,
  isLoading,
  onEdit,
  onDelete,
  onToggleArchive,
  onNoteClick,
  selectedNotes = [],
  onSelectNote,
  onSelectAll,
}: NoteTableProps) {
  const isSelectionMode =
    selectedNotes.length > 0 || (onSelectNote && onSelectAll);
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {isSelectionMode && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    selectedNotes.length === notes.length && notes.length > 0
                  }
                  onCheckedChange={onSelectAll}
                  aria-label="Select all notes"
                />
              </TableHead>
            )}
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="hidden sm:table-cell">Tags</TableHead>
            <TableHead className="hidden lg:table-cell">Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notes.map((note) => (
            <TableRow
              key={note.id}
              className={cn(note.archived && "opacity-60", "cursor-pointer")}
              onClick={() => onNoteClick(note)}
            >
              {/* Checkbox */}
              {isSelectionMode && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedNotes.includes(note.id)}
                    onCheckedChange={() => onSelectNote?.(note.id)}
                    aria-label={`Select note ${note.title}`}
                  />
                </TableCell>
              )}

              {/* Color Indicator */}
              <TableCell>
                <div
                  className="w-6 h-6 rounded-full border-2"
                  style={{ backgroundColor: note.color }}
                />
              </TableCell>

              {/* Title */}
              <TableCell className="font-medium">
                <div className="max-w-[200px] truncate">{note.title}</div>
              </TableCell>

              {/* Description */}
              <TableCell className="hidden md:table-cell">
                <div className="max-w-[300px] truncate text-muted-foreground">
                  {note.description || "-"}
                </div>
              </TableCell>

              {/* Tags */}
              <TableCell className="hidden sm:table-cell">
                {note.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{note.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>

              {/* Updated Date */}
              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                {new Date(note.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <TooltipProvider>
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(note);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit Note</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleArchive(note.id);
                          }}
                        >
                          {note.archived ? (
                            <ArchiveRestore className="h-4 w-4" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {note.archived ? "Unarchive Note" : "Archive Note"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(note.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete Note</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
