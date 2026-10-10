// Client-side view of the JWT session. The backend issues 30-minute tokens but
// does not reject expired ones, so the UI enforces expiry itself.

const TOKEN_KEY = "edutrack_token";

function decodeSegment(segment) {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function decodeToken(token = readToken()) {
  if (!token) return null;
  const [header, payload] = token.split(".");
  if (!header || !payload) return null;
  try {
    const h = decodeSegment(header);
    const p = decodeSegment(payload);
    return {
      algorithm: h.alg,
      subject: p.sub,
      issuedAt: p.iat ? new Date(p.iat * 1000) : null,
      expiresAt: p.exp ? new Date(p.exp * 1000) : null,
    };
  } catch {
    return null;
  }
}

export function hasValidSession() {
  const token = readToken();
  if (!token) return false;
  const info = decodeToken(token);
  if (!info?.expiresAt) return true;
  return info.expiresAt.getTime() > Date.now();
}
