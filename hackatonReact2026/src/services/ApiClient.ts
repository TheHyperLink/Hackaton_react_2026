// Service API de base - Client HTTP réutilisable

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8080/api";

export class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string;

  private constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  public static getInstance(baseUrl?: string): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient(baseUrl);
    }
    return ApiClient.instance;
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
    };
  }

  public async get<T>(endpoint: string, queryParams?: Record<string, unknown>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include", // Inclure les cookies automatiquement
    });

    if (!response.ok) {
      throw new Error(`GET ${endpoint} failed with status ${response.status}`);
    }

    return response.json();
  }

  public async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include", // Inclure les cookies automatiquement
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`POST ${endpoint} failed with status ${response.status}`);
    }

    return response.json();
  }

  public async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: this.getHeaders(),
      credentials: "include", // Inclure les cookies automatiquement
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`PUT ${endpoint} failed with status ${response.status}`);
    }

    return response.json();
  }

  public async delete<T>(endpoint: string): Promise<T | void> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers: this.getHeaders(),
      credentials: "include", // Inclure les cookies automatiquement
    });

    if (!response.ok) {
      throw new Error(`DELETE ${endpoint} failed with status ${response.status}`);
    }

    // Gérer les réponses vides (204 No Content ou corps vide)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return undefined;
    }

    const text = await response.text();
    if (!text) {
      return undefined;
    }

    return JSON.parse(text);
  }
}
