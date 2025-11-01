export interface Note {
  id: number;
  title: string;
  description: string | null;
  color: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  usage_count?: number;
}

export interface CreateNoteInput {
  title: string;
  description?: string;
  color?: string;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  description?: string;
  color?: string;
  tags?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export interface NotesQueryParams {
  archived?: boolean;
  tag?: string;
  search?: string;
}
