import { AxiosError } from "axios";
import { API } from "@/services/api";
import type { AuthSession } from "@/types";

interface LocalAuthAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "user";
}

const LOCAL_AUTH_ACCOUNTS_KEY = "zenvy-local-auth-accounts";

function isNetworkFailure(error: unknown) {
  return error instanceof AxiosError && !error.response;
}

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readLocalAccounts(): LocalAuthAccount[] {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as LocalAuthAccount[]) : [];
  } catch {
    return [];
  }
}

function writeLocalAccounts(accounts: LocalAuthAccount[]) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(LOCAL_AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function buildLocalSession(account: LocalAuthAccount): AuthSession {
  return {
    accessToken: `local_access_${account.id}`,
    refreshToken: `local_refresh_${account.id}`,
    tokenType: "Bearer",
    expiresIn: 3600,
    refreshExpiresIn: 2592000,
    sessionId: `local_session_${account.id}`,
    user: {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      tier: "gold",
    },
  };
}

export async function login(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const response = await API.post<AuthSession>("/api/v1/auth/login", {
      email: normalizedEmail,
      password,
    });
    return response.data;
  } catch (error) {
    if (!isNetworkFailure(error)) {
      throw error;
    }

    const account = readLocalAccounts().find(
      (entry) => entry.email === normalizedEmail && entry.password === password,
    );
    if (!account) {
      throw new Error(
        "Cannot reach the backend right now. Start the backend on port 8080 or register a local preview account.",
      );
    }

    return buildLocalSession(account);
  }
}

export async function register(name: string, email: string, password: string) {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const response = await API.post<AuthSession>("/api/v1/auth/register", {
      name: normalizedName,
      email: normalizedEmail,
      password,
    });
    return response.data;
  } catch (error) {
    if (!isNetworkFailure(error)) {
      throw error;
    }

    const existingAccounts = readLocalAccounts();
    if (existingAccounts.some((entry) => entry.email === normalizedEmail)) {
      throw new Error(
        "This email already exists in preview mode. Please log in instead.",
      );
    }

    const account: LocalAuthAccount = {
      id: `local_${Date.now()}`,
      name: normalizedName,
      email: normalizedEmail,
      password,
      role: "user",
    };
    writeLocalAccounts([...existingAccounts, account]);
    return buildLocalSession(account);
  }
}

export async function demoLogin(userId = "usr_demo_1") {
  try {
    const response = await API.post<AuthSession>("/api/v1/auth/token", {
      userId,
    });
    return response.data;
  } catch (error) {
    if (!isNetworkFailure(error)) {
      throw error;
    }

    return buildLocalSession({
      id: "usr_demo_1",
      name: "Aarav Mehta",
      email: "aarav@zenvy.dev",
      password: "Password@123",
      role: "user",
    });
  }
}
