// Export centralisé de tous les services API

export { ApiClient } from "./ApiClient";
export { NoteService, noteService } from "./NoteService";
export { FolderService, folderService } from "./FolderService";
export { UserService, userService } from "./UserService";
export { AuthService, authService } from "./AuthService";

// Types API
export type {
  InternalLink,
  ExternalLink,
  NoteDetail,
  CreateNoteRequest,
  UpdateNoteRequest,
  NotesListResponse,
  NoteWithLinks,
  FolderDetail,
  FolderResponse,
  FoldersListResponse,
  CreateFolderRequest,
  UpdateFolderRequest,
  UserPublic,
  UserPrivate,
  CreateUserRequest,
  LoginRequest,
  AuthResponse,
  ErrorResponse,
} from "../types/ApiTypes";
