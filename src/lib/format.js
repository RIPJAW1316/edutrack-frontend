// Presentation helpers shared across the app.
import { API_DOWN_HINT } from "../api";

export function initials(name, fallback = "U") {
  const source = (name || "").trim();
  if (!source) return (fallback || "U").slice(0, 2).toUpperCase();
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function firstName(name) {
  return (name || "").trim().split(/\s+/)[0] || "";
}

export function studentCode(id) {
  return `STU-${String(id ?? 0).padStart(4, "0")}`;
}

function hash(value) {
  const str = String(value ?? "");
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Decorative identity gradient for avatars (not a data encoding).
export function avatarStyle(seed) {
  const hue = hash(seed) % 360;
  return {
    "--avatar-bg": `linear-gradient(140deg, hsl(${hue} 62% 58%), hsl(${(hue + 34) % 360} 58% 42%))`,
  };
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

export function percent(part, whole, digits = 0) {
  if (!whole) return "0%";
  return `${((part / whole) * 100).toFixed(digits)}%`;
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function longDate(date = new Date()) {
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export function timeOfDay(date) {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatCountdown(ms) {
  if (ms <= 0) return "expired";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function compareText(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""), undefined, { sensitivity: "base", numeric: true });
}

function csvCell(value) {
  const str = value == null ? "" : String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function downloadCsv(filename, header, rows) {
  const body = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function generatePassword(length = 14) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?";
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (v) => alphabet[v % alphabet.length]).join("");
}

// 0–4 heuristic strength score for the password meter.
export function passwordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

// Normalises any thrown error (axios, validation map, network) into copy for the UI.
export function errorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (err?.fields) return Object.values(err.fields)[0] || fallback;
  if (err?.response) {
    const data = err.response.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data?.message) return data.message;
    if (data && typeof data === "object") {
      const first = Object.values(data).find((v) => typeof v === "string");
      if (first && err.response.status < 500) return first;
    }
    return fallback;
  }
  if (err?.request) return API_DOWN_HINT;
  return err?.message || fallback;
}
