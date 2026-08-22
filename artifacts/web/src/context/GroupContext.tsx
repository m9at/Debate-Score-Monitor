import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { TournamentGroup } from "@/types/tournament";

const STORAGE_KEY = "debate_groups_v1";

interface GroupState {
  groups: TournamentGroup[];
}

type GroupAction =
  | { type: "LOAD"; groups: TournamentGroup[] }
  | { type: "ADD"; group: TournamentGroup }
  | { type: "DELETE"; id: string }
  | { type: "UPDATE"; group: TournamentGroup }
  | { type: "ADD_TOURNAMENT"; groupId: string; tournamentId: string }
  | { type: "REMOVE_TOURNAMENT"; groupId: string; tournamentId: string };

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
    default:
      return state;
  }
}

interface GroupContextValue {
  groups: TournamentGroup[];
  getGroup: (id: string) => TournamentGroup | undefined;
  groupOfTournament: (tournamentId: string) => TournamentGroup | undefined;
  addGroup: (name: string, description?: string) => string;
  deleteGroup: (id: string) => void;
  renameGroup: (id: string, name: string, description?: string) => void;
  addTournamentToGroup: (groupId: string, tournamentId: string) => void;
  removeTournamentFromGroup: (groupId: string, tournamentId: string) => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export function GroupProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { groups: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TournamentGroup[];
        dispatch({ type: "LOAD", groups: parsed });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.groups));
    } catch {}
  }, [state.groups]);

  const getGroup = useCallback(
    (id: string) => state.groups.find((g) => g.id === id),
    [state.groups]
  );

  const groupOfTournament = useCallback(
    (tournamentId: string) =>
      state.groups.find((g) => g.tournamentIds.includes(tournamentId)),
    [state.groups]
  );

  const addGroup = useCallback((name: string, description?: string): string => {
    const group: TournamentGroup = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: Date.now(),
      tournamentIds: [],
    };
    dispatch({ type: "ADD", group });
    return group.id;
  }, []);

  const deleteGroup = useCallback((id: string) => {
    dispatch({ type: "DELETE", id });
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
