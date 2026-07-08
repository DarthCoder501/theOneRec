import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function malUrl(malId: number): string {
  return `https://myanimelist.net/anime/${malId}`;
}
