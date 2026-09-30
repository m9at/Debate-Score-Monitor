import { Redirect, useRoute } from "wouter";
import { useTournament } from "@/context/TournamentContext";
import TournamentDetail from "@/pages/tournament-detail";

/** /tournament/:id — leadership debates open their own management page. */
export default function TournamentRoute() {
  const [, params] = useRoute("/tournament/:id");
  const t = useTournament().getTournament(params?.id || "");
  if (t?.kind === "leadership" && t.leaderId) return <Redirect to={`/leader/${t.leaderId}`} replace />;
  return <TournamentDetail />;
}
