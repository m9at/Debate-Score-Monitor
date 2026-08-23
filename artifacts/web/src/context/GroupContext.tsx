import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { TournamentGroup } from "@/types/tournament";
import { fetchGroups, pushGroup, deleteGroupApi } from "@/lib/groupsApi";

/** Offline mirror only — the database is the source of truth. */
const STORAGE_KEY = "debate_groups_v1";
const PUSH_DEBOUNCE_MS = 600;
const POLL_MS = 15000;

interface GroupState {
  groups: TournamentGroup[];
}

type GroupAction =
  | { type: "LOAD"; groups: TournamentGroup[] }
  | { type: "ADD"; group: TournamentGroup }
  | { type: "DELETE"; id: string }
  | { type: "UPDATE"; group: TournamentGroup }
  | { type: "ADD_TOURNAMENT"; groupId: string; tournamentId: string }
  | { type: "REMOVE_TOURNAMENT"; groupId: string; tournamentId: string }
  | { type: "MOVE_TOURNAMENT"; groupId: string | null; tournamentId: string };

function reducer(state: GroupState, action: GroupAction): GroupState {
  switch (action.type) {
    case "LOAD":
      return { groups: action.groups };
    case "ADD":
      return { groups: [...state.groups, action.group] };
    case "DELETE":
      return { groups: state.groups.filter((g) => g.id !== action.id) };
    case "UPDATE":
      return {
        groups: state.groups.map((g) =>
          g.id === action.group.id ? action.group : g
        ),
      };
    case "ADD_TOURNAMENT":
      return {
        groups: state.groups.map((g) =>
          g.id !== action.groupId
            ? g
            : g.tournamentIds.includes(action.tournamentId)
            ? g
            : { ...g, tournamentIds: [...g.tournamentIds, action.tournamentId] }
        ),
      };
    case "REMOVE_TOURNAMENT":
      return {
        groups: state.groups.map((g) =>
          g.id !== action.groupId
            ? g
            : {
                ...g,
                tournamentIds: g.tournamentIds.filter(
                  (id) => id !== action.tournamentId
                ),
              }
        ),
      };
    // A tournament belongs to at most one folder: drop it everywhere else.
    case "MOVE_TOURNAMENT":
      return {
        groups: state.groups.map((g) => {
          const without = g.tournamentIds.filter(
            (id) => id !== action.tournamentId
          );
          if (g.id === action.groupId) {
            return { ...g, tournamentIds: [...without, action.tournamentId] };
          }
          return without.length === g.tournamentIds.length
            ? g
            : { ...g, tournamentIds: without };
        }),
      };
    default:
      return state;
  }
}

