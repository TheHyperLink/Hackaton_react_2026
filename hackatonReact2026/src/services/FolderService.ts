// Service pour les opérations sur les Folders (Dossiers)

import { ApiClient } from "./ApiClient";
import type {
  FolderDetail,
  FolderResponse,
  FoldersListResponse,
  CreateFolderRequest,
  UpdateFolderRequest,
} from "../types/ApiTypes";

export class FolderService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  /**
   * Récupère un dossier par son ID
   * GET /folders/{id}
   */
  public async getFolderById(id: number): Promise<FolderResponse> {
    return this.apiClient.get<FolderResponse>(`/folders/${id}`);
  }

  /**
   * Liste tous les dossiers de l'utilisateur authentifié
   * GET /folders
   */
  public async getFolders(): Promise<FoldersListResponse> {
    return this.apiClient.get<FoldersListResponse>("/folders");
  }

  /**
   * Crée un nouveau dossier
   * POST /folders
   */
  public async createFolder(request: CreateFolderRequest): Promise<FolderDetail> {
    return this.apiClient.post<FolderDetail>("/folders", request);
  }

  /**
   * Met à jour un dossier existant
   * PUT /folders/{id}
   */
  public async updateFolder(request: UpdateFolderRequest): Promise<FolderDetail> {
    return (await this.apiClient.put<FolderDetail>(`/folders/${request.id}`, request)) as FolderDetail;
  }

  /**
   * Supprime un dossier
   * DELETE /folders/{id}
   */
  public async deleteFolder(id: number): Promise<void> {
    return this.apiClient.delete<void>(`/folders/${id}`);
  }

  /**
   * Récupère la structure complète des dossiers avec sous-dossiers et notes
   * Fonction utilitaire pour construire l'arborescence
   */
  public async getFolderTree(): Promise<FolderDetail[]> {
    const response = await this.getFolders();
    return response.folders;
  }

  public async getRootFolderId(): Promise<number> {
    const response = await this.apiClient.get<FolderDetail[]>("/folders/roots");
    const folders = response;

    const root = folders.find(f => f.isRoot);
    if (!root) {
      throw new Error("Aucun dossier racine trouvé");
    }

    return root.id;
  }
}


export const folderService = new FolderService();
