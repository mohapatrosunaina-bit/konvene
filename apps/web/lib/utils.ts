import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A curated, bespoke palette — deliberately not a generated gradient scale.
 * Each category gets one intentional flat color, assigned by hand.
 */
export const CATEGORY_STYLES: Record<string, { bg: string; fg: string }> = {
  WORKSHOP: { bg: "#1F32E0", fg: "#F6F1E7" }, // cobalt
  HACKATHON: { bg: "#FF4A1F", fg: "#F6F1E7" }, // signal
  CONFERENCE: { bg: "#0E9594", fg: "#F6F1E7" }, // teal
  TALK: { bg: "#F2B705", fg: "#15130F" }, // mustard
  SEMINAR: { bg: "#6C3EA6", fg: "#F6F1E7" }, // plum
  SPORTS: { bg: "#1F6D4C", fg: "#F6F1E7" }, // moss
  CULTURAL: { bg: "#D6336C", fg: "#F6F1E7" }, // berry
  TECHNICAL: { bg: "#1F32E0", fg: "#F6F1E7" }, // cobalt
  MUSIC: { bg: "#6C3EA6", fg: "#F6F1E7" }, // plum
  DANCE: { bg: "#D6336C", fg: "#F6F1E7" }, // berry
  FEST: { bg: "#F2B705", fg: "#15130F" }, // mustard
  BOOTCAMP: { bg: "#0E9594", fg: "#F6F1E7" }, // teal
  PLACEMENT: { bg: "#15130F", fg: "#F6F1E7" }, // ink
  COMPETITION: { bg: "#FF4A1F", fg: "#F6F1E7" }, // signal
};

export function categoryStyle(category: string): { bg: string; fg: string } {
  return CATEGORY_STYLES[category] ?? { bg: "#D6FF3F", fg: "#15130F" };
}
