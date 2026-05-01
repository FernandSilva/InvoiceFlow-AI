import type { Profile } from "../types";

export const isAdmin = (profile?: Profile | null) => profile?.role === "admin";

export const canAccessDocument = (profile: Profile | null | undefined, userId: string) =>
  Boolean(profile && (profile.role === "admin" || profile.userId === userId));

export const canManageUsers = (profile?: Profile | null) => isAdmin(profile);
