import axios from "axios";

// API URL configuration (matches mastra.ts)
const API_URL = __DEV__
  ? "http://localhost:3001" // Development (local)
  : "http://72.60.17.245:3009"; // Production (VPS - using IP until DNS is set up)

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    username?: string;
  };
  token: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Register a new user account
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, data, {
      timeout: 10000,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.error || "Registration failed");
    } else if (error.request) {
      throw new Error("No response from server. Is the backend running?");
    } else {
      throw new Error(error.message || "Unknown error occurred");
    }
  }
}

/**
 * Login with existing account
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, data, {
      timeout: 10000,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.error || "Login failed");
    } else if (error.request) {
      throw new Error("No response from server. Is the backend running?");
    } else {
      throw new Error(error.message || "Unknown error occurred");
    }
  }
}

/**
 * Logout and invalidate session
 */
export async function logout(token: string): Promise<LogoutResponse> {
  try {
    const response = await axios.post(
      `${API_URL}/api/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.error || "Logout failed");
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error(error.message || "Unknown error occurred");
    }
  }
}
