"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { NoteTable } from "@/components/notes/note-table";
import { NoteForm } from "@/components/notes/note-form";
import { NoteDetailSheet } from "@/components/notes/note-detail-sheet";
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useToggleArchive,
  useTags,
  useBulkDeleteNotes,
} from "@/hooks/use-notes";
import type { Note, CreateNoteInput } from "@/types/note";
import { Plus, Search, Archive, X, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [showArchived, setShowArchived] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);

  // Queries
  const { data: notes = [], isLoading } = useNotes({
    archived: showArchived,
    tag: selectedTag,
    search: searchQuery || undefined,
  });
  const { data: tags = [] } = useTags();

  // Mutations
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const toggleArchive = useToggleArchive();
  const bulkDeleteNotes = useBulkDeleteNotes();

  const handleCreateNote = (data: CreateNoteInput) => {
    createNote.mutate(data, {
      onSuccess: () => {
        setIsFormOpen(false);
      },
    });
  };

  const handleUpdateNote = (data: CreateNoteInput) => {
    if (!editingNote) return;
    updateNote.mutate(
      { id: editingNote.id, input: data },
      {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingNote(null);
        },
      }
    );
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteNote.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
        },
      });
    }
  };

  const handleToggleArchive = (id: number) => {
    toggleArchive.mutate(id);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingNote(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag(undefined);
    setShowArchived(false);
  };

  const handleSelectNote = (id: number) => {
    setSelectedNotes((prev) =>
      prev.includes(id) ? prev.filter((noteId) => noteId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotes.length === notes.length) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(notes.map((note) => note.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedNotes.length === 0) return;
    bulkDeleteNotes.mutate(selectedNotes, {
      onSuccess: () => {
        setSelectedNotes([]);
      },
    });
  };

  const hasActiveFilters = searchQuery || selectedTag || showArchived;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Bulk Actions Toolbar */}
        {selectedNotes.length > 0 && (
          <div className="mb-4 flex items-center justify-between bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedNotes.length} note
                {selectedNotes.length !== 1 ? "s" : ""} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNotes([])}
              >
                Clear selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  selectedNotes.forEach((id) => toggleArchive.mutate(id));
                  setSelectedNotes([]);
                }}
                disabled={toggleArchive.isPending}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteNotes.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {bulkDeleteNotes.isPending ? "Deleting..." : "Delete Selected"}
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search and Archive Toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Toggle
              pressed={showArchived}
              onPressedChange={setShowArchived}
              aria-label="Toggle archived notes"
            >
              <Archive className="h-4 w-4 mr-2" />
              {showArchived ? "Viewing Archived" : "Show Archived"}
            </Toggle>
          </div>

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Filter by tag:
              </span>
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTag === tag.name ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() =>
                    setSelectedTag(
                      selectedTag === tag.name ? undefined : tag.name
                    )
                  }
                >
                  {tag.name}
                  {tag.usage_count && (
                    <span className="ml-1 opacity-60">({tag.usage_count})</span>
                  )}
                </Badge>
              ))}
            </div>
          )}

          {/* Active Filters Indicator */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary">Search: {searchQuery}</Badge>
              )}
              {selectedTag && (
                <Badge variant="secondary">Tag: {selectedTag}</Badge>
              )}
              {showArchived && <Badge variant="secondary">Archived</Badge>}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Notes Table */}
        <NoteTable
          notes={notes}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleArchive={handleToggleArchive}
          onNoteClick={setSelectedNote}
          selectedNotes={selectedNotes}
          onSelectNote={handleSelectNote}
          onSelectAll={handleSelectAll}
        />
      </main>

      {/* Note Detail Sheet */}
      <NoteDetailSheet
        note={selectedNote}
        open={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleArchive={handleToggleArchive}
      />

      {/* Note Form Dialog */}
      <NoteForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingNote ? handleUpdateNote : handleCreateNote}
        note={editingNote}
        isLoading={createNote.isPending || updateNote.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
