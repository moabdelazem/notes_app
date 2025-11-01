"use client";

import type { Note } from "@/types/note";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Edit2, Archive, Trash2, ArchiveRestore } from "lucide-react";

interface NoteDetailSheetProps {
  note: Note | null;
  open: boolean;
  onClose: () => void;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  onToggleArchive: (id: number) => void;
}

export function NoteDetailSheet({
  note,
  open,
  onClose,
  onEdit,
  onDelete,
  onToggleArchive,
}: NoteDetailSheetProps) {
  if (!note) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <div className="sticky top-0 bg-background border-b px-6 py-4 z-10">
          <SheetHeader>
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-lg shrink-0 shadow-sm"
                style={{ backgroundColor: note.color }}
              />
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-2xl font-bold leading-tight break-words pr-8">
                  {note.title}
                </SheetTitle>
                {note.archived && (
                  <Badge variant="secondary" className="mt-2">
                    Archived
                  </Badge>
                )}
              </div>
            </div>
            <SheetDescription className="sr-only">
              View and manage note details
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* Description */}
          {note.description && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </h3>
              <div className="text-base leading-relaxed whitespace-pre-wrap break-words bg-muted/30 rounded-lg p-4">
                {note.description}
              </div>
            </div>
          )}

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1.5">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Metadata
            </h3>
            <div className="space-y-2 text-sm bg-muted/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium text-foreground">Created</div>
                  <div className="text-muted-foreground">
                    {new Date(note.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium text-foreground">
                    Last Updated
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(note.updated_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                size="lg"
                className="w-full justify-start h-12"
                onClick={() => {
                  onEdit(note);
                  onClose();
                }}
              >
                <Edit2 className="h-4 w-4 mr-3" />
                Edit Note
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full justify-start h-12"
                onClick={() => {
                  onToggleArchive(note.id);
                  onClose();
                }}
              >
                {note.archived ? (
                  <>
                    <ArchiveRestore className="h-4 w-4 mr-3" />
                    Unarchive Note
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-3" />
                    Archive Note
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-12"
                onClick={() => {
                  onDelete(note.id);
                  onClose();
                }}
              >
                <Trash2 className="h-4 w-4 mr-3" />
                Delete Note
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