interface GroupContextValue {
  groups: TournamentGroup[];
  getGroup: (id: string) => TournamentGroup | undefined;
  groupOfTournament: (tournamentId: string) => TournamentGroup | undefined;
  addGroup: (
    name: string,
    description?: string,
    kind?: "normal" | "archive"
  ) => string;
  deleteGroup: (id: string) => void;
  renameGroup: (id: string, name: string, description?: string) => void;
  addTournamentToGroup: (groupId: string, tournamentId: string) => void;
  removeTournamentFromGroup: (groupId: string, tournamentId: string) => void;
  /** Move to one folder, or pass null to take it out of every folder. */
  moveTournamentToGroup: (
    tournamentId: string,
    groupId: string | null
  ) => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export function GroupProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { groups: [] });

  const loadedRef = useRef(false);
  const lastSerializedRef = useRef<Map<string, string>>(new Map());
  const dirtyIdsRef = useRef<Set<string>>(new Set());
  const pendingDeletesRef = useRef<Set<string>>(new Set());
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Initial load: server first, local mirror only if the API is unreachable.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const groups = await fetchGroups();
        if (cancelled) return;
        dispatch({ type: "LOAD", groups });
        for (const g of groups) {
          lastSerializedRef.current.set(g.id, JSON.stringify(g));
        }
      } catch {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw && !cancelled) {
            const parsed = JSON.parse(raw) as TournamentGroup[];
            dispatch({ type: "LOAD", groups: parsed });
            // Local-only folders need pushing once the API is back.
            for (const g of parsed) dirtyIdsRef.current.add(g.id);
          }
        } catch {}
      } finally {
        loadedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.groups));
    } catch {}
  }, [state.groups]);

  // Push changed folders to the database.
  useEffect(() => {
    if (!loadedRef.current) return;
    let queued = false;
    for (const g of state.groups) {
      const next = JSON.stringify(g);
      if (lastSerializedRef.current.get(g.id) !== next) {
        lastSerializedRef.current.set(g.id, next);
        dirtyIdsRef.current.add(g.id);
        queued = true;
      }
    }
    if (!queued) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      const ids = Array.from(dirtyIdsRef.current);
      dirtyIdsRef.current.clear();
      for (const id of ids) {
        const g = stateRef.current.groups.find((x) => x.id === id);
        if (!g) continue;
        try {
          await pushGroup(g);
        } catch {
          dirtyIdsRef.current.add(id);
        }
      }
    }, PUSH_DEBOUNCE_MS);
  }, [state.groups]);

  // Pick up folder changes made on other devices.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled || !loadedRef.current) return;
      if (dirtyIdsRef.current.size > 0) return;
      try {
        const rows = await fetchGroups();
        if (cancelled) return;
        const merged = rows.filter((r) => !pendingDeletesRef.current.has(r.id));
        if (
          JSON.stringify(merged) !== JSON.stringify(stateRef.current.groups)
        ) {
          dispatch({ type: "LOAD", groups: merged });
          for (const g of merged) {
            lastSerializedRef.current.set(g.id, JSON.stringify(g));
          }
        }
      } catch {}
    };
    const timer = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const getGroup = useCallback(
    (id: string) => state.groups.find((g) => g.id === id),
    [state.groups]
  );

  const groupOfTournament = useCallback(
    (tournamentId: string) =>
      state.groups.find((g) => g.tournamentIds.includes(tournamentId)),
    [state.groups]
  );

  const addGroup = useCallback(
    (
      name: string,
      description?: string,
      kind: "normal" | "archive" = "normal"
    ): string => {
      const group: TournamentGroup = {
        id: crypto.randomUUID(),
        name,
        description,
        kind,
        createdAt: Date.now(),
        tournamentIds: [],
      };
      dispatch({ type: "ADD", group });
      return group.id;
    },
    []
  );

  const deleteGroup = useCallback((id: string) => {
    pendingDeletesRef.current.add(id);
    dirtyIdsRef.current.delete(id);
    lastSerializedRef.current.delete(id);
    dispatch({ type: "DELETE", id });
    deleteGroupApi(id).catch(() => {});
  }, []);

  const renameGroup = useCallback(
    (id: string, name: string, description?: string) => {
      const group = state.groups.find((g) => g.id === id);
      if (!group) return;
      dispatch({ type: "UPDATE", group: { ...group, name, description } });
    },
    [state.groups]
  );

  const addTournamentToGroup = useCallback(
    (groupId: string, tournamentId: string) => {
      dispatch({ type: "ADD_TOURNAMENT", groupId, tournamentId });
    },
    []
  );

  const removeTournamentFromGroup = useCallback(
    (groupId: string, tournamentId: string) => {
      dispatch({ type: "REMOVE_TOURNAMENT", groupId, tournamentId });
    },
    []
  );

  const moveTournamentToGroup = useCallback(
    (tournamentId: string, groupId: string | null) => {
      dispatch({ type: "MOVE_TOURNAMENT", groupId, tournamentId });
    },
    []
  );

  return (
    <GroupContext.Provider
      value={{
        groups: state.groups,
        getGroup,
        groupOfTournament,
        addGroup,
        deleteGroup,
        renameGroup,
        addTournamentToGroup,
        removeTournamentFromGroup,
        moveTournamentToGroup,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export function useGroups() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroups must be used within GroupProvider");
  return ctx;
}
