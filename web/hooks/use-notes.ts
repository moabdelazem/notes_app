"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notesApi, tagsApi } from "@/lib/api";
import type {
  CreateNoteInput,
  UpdateNoteInput,
  NotesQueryParams,
} from "@/types/note";
import { toast } from "sonner";

// Query keys for cache management
export const noteKeys = {
  all: ["notes"] as const,
  lists: () => [...noteKeys.all, "list"] as const,
  list: (filters?: NotesQueryParams) => [...noteKeys.lists(), filters] as const,
  details: () => [...noteKeys.all, "detail"] as const,
  detail: (id: number) => [...noteKeys.details(), id] as const,
};

export const tagKeys = {
  all: ["tags"] as const,
};

// Fetch all notes with optional filters
export function useNotes(params?: NotesQueryParams) {
  return useQuery({
    queryKey: noteKeys.list(params),
    queryFn: async () => {
      const response = await notesApi.getNotes(params);
      return response.data;
    },
  });
}

// Fetch single note
export function useNote(id: number) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: async () => {
      const response = await notesApi.getNote(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create note mutation
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNoteInput) => notesApi.createNote(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
      toast.success("Note created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create note");
    },
  });
}

// Update note mutation
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateNoteInput }) =>
      notesApi.updateNote(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: noteKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
      toast.success("Note updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update note");
    },
  });
}

// Toggle archive mutation
export function useToggleArchive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notesApi.toggleArchive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(id) });
      toast.success("Note archived status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update archive status");
    },
  });
}

// Delete note mutation
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notesApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
      toast.success("Note deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete note");
    },
  });
}

// Bulk delete notes mutation
export function useBulkDeleteNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => notesApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
      toast.success("Notes deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete notes");
    },
  });
}

// Fetch all tags
export function useTags() {
  return useQuery({
    queryKey: tagKeys.all,
    queryFn: async () => {
      const response = await tagsApi.getTags();
      return response.data;
    },
  });
}
