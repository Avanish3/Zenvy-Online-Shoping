import axios, { AxiosError } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8080`
    : "http://localhost:8080");
const HAS_EXPLICIT_API_BASE_URL = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);

export const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const persisted = window.localStorage.getItem("zenvy-auth");
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        const token = parsed?.state?.accessToken as string | undefined;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Ignore malformed local data and proceed unauthenticated.
      }
    }
  }

  return config;
});

export function unwrapAxiosError(error: unknown): string {
  if (error instanceof AxiosError) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

export async function withFallback<T>(
  request: () => Promise<T>,
  fallback: T,
): Promise<T> {
  // Skip server-side network waits during local builds when no API base URL was provided.
  if (typeof window === "undefined" && !HAS_EXPLICIT_API_BASE_URL) {
    return fallback;
  }

  try {
    return await request();
  } catch {
    return fallback;
  }
}
