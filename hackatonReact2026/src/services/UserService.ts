// Service pour les opérations sur les Users (Utilisateurs)

import { ApiClient } from "./ApiClient";
import type { UserPublic, UserPrivate, CreateUserRequest } from "../types/ApiTypes";

export class UserService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  /**
   * Recherche un utilisateur par son ID
   * GET /users/{id}
   */
  public async getUserById(id: number): Promise<UserPublic> {
    return this.apiClient.get<UserPublic>(`/users/${id}`);
  }

  /**
   * Récupère les informations de l'utilisateur authentifié
   * GET /users/me
   */
  public async getCurrentUser(): Promise<UserPrivate> {
    return this.apiClient.get<UserPrivate>("/users/me");
  }

  /**
   * Crée un nouvel utilisateur
   * POST /users
   */
  public async createUser(request: CreateUserRequest): Promise<UserPrivate> {
    return this.apiClient.post<UserPrivate>("/users", request);
  }

  /**
   * Supprime un utilisateur
   * DELETE /users/{id}
   */
  public async deleteUser(id: number): Promise<void> {
    return this.apiClient.delete<void>(`/users/${id}`);
  }
}

export const userService = new UserService();
