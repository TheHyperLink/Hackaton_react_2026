// Service pour les opérations d'Authentication (Connexion/Déconnexion)

import { ApiClient } from "./ApiClient";
import type { LoginRequest, RegisterRequest, AuthResponse } from "../types/ApiTypes";
import { userService } from "./UserService";

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
    console.log("Connexion réussie, token reçu dans le cookie");
    return response;
  }

  /**
   * Inscription d'un nouvel utilisateur
   * POST /auth/register
   */
  public async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await this.apiClient.post<AuthResponse>("/users", request);
    console.log("Inscription réussie, token reçu dans le cookie");
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

  /**
   * Vérifie la session utilisateur côté serveur (endpoint /users/me)
   * Retourne true si la session est valide, false sinon
   */
  public async checkSession(): Promise<boolean> {
    try {
      await userService.getCurrentUser();
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const authService = new AuthService();

