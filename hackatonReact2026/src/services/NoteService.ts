// Service pour les opérations sur les Notes

import { ApiClient } from "./ApiClient";
import type {
  NoteDetail,
  CreateNoteRequest,
  UpdateNoteRequest,
  NotesListResponse,
  NoteWithLinks,
} from "../types/ApiTypes";

export class NoteService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  /**
   * Récupère une note par son ID
   * GET /notes/{id}
   */
  public async getNoteById(id: number): Promise<NoteDetail> {
    return this.apiClient.get<NoteDetail>(`/notes/${id}`);
  }

  /**
   * Liste toutes les notes de l'utilisateur authentifié
   * GET /notes
   * @param folderId - Filtre optionnel par dossier
   * @param search - Recherche optionnelle
   */
  public async getNotes(folderId?: number, search?: string): Promise<NotesListResponse> {
    const queryParams: Record<string, unknown> = {};
    if (folderId !== undefined) queryParams.folderId = folderId;
    if (search !== undefined) queryParams.search = search;

    return this.apiClient.get<NotesListResponse>("/notes", queryParams);
  }

  /**
   * Crée une nouvelle note
   * POST /notes
   */
  public async createNote(request: CreateNoteRequest): Promise<NoteWithLinks> {
    return this.apiClient.post<NoteWithLinks>("/notes", request);
  }

  /**
   * Met à jour une note existante
   * PUT /notes/{id}
   */
  public async updateNote(request: UpdateNoteRequest): Promise<void> {
    return this.apiClient.put<void>(`/notes/${request.id}`, request);
  }

  /**
   * Supprime une note
   * DELETE /notes/{id}
   */
  public async deleteNote(id: number): Promise<void> {
    return this.apiClient.delete<void>(`/notes/${id}`);
  }
}

export const noteService = new NoteService();
