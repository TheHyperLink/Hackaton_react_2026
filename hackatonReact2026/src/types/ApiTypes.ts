// Types pour les réponses API et requêtes

// === Notes ===
export interface InternalLink {
  noteId: number;
  targetNoteId: number;
}

export interface ExternalLink {
  id: number;
  noteId: number;
  url: string;
}

export interface NoteDetail {
  id: number;
  title: string;
  content: string;
  sizeBytes: number;
  lineCount: number;
  wordCount: number;
  charCount: number;
  internalLinks: number[];
  externalLinks: string[];
}

export interface CreateNoteRequest {
  folderId: number;
  title: string;
  content: string;
}

export interface UpdateNoteRequest {
  id: number;
  title: string;
  content: string;
}

export interface NotesListResponse {
  notes: NoteWithLinks[];
}

export interface NoteWithLinks {
  id: number;
  userId: number;
  folderId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  internalLinks: InternalLink[];
  externalLinks: ExternalLink[];
}

// === Folders ===
export interface FolderDetail {
  id: number;
  userId: number;
  name: string;
  color: string;
  parentFolderId: number | null;
  createdAt: string;
  updatedAt: string;
  subFolders: string[];
  notes: NoteWithLinks[];
}

export interface FolderResponse {
  folder: FolderDetail;
}

export interface FoldersListResponse {
  folders: FolderDetail[];
}

export interface CreateFolderRequest {
  name: string;
  color: string;
  parentFolderId?: number | null;
}

export interface UpdateFolderRequest {
  id: number;
  name: string;
  color: string;
  parentFolderId?: number | null;
}

// === Users ===
export interface UserPublic {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPrivate extends UserPublic {
  passwordHash: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  passwordHash: string;
}

// === Authentication ===
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  [key: string]: string;
}

// === Error Response ===
export interface ErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  properties: Record<string, unknown>;
}
