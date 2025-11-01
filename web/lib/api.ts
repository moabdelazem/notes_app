import type {
  Note,
  Tag,
  CreateNoteInput,
  UpdateNoteInput,
  ApiResponse,
  NotesQueryParams,
} from "@/types/note";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:6767/api";

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "An error occurred",
    }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Notes API functions
export const notesApi = {
  // Get all notes with optional filters
  getNotes: async (params?: NotesQueryParams): Promise<ApiResponse<Note[]>> => {
    const searchParams = new URLSearchParams();
    if (params?.archived !== undefined) {
      searchParams.append("archived", String(params.archived));
    }
    if (params?.tag) {
      searchParams.append("tag", params.tag);
    }
    if (params?.search) {
      searchParams.append("search", params.search);
    }

    const query = searchParams.toString();
    return fetchAPI<Note[]>(`/notes${query ? `?${query}` : ""}`);
  },

  // Get single note by ID
  getNote: async (id: number): Promise<ApiResponse<Note>> => {
    return fetchAPI<Note>(`/notes/${id}`);
  },

  // Create new note
  createNote: async (input: CreateNoteInput): Promise<ApiResponse<Note>> => {
    return fetchAPI<Note>("/notes", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // Update existing note
  updateNote: async (
    id: number,
    input: UpdateNoteInput
  ): Promise<ApiResponse<Note>> => {
    return fetchAPI<Note>(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  // Toggle archive status
  toggleArchive: async (id: number): Promise<ApiResponse<Note>> => {
    return fetchAPI<Note>(`/notes/${id}/archive`, {
      method: "PATCH",
    });
  },

  // Delete note
  deleteNote: async (id: number): Promise<ApiResponse<void>> => {
    return fetchAPI<void>(`/notes/${id}`, {
      method: "DELETE",
    });
  },

  // Bulk delete notes
  bulkDelete: async (ids: number[]): Promise<ApiResponse<void>> => {
    return fetchAPI<void>("/notes/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  },
};

// Tags API functions
export const tagsApi = {
  // Get all tags with usage count
  getTags: async (): Promise<ApiResponse<Tag[]>> => {
    return fetchAPI<Tag[]>("/tags");
  },
};
