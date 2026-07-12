const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type HeadersInit = Record<string, string>;

function getHeaders(isFormData = false): HeadersInit {
  const headers: HeadersInit = {};
  
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("transitops_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  if (response.status === 204) {
    return {} as T;
  }
  
  // For file downloads (CSV export)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("text/csv")) {
    const blob = await response.blob();
    return blob as unknown as T;
  }
  
  return response.json();
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body: any, isFormData = false): Promise<T> {
    const options: RequestInit = {
      method: "POST",
      headers: getHeaders(isFormData),
    };
    
    if (body) {
      if (isFormData) {
        options.body = body;
      } else {
        options.body = JSON.stringify(body);
      }
    }
    
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    return handleResponse<T>(response);
  },

  async put<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<T>(response);
  },
};
