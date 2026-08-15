export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthSession {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let message = "Something went wrong. Please try again.";

  try {
    const body = await response.json();

    if (typeof body?.detail === "string") {
      message = body.detail;
    } else if (Array.isArray(body?.detail)) {
      message = body.detail[0]?.msg ?? message;
    }
  } catch {
    // Keep the generic message when the server did not return JSON.
  }

  throw new Error(message);
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthSession> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<AuthSession>(response);
}

export async function loginAccount(input: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<AuthSession>(response);
}

export async function getCurrentUser(
  accessToken: string
): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return parseResponse<AuthUser>(response);
}
