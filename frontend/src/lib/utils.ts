import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function magnitudeToSize(mag: number | undefined): number {
  if (mag === undefined) return 1;
  // Brighter stars (lower mag) get larger sizes
  return Math.max(0.5, Math.min(4, 3.5 - mag * 0.5));
}

export function magnitudeToOpacity(mag: number | undefined): number {
  if (mag === undefined) return 0.5;
  return Math.max(0.2, Math.min(1, 1 - (mag / 7)));
}

export function starColorFromBV(bv: number | undefined): string {
  if (bv === undefined) return "#ffffff";
  if (bv < -0.3) return "#9bb0ff"; // Blue
  if (bv < 0) return "#aabfff";   // Blue-white
  if (bv < 0.3) return "#cad7ff"; // White
  if (bv < 0.6) return "#f8f7ff"; // Yellow-white
  if (bv < 1.0) return "#fff4e8"; // Yellow
  if (bv < 1.5) return "#ffd2a1"; // Orange
  return "#ffad51";               // Red
}

export function isExpired(expiryDate: string | null | undefined): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

export function daysUntilExpiry(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
