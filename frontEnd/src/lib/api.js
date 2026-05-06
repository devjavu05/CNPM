import { clearToken, getToken, markSessionExpired } from "./auth";

const API_BASE = "http://localhost:8080";

function handleUnauthorized(response) {
  if (response.status !== 401 || !getToken()) return;
  clearToken();
  sessionStorage.clear();
  markSessionExpired();
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

export async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  handleUnauthorized(response);

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(
      payload?.message || `Request failed with status ${response.status}`,
    );
  }

  return normalizeApiData(payload?.result ?? payload);
}

export async function apiUpload(path, formData, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method: options.method || "POST",
    body: formData,
    headers,
  });
  handleUnauthorized(response);

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(
      payload?.message || `Request failed with status ${response.status}`,
    );
  }

  return normalizeApiData(payload?.result ?? payload);
}

function resolveAssetUrl(path) {
  if (!path || typeof path !== "string") return path;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("//")) return `http:${path}`;
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

function normalizeApiData(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeApiData);
  }

  if (value && typeof value === "object") {
    const normalized = {};
    for (const [key, currentValue] of Object.entries(value)) {
      if (
        key === "coverImageUrl" ||
        key === "eBookLink" ||
        key === "ownedAccessLink" ||
        key === "accessLink"
      ) {
        normalized[key] = resolveAssetUrl(currentValue);
      } else {
        normalized[key] = normalizeApiData(currentValue);
      }
    }
    return normalized;
  }

  return value;
}

export const libraryApi = {
  login: (body) =>
    apiFetch("/auths", { method: "POST", body: JSON.stringify(body) }),
  forgotPassword: (body) =>
    apiFetch("/auths/forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: () => apiFetch("/auths/logout", { method: "POST" }),
  getNotifications: () => apiFetch("/notifications"),
  getNotificationDetail: (id) => apiFetch(`/notifications/${id}`),
  getNotificationUnreadCount: () => apiFetch("/notifications/unread-count"),
  markAllNotificationsRead: () =>
    apiFetch("/notifications/mark-all-read", { method: "PATCH" }),
  registerReader: (body) =>
    apiFetch("/docgia", { method: "POST", body: JSON.stringify(body) }),
  getBooks: () => apiFetch("/books"),
  getBookById: (id) => apiFetch(`/books/${id}`),
  searchBooks: (params = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.author) query.set("author", params.author);
    if (params.category) query.set("category", params.category);
    if (params.publishYear) query.set("publishYear", params.publishYear);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch(`/books/search${suffix}`);
  },
  staffLookupBooks: (params = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.category) query.set("category", params.category);
    if (params.page !== undefined) query.set("page", params.page);
    if (params.size !== undefined) query.set("size", params.size);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch(`/books/staff-lookup${suffix}`);
  },
  staffLookupCopy: (barcode) => apiFetch(`/books/copies/${barcode}/lookup`),
  getLookupBookDetail: (id) => apiFetch(`/books/${id}/lookup`),
  getBookReviews: (id) => apiFetch(`/books/${id}/reviews`),
  submitBookReview: (id, body) =>
    apiFetch(`/books/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  createBook: (body) =>
    apiFetch("/books", { method: "POST", body: JSON.stringify(body) }),
  getInventory: (params = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.category) query.set("category", params.category);
    if (params.page !== undefined) query.set("page", params.page);
    if (params.size !== undefined) query.set("size", params.size);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch(`/books/inventory${suffix}`);
  },
  createInventoryBook: (body) =>
    apiFetch("/books/inventory", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  uploadBookCover: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiUpload("/books/cover-upload", formData);
  },
  deleteBook: (id) => apiFetch(`/books/${id}`, { method: "DELETE" }),
  addCopiesToBook: (bookId, body) =>
    apiFetch(`/books/${bookId}/copies`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateBook: (id, body) =>
    apiFetch(`/books/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  getCopies: (bookId) => apiFetch(`/books/${bookId}/cuonSach`),
  createCopy: (body) =>
    apiFetch("/books/cuonSach", { method: "POST", body: JSON.stringify(body) }),
  liquidateCopy: (barcode) =>
    apiFetch(`/books/copies/${barcode}/liquidate`, { method: "PATCH" }),
  getTickets: () => apiFetch("/books/tickets"),
  searchTickets: (params = {}) => {
    const query = new URLSearchParams();
    if (params.nguoiMuonName) query.set("nguoiMuonName", params.nguoiMuonName);
    if (params.borrowDateFrom)
      query.set("borrowDateFrom", params.borrowDateFrom);
    if (params.borrowDateTo) query.set("borrowDateTo", params.borrowDateTo);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch(`/books/tickets/search${suffix}`);
  },
  createTicket: (body) =>
    apiFetch("/books/tickets", { method: "POST", body: JSON.stringify(body) }),
  deleteTicket: (id) => apiFetch(`/books/tickets/${id}`, { method: "DELETE" }),
  finalizeTicket: (id) =>
    apiFetch(`/books/tickets/${id}/finalize`, { method: "PATCH" }),
  getTicketDetails: () => apiFetch("/books/ticket-details"),
  createTicketDetail: (body) =>
    apiFetch("/books/ticket-details", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  returnTicketDetail: (detailId) =>
    apiFetch(`/books/ticket-details/${detailId}/return`, { method: "PATCH" }),
  renewBorrowedBook: (ticketId) =>
    apiFetch(`/books/tickets/${ticketId}/renew`, { method: "PATCH" }),
  getReservations: () => apiFetch("/books/reservations"),
  getReservationsByDauSach: (dauSachId) =>
    apiFetch(`/books/${dauSachId}/reservations`),
  confirmReservation: (id) =>
    apiFetch(`/books/reservations/${id}/confirm`, { method: "PATCH" }),
  createReservation: (body) =>
    apiFetch("/books/reservations", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  cancelReservation: (id) =>
    apiFetch(`/books/reservations/${id}/cancel`, { method: "PATCH" }),
  deleteReservation: (id) =>
    apiFetch(`/books/reservations/${id}`, { method: "DELETE" }),
  getMyBorrowHistory: () => apiFetch("/books/reader/borrow-history"),
  getMyReaderProfile: () => apiFetch("/docgia/me"),
  updateMyReaderBalance: (body) =>
    apiFetch("/docgia/me/balance", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  purchaseEBook: (body) =>
    apiFetch("/books/ebooks/purchase", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getMyPurchasedEBooks: () => apiFetch("/books/ebooks/my-purchases"),
  getFines: () => apiFetch("/books/fines"),
  createFine: (body) =>
    apiFetch("/books/fines", { method: "POST", body: JSON.stringify(body) }),
  payFine: (id) => apiFetch(`/books/fines/${id}/pay`, { method: "PATCH" }),
  getReservationsById: (id) => apiFetch(`/books/reservations/${id}`),
  createStaff: (body) =>
    apiFetch("/nhanvien", { method: "POST", body: JSON.stringify(body) }),
  getUsers: () => apiFetch("/users"),
  updateUser: (username, body) =>
    apiFetch(`/users/${username}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  getRoles: () => apiFetch("/roles"),
  createRole: (body) =>
    apiFetch("/roles", { method: "POST", body: JSON.stringify(body) }),
  deleteRole: (name) => apiFetch(`/roles/${name}`, { method: "DELETE" }),
  getPermissions: () => apiFetch("/permissions"),
  createPermission: (body) =>
    apiFetch("/permissions", { method: "POST", body: JSON.stringify(body) }),
  deletePermission: (name) =>
    apiFetch(`/permissions/${name}`, { method: "DELETE" }),
};
