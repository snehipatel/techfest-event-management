export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "FACULTY_COORDINATOR"
  | "CLUB_COORDINATOR"
  | "TEAM_LEAD"
  | "VOLUNTEER"
  | "CAMPUS_AMBASSADOR";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export const ROLE_ACCESS: Record<string, UserRole[]> = {
  "/dashboard": ["SUPER_ADMIN", "ADMIN", "FACULTY_COORDINATOR", "CLUB_COORDINATOR", "TEAM_LEAD", "VOLUNTEER", "CAMPUS_AMBASSADOR"],
  "/users": ["SUPER_ADMIN", "ADMIN"],
  "/events": ["SUPER_ADMIN", "ADMIN", "FACULTY_COORDINATOR", "CLUB_COORDINATOR"],
  "/registrations": ["SUPER_ADMIN", "ADMIN", "FACULTY_COORDINATOR", "CLUB_COORDINATOR"],
  "/tasks": ["SUPER_ADMIN", "ADMIN", "FACULTY_COORDINATOR", "CLUB_COORDINATOR", "TEAM_LEAD", "VOLUNTEER"],
  "/referrals": ["SUPER_ADMIN", "CAMPUS_AMBASSADOR"],
  "/payments": ["SUPER_ADMIN", "ADMIN"],
  "/notifications": ["SUPER_ADMIN", "ADMIN", "FACULTY_COORDINATOR", "CLUB_COORDINATOR", "TEAM_LEAD", "VOLUNTEER", "CAMPUS_AMBASSADOR"],
  "/activity-logs": ["SUPER_ADMIN", "ADMIN"],
  "/invites": ["SUPER_ADMIN"],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  FACULTY_COORDINATOR: "Faculty Coordinator",
  CLUB_COORDINATOR: "Club Coordinator",
  TEAM_LEAD: "Team Lead",
  VOLUNTEER: "Volunteer",
  CAMPUS_AMBASSADOR: "Campus Ambassador",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-primary/10 text-primary border-primary/20",
  ADMIN: "bg-info/10 text-info border-info/20",
  FACULTY_COORDINATOR: "bg-success/10 text-success border-success/20",
  CLUB_COORDINATOR: "bg-warning/10 text-warning border-warning/20",
  TEAM_LEAD: "bg-accent text-accent-foreground border-accent-foreground/20",
  VOLUNTEER: "bg-muted text-muted-foreground border-border",
  CAMPUS_AMBASSADOR: "bg-destructive/10 text-destructive border-destructive/20",
};

export function hasAccess(role: UserRole, path: string): boolean {
  const allowed = ROLE_ACCESS[path];
  if (!allowed) return true;
  return allowed.includes(role);
}
