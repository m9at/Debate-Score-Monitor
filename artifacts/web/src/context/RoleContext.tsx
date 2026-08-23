import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Who is looking at the screen. Drives what the UI exposes. */
export type Role = "director" | "roomSupervisor" | "judge" | "viewer";

/** Things a role may or may not do. */
export type Permission =
  | "viewScores"
  | "editResults"
  | "manageTeams"
  | "manageJudges"
  | "announceResults"
  | "lockRound"
  | "viewAudit";

export const ROLE_META: Record<Role, { label: string; hint: string }> = {
  director: {
    label: "مدير البطولة",
    hint: "صلاحيات كاملة على البطولة",
  },
  roomSupervisor: {
    label: "مشرف قاعة",
    hint: "متابعة القاعات وإدخال النتائج",
  },
  judge: {
    label: "محكم",
    hint: "إدخال نتيجة قاعته فقط",
  },
  viewer: {
    label: "مشاهد",
    hint: "عرض عام بدون درجات",
  },
};

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  director: [
    "viewScores",
    "editResults",
    "manageTeams",
    "manageJudges",
    "announceResults",
    "lockRound",
    "viewAudit",
  ],
  roomSupervisor: ["viewScores", "editResults", "announceResults"],
  judge: ["editResults"],
  viewer: [],
};

const STORAGE_KEY = "od-active-role";

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
  can: (permission: Permission) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && stored in ROLE_META ? (stored as Role) : "director";
  });

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const can = useCallback(
    (permission: Permission) => ROLE_PERMISSIONS[role].includes(permission),
    [role]
  );

  const value = useMemo(() => ({ role, setRole, can }), [role, setRole, can]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}
