const TOKEN_KEY = "library_token";
const SESSION_EXPIRED_KEY = "library_session_expired";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function markSessionExpired() {
  sessionStorage.setItem(SESSION_EXPIRED_KEY, "1");
}

export function consumeSessionExpiredFlag() {
  const expired = sessionStorage.getItem(SESSION_EXPIRED_KEY) === "1";
  if (expired) {
    sessionStorage.removeItem(SESSION_EXPIRED_KEY);
  }
  return expired;
}

export async function logoutSession(logoutApi) {
  try {
    if (getToken()) {
      await logoutApi();
    }
  } catch {
  } finally {
    clearToken();
    sessionStorage.clear();
  }
}

export function decodeJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeJwt(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
}

export function getSession() {
  const token = getToken();
  if (token && isTokenExpired(token)) {
    clearToken();
    sessionStorage.clear();
    return {
      token: null,
      payload: null,
      username: null,
      roles: [],
      permissions: []
    };
  }
  const payload = decodeJwt(token);
  const scope = payload?.scope ? payload.scope.split(" ").filter(Boolean) : [];
  return {
    token,
    payload,
    username: payload?.sub ?? null,
    roles: scope.filter((item) => item.startsWith("ROLE_")).map((item) => item.replace("ROLE_", "")),
    permissions: scope.filter((item) => !item.startsWith("ROLE_"))
  };
}

export function hasRole(role) {
  return getSession().roles.includes(role);
}

export function hasPermission(permission) {
  return getSession().permissions.includes(permission);
}

export function isAuthenticated() {
  return Boolean(getSession().token);
}

export function isAdminSession(session = getSession()) {
  return session.roles.includes("CHU_THU_VIEN");
}

export function isStaffSession(session = getSession()) {
  if (isAdminSession(session)) return true;
  if (session.roles.includes("NHAN_VIEN")) return true;
  return [
    "GET_PHIEU_MUON",
    "CREATE_NHAN_VIEN",
    "CREATE_DAU_SACH",
    "UPDATE_DAU_SACH",
    "CREATE_CUON_SACH",
    "CREATE_PHIEU_MUON",
    "CREATE_PHIEU_PHAT",
    "CREATE_CHI_TIET_PHIEU_MUON"
  ].some((permission) => session.permissions.includes(permission));
}

export function isReaderSession(session = getSession()) {
  return Boolean(session.token) && !isStaffSession(session);
}
