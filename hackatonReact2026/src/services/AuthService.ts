// Service pour les opérations d'Authentication (Connexion/Déconnexion)

import { ApiClient } from "./ApiClient";
import type { LoginRequest, AuthResponse } from "../types/ApiTypes";

export class AuthService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  /**
   * Connexion utilisateur
   * POST /auth/login
   * Le token JWT est automatiquement stocké dans un cookie par le backend
   */
  public async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await this.apiClient.post<AuthResponse>("/auth/login", request);
    console.log("✅ Connexion réussie, token reçu dans le cookie");
    return response;
  }

  /**
   * Déconnexion utilisateur
   * POST /auth/logout
   */
  public async logout(): Promise<AuthResponse> {
    return this.apiClient.post<AuthResponse>("/auth/logout");
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   * En mode cookie, on peut vérifier s'il y a un cookie valide
   */
  public isAuthenticated(): boolean {
    // Vérifier si le cookie JWT existe
    return document.cookie.includes("jwt=");
  }
}

export const authService = new AuthService();

