import type { Tables } from "@/src/types/database.types";

export type AdminRole = "admin" | "editor";
export type AdminProfile = Tables<"admin_profiles">;

export function hasRequiredRole(
  role: AdminRole,
  minimumRole: AdminRole,
): boolean {
  if (minimumRole === "editor") {
    return role === "editor" || role === "admin";
  }

  return role === "admin";
}
