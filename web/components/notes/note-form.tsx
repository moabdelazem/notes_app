"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import type { Note, CreateNoteInput } from "@/types/note";

interface NoteFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNoteInput) => void;
  note?: Note | null;
  isLoading?: boolean;
}

const COLOR_OPTIONS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ec4899", // pink
  "#64748b", // slate
];

export function NoteForm({
  open,
  onClose,
  onSubmit,
  note,
  isLoading,
}: NoteFormProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [description, setDescription] = useState(note?.description || "");
  const [color, setColor] = useState(note?.color || COLOR_OPTIONS[0]);
  const [tags, setTags] = useState(note?.tags.join(", ") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      color,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    onSubmit(data);
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitle(note?.title || "");
      setDescription(note?.description || "");
      setColor(note?.color || COLOR_OPTIONS[0]);
      setTags(note?.tags.join(", ") || "");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{note ? "Edit Note" : "Create New Note"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Title */}
            <Field>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter note title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </Field>

            {/* Description */}
            <Field>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Enter note description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </Field>

            {/* Color */}
            <Field>
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: colorOption,
                      borderColor:
                        color === colorOption ? "#000" : "transparent",
                    }}
                  />
                ))}
              </div>
            </Field>

            {/* Tags */}
            <Field>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Enter tags separated by commas"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate tags with commas (e.g., work, important, ideas)
              </p>
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? "Saving..." : note ? "Update Note" : "Create Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
