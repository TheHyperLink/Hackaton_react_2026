// Service API de base - Client HTTP réutilisable

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8080/api";

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

  private getJsonHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
    };
  }

  private getBinaryHeaders(): Record<string, string> {
    // No Content-Type for binary GET requests
    return {};
  }

  /**
   * GET request supporting JSON or Blob
   */
  public async get<T>(
    endpoint: string,
    queryParams?: Record<string, unknown>,
    responseType: "json" | "blob" = "json"
  ): Promise<T> {
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
      headers:
        responseType === "blob"
          ? this.getBinaryHeaders()
          : this.getJsonHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const json = JSON.parse(errorText);
        errorMessage = json.message || errorText;
      } catch {}
      const error: any = new Error(errorMessage || `GET ${endpoint} failed with status ${response.status}`);
      error.status = response.status;
      error.url = url.toString();
      throw error;
    }

    if (responseType === "blob") {
      return (await response.blob()) as T;
    }

    return response.json();
  }

  /**
   * POST JSON - Support des réponses JSON ou Blob
   */
  public async post<T>(
    endpoint: string, 
    data?: unknown,
    responseType: "json" | "blob" = "json"
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this.getJsonHeaders(),
      credentials: "include",
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const json = JSON.parse(errorText);
        errorMessage = json.message || errorText;
      } catch {}
      const error: any = new Error(errorMessage || `POST ${endpoint} failed with status ${response.status}`);
      error.status = response.status;
      error.url = `${this.baseUrl}${endpoint}`;
      throw error;
    }

    // Si on attend un blob (pour un PDF)
    if (responseType === "blob") {
      return (await response.blob()) as T;
    }

    return response.json();
  }

  /**
   * PUT JSON - Support des réponses JSON ou Blob
   */
  public async put<T>(
    endpoint: string, 
    data?: unknown,
    responseType: "json" | "blob" = "json"
  ): Promise<T | void> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: this.getJsonHeaders(),
      credentials: "include",
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const json = JSON.parse(errorText);
        errorMessage = json.message || errorText;
      } catch {}
      const error: any = new Error(errorMessage || `PUT ${endpoint} failed with status ${response.status}`);
      error.status = response.status;
      error.url = `${this.baseUrl}${endpoint}`;
      throw error;
    }

    // Si on attend un blob (pour un PDF)
    if (responseType === "blob") {
      return (await response.blob()) as T;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return undefined;
    }

    const text = await response.text();
    if (!text) return undefined;

    return JSON.parse(text);
  }

  /**
   * DELETE JSON
   */
  public async delete<T>(endpoint: string): Promise<T | void> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers: this.getJsonHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const json = JSON.parse(errorText);
        errorMessage = json.message || errorText;
      } catch {}
      const error: any = new Error(errorMessage || `DELETE ${endpoint} failed with status ${response.status}`);
      error.status = response.status;
      error.url = `${this.baseUrl}${endpoint}`;
      throw error;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return undefined;
    }

    const text = await response.text();
    if (!text) return undefined;

    return JSON.parse(text);
  }
}