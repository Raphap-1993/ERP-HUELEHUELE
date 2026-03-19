const SESSION_KEY = "huelegood.admin.session";

export function readStoredAdminSessionToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(SESSION_KEY);
}

export function writeStoredAdminSessionToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, token);
}

export function clearStoredAdminSessionToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}
