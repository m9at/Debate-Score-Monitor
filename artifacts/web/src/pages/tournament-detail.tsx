import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useTournament } from "@/context/TournamentContext";
import {
  subscribeMatchResults,
  subscribeRoundResults,
  deleteMatchSession,
  deleteRoundResult,
  createRoundSession,
  syncRoundSessionsForRound,
} from "@/lib/firebaseJudgeApi";
import {
  buildSessionUrl,
  buildJudgeSessionUrl,
  decodeScores,
  type RoomInfo,
  type RoundData,
} from "@/lib/judgeCodec";
import {
  buildRegisterUrl,
  buildAdminUrl,
  decodeRegistration,
  registrationToTeam,
} from "@/lib/registrationCodec";
import {
  buildJudgeRegisterUrl,
  decodeJudgeRegistration,
} from "@/lib/judgeRegistrationCodec";
import {
  publishTournament,
  listRegistrations,
  deleteRegistration,
  toPendingTeam,
  toPendingJudge,
} from "@/lib/registrationsApi";
import { isOwnerCode } from "@/lib/ownerCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BRAND, BTN, BTN_PRIMARY_STYLE, BTN_SIZE, LAYOUT } from "@/lib/brand";
import TournamentSidebar from "@/components/tournament/TournamentSidebar";
import RoundBar from "@/components/tournament/RoundBar";
import CaseCard from "@/components/tournament/CaseCard";
import RoomCard from "@/components/tournament/RoomCard";
import { getRoomStatus } from "@/lib/roomStatus";
import RegistrationLinksCard from "@/components/tournament/RegistrationLinksCard";
import OverviewDashboard from "@/components/tournament/OverviewDashboard";
import ResultsAdmin from "@/components/tournament/ResultsAdmin";
import RoundControlCenter from "@/components/tournament/RoundControlCenter";
import AuditLog from "@/components/tournament/AuditLog";
import RegistrationLinksCenter from "@/components/tournament/RegistrationLinksCenter";
import RoundsManager from "@/components/tournament/RoundsManager";
import RoundCommandCenter from "@/components/tournament/RoundCommandCenter";
import RoundJudgeBoard from "@/components/tournament/RoundJudgeBoard";
import ImageUploadField from "@/components/common/ImageUploadField";
import ReportsPanel from "@/components/tournament/ReportsPanel";
import SettingsPanel from "@/components/tournament/SettingsPanel";
import ShareLinkDialog from "@/components/tournament/ShareLinkDialog";
import AutoSaveIndicator from "@/components/tournament/AutoSaveIndicator";
import TournamentSkeleton from "@/components/tournament/TournamentSkeleton";
import RoleSwitcher from "@/components/tournament/RoleSwitcher";
import JudgeRequestsPanel from "@/components/judges/JudgeRequestsPanel";
import TeamRequestsPanel from "@/components/teams/TeamRequestsPanel";
import { useRole } from "@/context/RoleContext";
import type { SidebarGroup } from "@/components/tournament/TournamentSidebar";
import ProtectionSettingsDialog from "@/components/tournament/ProtectionSettingsDialog";
import UnlockGate from "@/components/tournament/UnlockGate";
import {
  Home,
  Plus,
  Trash2,
  Play,
  Users,
  Layers,
  BarChart2,
  Mic,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  FileText,
  Settings,
  FileSpreadsheet,
  SkipForward,
  Award,
  CheckCircle,
  Clock,
  Star,
  Inbox,
  UserCheck,
  Crown,
  Check as CheckIcon,
  Loader2,
  X,
  Pencil,
  Flag,
  Megaphone,
  ShieldCheck,
  Trophy,
  UserPlus,
  Activity,
  Building2,
  FileBox,
  Download,
  Projector,
  Eye,
  ListChecks,
  ClipboardList,
  History,
  EyeOff,
  MoreHorizontal,
  GitCompare,
  Check,
  LayoutDashboard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type * as XLSXType from "@/lib/excel-export";
import type {
  Tournament,
  Team,
  Match,
  Speaker,
  MatchTeam,
  Judge,
  PendingTeamRegistration,
  PendingJudgeRegistration,
  PendingMatchResult,
} from "@/types/tournament";

const CYAN = "#29ABE2";
const PURPLE = "#7B2D8E";
const SUCCESS = "#34C759";

type TabType =
  | "overview"
  | "teams"
  | "rounds"
  | "standings"
  | "speakers"
  | "judges"
  | "pending"
  | "control"
  | "resultsAdmin"
  | "links"
  | "reports"
  | "settings"
  | "audit";

const GOLD = "#FFC107";

function escHtml(s: string | number | undefined | null): string {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPdfHtml(tournament: Tournament): string {
  const sortedTeams = [...tournament.teams].sort((a, b) =>
    b.wins !== a.wins ? b.wins - a.wins : b.totalPoints - a.totalPoints
  );
  const dateStr = new Date(tournament.createdAt).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const exportDateStr = new Date().toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const teamById = (id: string) => tournament.teams.find((t) => t.id === id);
  const totalMatches = tournament.rounds.reduce(
    (s, r) => s + r.matches.length,
    0
  );
  const completedMatches = tournament.rounds.reduce(
    (s, r) => s + r.matches.filter((m) => m.completed).length,
    0
  );
  const completedRounds = tournament.rounds.filter((r) => r.completed).length;
  const statusLabel = tournament.finished
    ? "منتهية"
    : tournament.started
    ? "جارية"
    : "لم تبدأ";
  const judges = tournament.judges ?? [];

  // ───── Standings table ─────
  const standingsTable = sortedTeams
    .map((t, i) => {
      const winPct =
        t.matchesPlayed > 0
          ? Math.round((t.wins / t.matchesPlayed) * 100)
          : 0;
      const avg =
        t.matchesPlayed > 0
          ? Math.round((t.totalPoints / t.matchesPlayed) * 10) / 10
          : 0;
      const medal =
        i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
      return `
    <tr style="${i % 2 === 0 ? "background:#F8F8FF" : ""}">
      <td style="padding:10px 14px;text-align:center;font-weight:700;color:${
        i === 0 ? "#7B2D8E" : i === 1 ? "#29ABE2" : "#666"
      }">${medal}</td>
      <td style="padding:10px 14px;text-align:right;font-weight:600">${escHtml(t.name)}</td>
      <td style="padding:10px 14px;text-align:center;color:#34C759;font-weight:700">${t.wins}</td>
      <td style="padding:10px 14px;text-align:center;color:#FF3B30;font-weight:700">${t.losses}</td>
      <td style="padding:10px 14px;text-align:center;font-weight:600">${t.matchesPlayed}</td>
      <td style="padding:10px 14px;text-align:center;font-weight:600">${winPct}%</td>
      <td style="padding:10px 14px;text-align:center;color:#29ABE2;font-weight:700">${t.totalPoints}</td>
      <td style="padding:10px 14px;text-align:center;font-weight:600">${avg}</td>
    </tr>`;
    })
    .join("");

  // ───── Teams roster ─────
  const teamsRoster = tournament.teams
    .map((t) => {
      const speakerChips = t.speakerNames
        .map(
          (sp, i) =>
            `<span style="display:inline-block;padding:4px 10px;margin:2px;border-radius:999px;background:#7B2D8E14;color:#7B2D8E;font-size:11px;font-weight:600">
              ${i + 1}. ${escHtml(sp || `متحدث ${i + 1}`)}
            </span>`
        )
        .join("");
      return `
      <div style="margin-bottom:10px;padding:12px 14px;border:1px solid #E5E5EA;border-radius:10px;border-right:4px solid #29ABE2">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-weight:700;font-size:14px;color:#1A1A2E">${escHtml(t.name)}</div>
          <div style="font-size:11px;color:#888">${t.speakersPerTeam} متحدثين</div>
        </div>
        <div>${speakerChips}</div>
      </div>`;
    })
    .join("");

  // ───── Speaker aggregate stats ─────
  type SpAgg = {
    team: string;
    speaker: string;
    speeches: number;
    speechPoints: number;
    replies: number;
    replyPoints: number;
    bestSpeakerCount: number;
  };
  const aggMap = new Map<string, SpAgg>();
  tournament.teams.forEach((t) => {
    t.speakerNames.forEach((sp) => {
      const key = `${t.id}::${sp}`;
      aggMap.set(key, {
        team: t.name,
        speaker: sp,
        speeches: 0,
        speechPoints: 0,
        replies: 0,
        replyPoints: 0,
        bestSpeakerCount: 0,
      });
    });
  });
  tournament.rounds.forEach((r) => {
    r.matches.forEach((m) => {
      if (!m.completed) return;
      [m.team1, m.team2].forEach((mt) => {
        mt.speakers.forEach((sp) => {
          const key = `${mt.teamId}::${sp.name}`;
          const agg = aggMap.get(key);
          if (!agg) return;
          agg.speeches += 1;
          agg.speechPoints += sp.score;
          if (sp.speakerNumber === mt.replySpeakerNumber) {
            agg.replies += 1;
            agg.replyPoints += mt.replyScore;
          }
        });
      });
      if (m.bestSpeaker) {
        const key = `${m.bestSpeaker.teamId}::${m.bestSpeaker.name}`;
        const agg = aggMap.get(key);
        if (agg) agg.bestSpeakerCount += 1;
      }
    });
  });
  const aggArr = Array.from(aggMap.values())
    .filter((a) => a.speeches > 0)
    .sort((a, b) => {
      const tA = a.speechPoints + a.replyPoints;
      const tB = b.speechPoints + b.replyPoints;
      return tB - tA;
    });
  const speakersTable = aggArr.length
    ? aggArr
        .slice(0, 30)
        .map((a, i) => {
          const total = a.speechPoints + a.replyPoints;
          const avg =
            a.speeches > 0
              ? Math.round((a.speechPoints / a.speeches) * 10) / 10
              : 0;
          const medal =
            i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
          return `<tr style="${i % 2 === 0 ? "background:#F8F8FF" : ""}">
        <td style="padding:8px 12px;text-align:center;font-weight:700;color:${
          i === 0 ? "#7B2D8E" : i === 1 ? "#29ABE2" : "#666"
        }">${medal}</td>
        <td style="padding:8px 12px;text-align:right;font-weight:600">${escHtml(a.speaker)}</td>
        <td style="padding:8px 12px;text-align:right;color:#666;font-size:11px">${escHtml(a.team)}</td>
        <td style="padding:8px 12px;text-align:center">${a.speeches}</td>
        <td style="padding:8px 12px;text-align:center;color:#29ABE2;font-weight:700">${a.speechPoints}</td>
        <td style="padding:8px 12px;text-align:center">${avg}</td>
        <td style="padding:8px 12px;text-align:center;color:#7B2D8E;font-weight:600">${a.replyPoints}</td>
        <td style="padding:8px 12px;text-align:center;color:#FFC107;font-weight:700">${a.bestSpeakerCount}</td>
        <td style="padding:8px 12px;text-align:center;font-weight:700">${total}</td>
      </tr>`;
        })
        .join("")
    : `<tr><td colspan="9" style="padding:14px;text-align:center;color:#999">لا توجد بيانات بعد</td></tr>`;

  // ───── Round sections (with judges, best speaker, judge notes) ─────
  const roundLabel = (r: { kind?: string; roundNumber: number }) =>
    r.kind === "semifinal"
      ? "نصف النهائي"
      : r.kind === "final"
      ? "النهائي"
      : `الجولة ${r.roundNumber}`;
  const roundsSections = tournament.rounds
    .map((round) => {
      const matchCards = round.matches
        .map((m) => {
          const govTeam = teamById(m.team1.teamId);
          const oppTeam = teamById(m.team2.teamId);
          const winnerName = m.winnerId
            ? teamById(m.winnerId)?.name ?? "-"
            : m.completed
            ? "تعادل"
            : "—";
          const isGovWin = m.completed && m.winnerId === m.team1.teamId;
          const isOppWin = m.completed && m.winnerId === m.team2.teamId;
          const govReplyName =
            govTeam?.speakerNames[
              (m.team1.replySpeakerNumber || 1) - 1
            ] || "—";
          const oppReplyName =
            oppTeam?.speakerNames[
              (m.team2.replySpeakerNumber || 1) - 1
            ] || "—";
          const govBreakdown = m.team1.speakers
            .map(
              (sp) =>
                `<span style="display:inline-block;margin:1px 3px;font-size:11px;color:#666">${escHtml(
                  sp.name
                )}: <b style="color:#29ABE2">${sp.score}</b></span>`
            )
            .join("");
          const oppBreakdown = m.team2.speakers
            .map(
              (sp) =>
                `<span style="display:inline-block;margin:1px 3px;font-size:11px;color:#666">${escHtml(
                  sp.name
                )}: <b style="color:#7B2D8E">${sp.score}</b></span>`
            )
            .join("");
          const judgeBadges = (m.judgeNames || [])
            .map(
              (n) =>
                `<span style="display:inline-block;padding:3px 8px;margin:2px;border-radius:6px;background:#29ABE214;color:#29ABE2;font-size:11px;font-weight:600">${escHtml(
                  n
                )}</span>`
            )
            .join("");
          const chairBadge = m.chairName
            ? `<span style="display:inline-block;padding:3px 8px;margin:2px;border-radius:6px;background:#FFC10726;color:#B8860B;font-size:11px;font-weight:700">👑 ${escHtml(
                m.chairName
              )}</span>`
            : "";
          const room = m.roomLabel?.trim() || `القاعة ${m.roomNumber}`;
          return `
          <div style="margin-bottom:14px;border:1px solid #E5E5EA;border-radius:10px;overflow:hidden">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#F8F8FF;border-bottom:1px solid #E5E5EA">
              <div style="font-weight:700;font-size:13px;color:#1A1A2E">${escHtml(room)}</div>
              <div style="font-weight:700;font-size:12px;color:${
                m.completed ? "#34C759" : "#FF9500"
              }">${m.completed ? `🏆 ${escHtml(winnerName)}` : "⏳ غير مكتملة"}</div>
            </div>
            <div style="padding:10px 12px">
              <table style="width:100%;border-collapse:collapse">
                <tr>
                  <td style="padding:6px 8px;border-right:3px solid #29ABE2;width:42%">
                    <div style="font-size:10px;color:#29ABE2;font-weight:700;margin-bottom:2px">موالاة${
                      isGovWin ? " · فائز" : ""
                    }</div>
                    <div style="font-size:13px;font-weight:${isGovWin ? 700 : 600}">${escHtml(govTeam?.name ?? "-")}</div>
                    ${govBreakdown ? `<div style="margin-top:4px">${govBreakdown}</div>` : ""}
                    ${
                      m.completed
                        ? `<div style="margin-top:3px;font-size:11px;color:#888">رد: ${escHtml(govReplyName)} (<b style="color:#29ABE2">${m.team1.replyScore}</b>)</div>`
                        : ""
                    }
                  </td>
                  <td style="padding:6px 8px;text-align:center;width:16%">
                    ${
                      m.completed
                        ? `<div style="font-size:18px;font-weight:900;color:#29ABE2">${m.team1.totalScore}</div>
                           <div style="font-size:10px;color:#aaa;margin:2px 0">VS</div>
                           <div style="font-size:18px;font-weight:900;color:#7B2D8E">${m.team2.totalScore}</div>`
                        : `<div style="font-size:11px;color:#aaa">VS</div>`
                    }
                  </td>
                  <td style="padding:6px 8px;border-right:3px solid #7B2D8E;width:42%">
                    <div style="font-size:10px;color:#7B2D8E;font-weight:700;margin-bottom:2px">معارضة${
                      isOppWin ? " · فائز" : ""
                    }</div>
                    <div style="font-size:13px;font-weight:${isOppWin ? 700 : 600}">${escHtml(oppTeam?.name ?? "-")}</div>
                    ${oppBreakdown ? `<div style="margin-top:4px">${oppBreakdown}</div>` : ""}
                    ${
                      m.completed
                        ? `<div style="margin-top:3px;font-size:11px;color:#888">رد: ${escHtml(oppReplyName)} (<b style="color:#7B2D8E">${m.team2.replyScore}</b>)</div>`
                        : ""
                    }
                  </td>
                </tr>
              </table>
              ${
                m.completed && m.bestSpeaker
                  ? `<div style="margin-top:8px;padding:6px 10px;background:#FFC10714;border-radius:6px;font-size:11px">
                       <span style="color:#B8860B;font-weight:700">⭐ أفضل متحدث:</span>
                       <span style="font-weight:700">${escHtml(m.bestSpeaker.name)}</span>
                       <span style="color:#B8860B;font-weight:700">(${m.bestSpeaker.score})</span>
                     </div>`
                  : ""
              }
              ${
                chairBadge || judgeBadges
                  ? `<div style="margin-top:8px;padding-top:6px;border-top:1px dashed #E5E5EA">
                       <span style="font-size:10px;color:#888;margin-left:6px">المحكمون:</span>
                       ${chairBadge}${judgeBadges}
                     </div>`
                  : ""
              }
              ${
                m.judgeNotes
                  ? `<div style="margin-top:6px;padding:6px 10px;background:#F5F5F5;border-right:3px solid #aaa;border-radius:4px;font-size:11px;color:#555">
                       <b style="color:#666">ملاحظات المحكم:</b> ${escHtml(m.judgeNotes)}
                     </div>`
                  : ""
              }
            </div>
          </div>`;
        })
        .join("");
      const roundDone = round.matches.filter((m) => m.completed).length;
      return `<div style="margin-bottom:24px;page-break-inside:avoid">
      <h3 style="font-size:17px;font-weight:700;color:#7B2D8E;margin:0 0 12px 0;border-right:4px solid #7B2D8E;padding-right:12px">
        ${escHtml(roundLabel(round))}
        <span style="font-size:12px;color:#888;font-weight:500">· ${roundDone}/${round.matches.length} مكتملة</span>
      </h3>
      ${matchCards}
    </div>`;
    })
    .join("");

  // ───── Judges section ─────
  const judgesSection = judges.length
    ? `<table style="width:100%;border-collapse:collapse">
        <thead><tr>
          <th style="text-align:center">الدور</th>
          <th>الاسم</th>
          <th>الجهة</th>
          <th>الخبرة</th>
          <th style="text-align:center">يمكن أن يترأس</th>
        </tr></thead>
        <tbody>
        ${judges
          .map(
            (j, i) => `<tr style="${i % 2 === 0 ? "background:#F8F8FF" : ""}">
          <td style="padding:8px 12px;text-align:center;font-size:18px">${
            j.canChair ? "👑" : "⚖️"
          }</td>
          <td style="padding:8px 12px;text-align:right;font-weight:600">${escHtml(j.name)}</td>
          <td style="padding:8px 12px;text-align:right;color:#666">${escHtml(j.institution || "—")}</td>
          <td style="padding:8px 12px;text-align:right;color:#666">${escHtml(j.experience || "—")}</td>
          <td style="padding:8px 12px;text-align:center;color:${
            j.canChair ? "#34C759" : "#aaa"
          };font-weight:700">${j.canChair ? "نعم" : "—"}</td>
        </tr>`
          )
          .join("")}
        </tbody>
      </table>`
    : `<p style="text-align:center;color:#999">لم يُسجَّل محكمون بعد</p>`;

  // ───── Head-to-head ─────
  const h2hMap = new Map<
    string,
    { a: string; b: string; matches: number; aWins: number; bWins: number }
  >();
  tournament.rounds.forEach((r) => {
    r.matches.forEach((m) => {
      if (!m.completed) return;
      const ids = [m.team1.teamId, m.team2.teamId].sort();
      const key = ids.join("::");
      const a = teamById(ids[0])?.name ?? "";
      const b = teamById(ids[1])?.name ?? "";
      const rec = h2hMap.get(key) || {
        a,
        b,
        matches: 0,
        aWins: 0,
        bWins: 0,
      };
      rec.matches += 1;
      if (m.winnerId === ids[0]) rec.aWins += 1;
      else if (m.winnerId === ids[1]) rec.bWins += 1;
      h2hMap.set(key, rec);
    });
  });
  const h2hSection = h2hMap.size
    ? `<table style="width:100%;border-collapse:collapse">
        <thead><tr>
          <th>الفريق أ</th>
          <th>الفريق ب</th>
          <th style="text-align:center">المواجهات</th>
          <th style="text-align:center">فوز أ</th>
          <th style="text-align:center">فوز ب</th>
          <th style="text-align:center">تعادل</th>
        </tr></thead>
        <tbody>
        ${Array.from(h2hMap.values())
          .map(
            (r, i) => `<tr style="${i % 2 === 0 ? "background:#F8F8FF" : ""}">
          <td style="padding:8px 12px;text-align:right;font-weight:600">${escHtml(r.a)}</td>
          <td style="padding:8px 12px;text-align:right;font-weight:600">${escHtml(r.b)}</td>
          <td style="padding:8px 12px;text-align:center">${r.matches}</td>
          <td style="padding:8px 12px;text-align:center;color:#34C759;font-weight:700">${r.aWins}</td>
          <td style="padding:8px 12px;text-align:center;color:#34C759;font-weight:700">${r.bWins}</td>
          <td style="padding:8px 12px;text-align:center;color:#888">${
            r.matches - r.aWins - r.bWins
          }</td>
        </tr>`
          )
          .join("")}
        </tbody>
      </table>`
    : `<p style="text-align:center;color:#999">لم تُسجَّل مواجهات بعد</p>`;

  return `<!DOCTYPE html><html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><title>${escHtml(tournament.name)}</title><style>
  *{box-sizing:border-box}
  body{font-family:'Cairo',-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,sans-serif;margin:0;padding:0;color:#1A1A2E;direction:rtl;background:#fff}
  .cover{background:linear-gradient(135deg,#29ABE2 0%,#7B2D8E 100%);padding:40px 32px;color:#fff;text-align:center}
  .logo-text{font-size:26px;font-weight:700;letter-spacing:1px;margin-bottom:4px}
  .logo-sub{font-size:14px;opacity:.8;margin-bottom:24px}
  .t-name{font-size:32px;font-weight:900;margin-bottom:8px}
  .t-meta{font-size:14px;opacity:.85;margin-bottom:18px}
  .stats-row{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin-top:16px}
  .stat{background:rgba(255,255,255,.18);padding:10px 16px;border-radius:10px;min-width:90px}
  .stat-num{font-size:22px;font-weight:900}
  .stat-lbl{font-size:11px;opacity:.85}
  .section{padding:24px 32px;page-break-inside:avoid}
  h2{font-size:20px;font-weight:700;color:#1A1A2E;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #E5E5EA}
  table{width:100%;border-collapse:collapse}
  th{font-size:12px;padding:10px 14px;text-align:right;background:linear-gradient(135deg,#29ABE2,#7B2D8E);color:#fff}
  td{padding:10px 14px;border-bottom:1px solid #F0F0F0;font-size:13px}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .footer{text-align:center;padding:20px;color:#aaa;font-size:11px;border-top:1px solid #F0F0F0}
  @media print {.section{page-break-inside:auto} h2{page-break-after:avoid}}
</style></head>
<body>
<div class="cover">
  <div class="logo-text">مناظرات عُمان</div>
  <div class="logo-sub">Oman Debates</div>
  <div class="t-name">${escHtml(tournament.name)}</div>
  <div class="t-meta">${dateStr} · الحالة: ${statusLabel}</div>
  <div class="stats-row">
    <div class="stat"><div class="stat-num">${tournament.teams.length}</div><div class="stat-lbl">فرق</div></div>
    <div class="stat"><div class="stat-num">${tournament.totalRounds}</div><div class="stat-lbl">جولات</div></div>
    <div class="stat"><div class="stat-num">${completedRounds}</div><div class="stat-lbl">مكتملة</div></div>
    <div class="stat"><div class="stat-num">${completedMatches}/${totalMatches}</div><div class="stat-lbl">مباريات</div></div>
    <div class="stat"><div class="stat-num">${judges.length}</div><div class="stat-lbl">محكمون</div></div>
  </div>
</div>

<div class="section">
  <h2>🏆 الترتيب</h2>
  <table>
    <thead><tr>
      <th style="text-align:center">المركز</th>
      <th>الفريق</th>
      <th style="text-align:center">فوز</th>
      <th style="text-align:center">خسارة</th>
      <th style="text-align:center">مباريات</th>
      <th style="text-align:center">نسبة الفوز</th>
      <th style="text-align:center">النقاط</th>
      <th style="text-align:center">المتوسط</th>
    </tr></thead>
    <tbody>${standingsTable}</tbody>
  </table>
</div>

<div class="section">
  <h2>👥 الفرق والمتحدثون</h2>
  <div class="grid-2">${teamsRoster}</div>
</div>

<div class="section">
  <h2>🎤 ترتيب المتحدثين</h2>
  <table>
    <thead><tr>
      <th style="text-align:center">المركز</th>
      <th>المتحدث</th>
      <th>الفريق</th>
      <th style="text-align:center">خطب</th>
      <th style="text-align:center">نقاط الخطب</th>
      <th style="text-align:center">المتوسط</th>
      <th style="text-align:center">نقاط الرد</th>
      <th style="text-align:center">أفضل متحدث</th>
      <th style="text-align:center">الإجمالي</th>
    </tr></thead>
    <tbody>${speakersTable}</tbody>
  </table>
</div>

<div class="section">
  <h2>📋 تفاصيل الجولات</h2>
  ${roundsSections || `<p style="text-align:center;color:#999">لا توجد جولات بعد</p>`}
</div>

<div class="section">
  <h2>⚖️ المحكمون</h2>
  ${judgesSection}
</div>

<div class="section">
  <h2>🔁 المواجهات المباشرة</h2>
  ${h2hSection}
</div>

<div class="footer">
  أُنتج في ${exportDateStr} بواسطة تطبيق مناظرات عُمان · Oman Debates App
</div>
</body></html>`;
}

const HIDDEN_SCORE = "••";

interface MatchCardProps {
  match: Match;
  teamMap: Map<string, { name: string }>;
  onClick: () => void;
  onEditRoom?: () => void;
  hideScores?: boolean;
}

function MatchCard({ match, teamMap, onClick, onEditRoom, hideScores }: MatchCardProps) {
  const govName = teamMap.get(match.team1.teamId)?.name ?? "-";
  const oppName = teamMap.get(match.team2.teamId)?.name ?? "-";
  /**
   * Hiding results hides the RESULT, not just the numbers: until the room's
   * result has been announced nothing here may reveal the winner or the best
   * speaker — no highlight, no trophy icon, no score.
   */
  const resultHidden = !!hideScores && !match.resultAnnounced;
  const isGovWinner = !resultHidden && match.winnerId === match.team1.teamId;
  const isOppWinner = !resultHidden && match.winnerId === match.team2.teamId;
  const roomText = match.roomLabel?.trim()
    ? match.roomLabel
    : `القاعة ${match.roomNumber}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="w-full bg-card rounded-2xl p-3.5 mb-3 shadow-sm hover:shadow-md transition-shadow text-right cursor-pointer"
      data-testid={`card-match-${match.id}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: CYAN }}
          >
            <Home className="w-3 h-3 text-white" />
            <span className="text-xs font-bold text-white">{roomText}</span>
          </div>
          {onEditRoom && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditRoom();
              }}
              aria-label="تعديل اسم/رقم القاعة"
              title="تعديل اسم/رقم القاعة"
              className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
              data-testid={`button-edit-room-${match.id}`}
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>
        {match.completed ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: (resultHidden ? GOLD : SUCCESS) + "26" }}
          >
            <CheckCircle
              className="w-3.5 h-3.5"
              style={{ color: resultHidden ? GOLD : SUCCESS }}
            />
            <span
              className="text-[11px] font-semibold"
              style={{ color: resultHidden ? "#8A5A00" : SUCCESS }}
              data-testid={`match-status-${match.id}`}
            >
              {resultHidden ? "النتيجة جاهزة — بانتظار الإعلان" : "مكتمل"}
            </span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: PURPLE + "1f" }}
          >
            <Clock className="w-3.5 h-3.5" style={{ color: PURPLE }} />
            <span className="text-[11px] font-semibold" style={{ color: PURPLE }}>
              قيد الانتظار
            </span>
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        <div
          className="flex items-center py-2 pr-2.5 rounded"
          style={{ borderRightWidth: 3, borderRightColor: CYAN, borderRightStyle: "solid" }}
        >
          <div
            className="px-2 py-0.5 rounded-md ml-2.5"
            style={{ backgroundColor: CYAN + "26" }}
          >
            <span className="text-[10px] font-bold" style={{ color: CYAN }}>
              موالاة
            </span>
          </div>
          <span
            className={`flex-1 text-sm ${isGovWinner ? "font-bold" : "font-medium"}`}
            style={{ color: isGovWinner ? CYAN : undefined }}
          >
            {govName}
          </span>
          {match.completed && !resultHidden && (
            <span className="text-lg font-bold mr-2" style={{ color: CYAN }}>
              {hideScores ? HIDDEN_SCORE : match.team1.totalScore}
            </span>
          )}
          {isGovWinner && (
            <Award className="w-3.5 h-3.5 mr-1" style={{ color: CYAN }} />
          )}
        </div>

        <div className="flex items-center justify-center py-1 gap-0">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CYAN }} />
          <div className="flex-1 h-px bg-border" />
          <div className="px-2.5 py-0.5 rounded-md mx-1 bg-muted">
            <span className="text-[10px] font-bold text-muted-foreground">VS</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PURPLE }} />
        </div>

        <div
          className="flex items-center py-2 pr-2.5 rounded"
          style={{ borderRightWidth: 3, borderRightColor: PURPLE, borderRightStyle: "solid" }}
        >
          <div
            className="px-2 py-0.5 rounded-md ml-2.5"
            style={{ backgroundColor: PURPLE + "26" }}
          >
            <span className="text-[10px] font-bold" style={{ color: PURPLE }}>
              معارضة
            </span>
          </div>
          <span
            className={`flex-1 text-sm ${isOppWinner ? "font-bold" : "font-medium"}`}
            style={{ color: isOppWinner ? PURPLE : undefined }}
          >
            {oppName}
          </span>
          {match.completed && !resultHidden && (
            <span className="text-lg font-bold mr-2" style={{ color: PURPLE }}>
              {hideScores ? HIDDEN_SCORE : match.team2.totalScore}
            </span>
          )}
          {isOppWinner && (
            <Award className="w-3.5 h-3.5 mr-1" style={{ color: PURPLE }} />
          )}
        </div>
      </div>

      {match.completed && match.bestSpeaker && !resultHidden && (
        <div
          className="flex items-center gap-1.5 pt-2.5 mt-2.5 border-t border-border"
          style={{ backgroundColor: CYAN + "0F", marginInline: -14, marginBottom: -14, padding: "10px 14px", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}
        >
          <Star className="w-3.5 h-3.5" style={{ color: CYAN }} />
          <span className="text-[11px] font-medium text-muted-foreground">
            أفضل متحدث:
          </span>
          <span className="flex-1 text-xs font-bold" style={{ color: CYAN }}>
            {match.bestSpeaker.name}
          </span>
          <span className="text-sm font-bold" style={{ color: CYAN }}>
            {hideScores ? HIDDEN_SCORE : match.bestSpeaker.score}
          </span>
        </div>
      )}
    </div>
  );
}

interface StandingRowProps {
  team: Tournament["teams"][number];
  rank: number;
  rounds: Tournament["rounds"];
  onClick: () => void;
  hideScores?: boolean;
}

function StandingRow({ team, rank, rounds, onClick, hideScores }: StandingRowProps) {
  const breakdown = rounds
    .map((r) => {
      const m = r.matches.find(
        (mm) => mm.team1.teamId === team.id || mm.team2.teamId === team.id
      );
      if (!m || !m.completed) return null;
      const mt = m.team1.teamId === team.id ? m.team1 : m.team2;
      const label =
        r.kind === "semifinal"
          ? "نصف"
          : r.kind === "final"
          ? "نهائي"
          : `ج${r.roundNumber}`;
      return { label, score: mt.totalScore, won: m.winnerId === team.id };
    })
    .filter(Boolean) as { label: string; score: number; won: boolean }[];
  const isTop3 = rank <= 3;
  const medalColor =
    rank === 1 ? "#FFD700" : rank === 2 ? "#A8A9AD" : rank === 3 ? "#CD7F32" : "var(--muted)";
  const borderColor =
    rank === 1 ? CYAN : rank === 2 ? PURPLE : rank === 3 ? "#9B7BC4" : "transparent";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center p-3.5 mb-2.5 bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow text-right"
      style={{
        borderRightWidth: isTop3 ? 4 : 0,
        borderRightColor: borderColor,
        borderRightStyle: "solid",
      }}
      data-testid={`row-standing-${team.id}`}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center ml-3.5"
        style={{ backgroundColor: isTop3 ? medalColor : "var(--muted)" }}
      >
        {isTop3 ? (
          <Award className="w-4 h-4 text-white" />
        ) : (
          <span className="text-sm font-bold text-muted-foreground">{rank}</span>
        )}
      </div>

      <div className="flex-1 space-y-1.5">
        <div className="font-semibold text-base">{team.name}</div>
        <div className="flex gap-1.5">
          <span
            className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
            style={{ backgroundColor: CYAN + "26", color: CYAN }}
          >
            ف {team.wins}
          </span>
          <span
            className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
            style={{ backgroundColor: PURPLE + "26", color: PURPLE }}
          >
            خ {team.losses}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground">
            م {team.matchesPlayed}
          </span>
        </div>
        {breakdown.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {breakdown.map((b, k) => (
              <span
                key={k}
                className="text-[10px] px-1.5 py-0.5 rounded border"
                style={{
                  borderColor: b.won ? CYAN : PURPLE,
                  color: b.won ? CYAN : PURPLE,
                  backgroundColor: (b.won ? CYAN : PURPLE) + "12",
                }}
                title={`${b.label}: ${hideScores ? HIDDEN_SCORE : b.score} نقطة`}
              >
                {b.label}: {hideScores ? HIDDEN_SCORE : b.score}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        className="text-center px-3 py-2 rounded-xl mr-2.5"
        style={{ backgroundColor: CYAN + "14" }}
      >
        <div className="text-xl font-bold" style={{ color: CYAN }}>
          {hideScores ? HIDDEN_SCORE : team.totalPoints}
        </div>
        <div className="text-[10px] text-muted-foreground">نقطة</div>
      </div>
    </button>
  );
}

export default function TournamentDetail() {
  const [, params] = useRoute("/tournament/:id");
  const [, setLocation] = useLocation();
  const {
    getTournament,
    addTeam,
    deleteTeam,
    updateTeam,
    deleteTournament,
    finishTournament,
    reopenTournament,
    deleteRound,
    startTournament,
    generateRound,
    generateSemifinal,
    generateFinal,
    setEliminationMode,
    addRegisteredTeam,
    setRoundCase,
    setCurrentRound,
    setPresentedRound,
    setProtection,
    setMatchRoom,
    submitMatch,
    addJudge,
    updateJudge,
    deleteJudge,
    addPendingTeam,
    removePendingTeam,
    addPendingJudge,
    removePendingJudge,
    addPendingResult,
    removePendingResult,
    setRoundJudgesPerRoom,
    setMatchJudges,
    autoAssignJudges,
    setRoundLocked,
    markResultAnnounced,
    logAction,
    tournaments,
  } = useTournament();
  const tournament = getTournament(params?.id || "");

  // `?tab=` lets the tournament card's menu open a specific tab directly.
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    return (requested as TabType) || "overview";
  });
  const { toast } = useToast();
  const { can } = useRole();
  // Selected round numbers for the standings tab. Empty set = all rounds.
  const [standingsRoundFilter, setStandingsRoundFilter] = useState<Set<number>>(
    () => new Set()
  );
  const toggleStandingsRound = (n: number) => {
    setStandingsRoundFilter((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };
  // Selected round numbers for the speakers tab. Empty set = all rounds.
  const [speakersRoundFilter, setSpeakersRoundFilter] = useState<Set<number>>(
    () => new Set()
  );
  const toggleSpeakersRound = (n: number) => {
    setSpeakersRoundFilter((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };
  // Compare dialog state: which list to compare and which ids/keys are selected
  const [compareMode, setCompareMode] = useState<"teams" | "speakers" | null>(
    null
  );
  const [compareTeamIds, setCompareTeamIds] = useState<Set<string>>(
    () => new Set()
  );
  const [compareSpeakerKeys, setCompareSpeakerKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [hideScores, setHideScores] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("od:hideScores") === "true";
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("od:hideScores", hideScores ? "true" : "false");
  }, [hideScores]);
  const [viewingRound, setViewingRound] = useState<number | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [importTeamOpen, setImportTeamOpen] = useState(false);
  const [importTeamCode, setImportTeamCode] = useState("");
  const [importTeamError, setImportTeamError] = useState("");
  const [pasteResultsOpen, setPasteResultsOpen] = useState(false);
  const [pasteResultsText, setPasteResultsText] = useState("");
  const [pasteResultsReport, setPasteResultsReport] = useState<string>("");
  const [importJudgeOpen, setImportJudgeOpen] = useState(false);
  const [importJudgeCode, setImportJudgeCode] = useState("");
  const [importJudgeError, setImportJudgeError] = useState("");
  const [judgeEditOpen, setJudgeEditOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<Judge | null>(null);
  const [judgeAssignOpen, setJudgeAssignOpen] = useState(false);
  const [assigningMatchId, setAssigningMatchId] = useState<string | null>(null);
  const [assigningRoundNum, setAssigningRoundNum] = useState<number | null>(null);
  const [docPreview, setDocPreview] = useState<{ name: string; dataUrl: string; type: string } | null>(null);
  const [editingRoom, setEditingRoom] = useState<{
    roundNumber: number;
    match: Match;
    roomNumber: string;
    roomLabel: string;
  } | null>(null);
  const [roundNotification, setRoundNotification] = useState(false);
  const [protectionOpen, setProtectionOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const prevCompletedRef = useRef<boolean | null>(null);
  const consumedRef = useRef<Set<string>>(new Set());
  const tournamentRef = useRef(tournament);
  tournamentRef.current = tournament;

  useEffect(() => {
    if (!tournament) return;
    const tid = tournament.id;

    const ingest = (
      key: string,
      matchId: string,
      roundNumber: number,
      _roomNumber: number,
      sc: import("@/lib/judgeCodec").JudgeScores,
      _submittedAt: number,
      _consume: () => Promise<void>,
    ) => {
      if (consumedRef.current.has(key)) return;
      const t = tournamentRef.current;
      if (!t || t.id !== tid) return;

      const round = t.rounds.find((r) => r.roundNumber === roundNumber);
      const match = round?.matches.find((m) => m.id === matchId);
      if (!match) return;
      if (match.completed) { consumedRef.current.add(key); return; }
      if (match.team1.teamId !== sc.govTeamId && match.team2.teamId !== sc.govTeamId) return;

      const govSpeakers: Speaker[] = sc.govSpeakers.map((x) => ({
        speakerNumber: x.speakerNumber,
        name: x.name,
        score: x.score || 0,
      }));
      const oppSpeakers: Speaker[] = sc.oppSpeakers.map((x) => ({
        speakerNumber: x.speakerNumber,
        name: x.name,
        score: x.score || 0,
      }));
      const govTotal =
        govSpeakers.reduce((a, b) => a + b.score, 0) + (sc.govReplyScore || 0);
      const oppTotal =
        oppSpeakers.reduce((a, b) => a + b.score, 0) + (sc.oppReplyScore || 0);
      if (govTotal === oppTotal) {
        console.warn("[ingest] tied totals, skipping match", matchId);
        return;
      }
      const govSide =
        match.team1.teamId === sc.govTeamId ? match.team1 : match.team2;
      const oppSide =
        match.team1.teamId === sc.govTeamId ? match.team2 : match.team1;
      const newGov: MatchTeam = {
        ...govSide,
        speakers: govSpeakers,
        replyScore: sc.govReplyScore || 0,
        replySpeakerNumber: sc.govReplySpeakerNumber || 1,
        totalScore: govTotal,
      };
      const newOpp: MatchTeam = {
        ...oppSide,
        speakers: oppSpeakers,
        replyScore: sc.oppReplyScore || 0,
        replySpeakerNumber: sc.oppReplySpeakerNumber || 1,
        totalScore: oppTotal,
      };
      const team1Updated =
        match.team1.teamId === sc.govTeamId ? newGov : newOpp;
      const team2Updated =
        match.team1.teamId === sc.govTeamId ? newOpp : newGov;
      const winnerId = govTotal > oppTotal ? newGov.teamId : newOpp.teamId;
      const allWithTeam = [
        ...govSpeakers.map((s) => ({ ...s, teamId: newGov.teamId })),
        ...oppSpeakers.map((s) => ({ ...s, teamId: newOpp.teamId })),
      ];
      const best = allWithTeam.reduce((a, b) => (a.score > b.score ? a : b));
      const judgeNamesArr = (sc.judgeName || "")
        .split(/[,،]/)
        .map((n) => n.trim())
        .filter(Boolean);
      submitMatch(tid, roundNumber, {
        ...match,
        team1: team1Updated,
        team2: team2Updated,
        winnerId,
        bestSpeaker: { name: best.name, teamId: best.teamId, score: best.score },
        judgeNames: judgeNamesArr,
        chairName: sc.chairName?.trim() || undefined,
        judgeNotes: sc.judgeNotes || "",
        completed: true,
      });
      consumedRef.current.add(key);
    };

    let unsubMatch = () => {};
    let unsubRound = () => {};
    try {
      unsubMatch = subscribeMatchResults(tid, (u) => {
        ingest(
          `m:${u.sessionId}`,
          u.matchInfo.matchId,
          u.matchInfo.roundNumber,
          u.matchInfo.roomNumber,
          u.result,
          u.submittedAt,
          () => deleteMatchSession(u.sessionId),
        );
      });
      unsubRound = subscribeRoundResults(tid, (u) => {
        ingest(
          `r:${u.sessionId}:${u.roomNumber}`,
          u.matchId,
          u.roundNumber,
          u.roomNumber,
          u.scores,
          u.submittedAt,
          () => deleteRoundResult(u.sessionId, u.roomNumber),
        );
      });
    } catch (e) {
      console.warn("[firebase] live results disabled:", e);
    }
    return () => {
      try { unsubMatch(); } catch {}
      try { unsubRound(); } catch {}
    };
  }, [tournament?.id]);

  // Add team dialog state
  const [teamName, setTeamName] = useState("");
  const [speakersPerTeam, setSpeakersPerTeam] = useState<"3" | "4">("3");
  const [speakerNames, setSpeakerNames] = useState<string[]>(["", "", ""]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Edit team dialog state
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editSpeakersCount, setEditSpeakersCount] = useState<"3" | "4">("3");
  const [editSpeakerNames, setEditSpeakerNames] = useState<string[]>([]);
  const [editTeamLogo, setEditTeamLogo] = useState<string | undefined>();

  // Delete tournament confirmation
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);
  const [confirmReopenOpen, setConfirmReopenOpen] = useState(false);

  // Switch default tab to "rounds" when tournament starts
  useEffect(() => {
    if (tournament?.started && activeTab === "teams") {
      setActiveTab("overview");
    }
  }, [tournament?.started]);

  // A role change can remove the current destination — fall back to the overview.
  useEffect(() => {
    const blocked =
      (!can("viewScores") &&
        ["resultsAdmin", "standings", "speakers"].includes(activeTab)) ||
      (!can("viewAudit") && activeTab === "audit") ||
      (!can("manageTeams") && activeTab === "teams") ||
      (!can("manageJudges") && ["judges", "pending"].includes(activeTab));
    if (blocked) setActiveTab("overview");
  }, [activeTab, can]);

  // Compute the public-facing topic: prefer the active round's case text,
  // else fall back to the most recent non-empty caseText.
  const publicTopic = useMemo(() => {
    if (!tournament) return "";
    const cur = tournament.rounds.find(
      (r) => r.roundNumber === tournament.currentRound,
    );
    if (cur?.caseText && cur.caseText.trim()) return cur.caseText.trim();
    for (let i = tournament.rounds.length - 1; i >= 0; i--) {
      const c = tournament.rounds[i]?.caseText;
      if (c && c.trim()) return c.trim();
    }
    return "";
  }, [tournament?.rounds, tournament?.currentRound]);

  // Publish tournament name + topic so the public registration link can show them.
  useEffect(() => {
    if (!tournament) return;
    // قواعد البطولة travel with the public link, so registration pages and the
    // judging screens always read the same rules and the same score range.
    const s = tournament.settings;
    void publishTournament({
      id: tournament.id,
      name: tournament.name,
      topic: publicTopic,
      rules: s
        ? {
            speakersPerTeam: [3, 4],
            scoreMin: s.scoreMin,
            scoreMax: s.scoreMax,
            judgesPerRoom: s.judgesPerRoom,
            replySpeech: s.replySpeech,
            text: s.rules,
          }
        : undefined,
    }).catch(() => {});
  }, [tournament?.id, tournament?.name, publicTopic, tournament?.settings]);

  // Poll the server for new registrations submitted via the public link
  // and pump them into the organizer's pending lists, then delete on the server
  // so each registration is ingested exactly once. A per-tournament "consumed"
  // set + in-flight guard prevents double-ingestion across overlapping ticks.
  const consumedRegRef = useRef<Set<string>>(new Set());
  const tickInFlightRef = useRef(false);
  useEffect(() => {
    if (!tournament) return;
    const tid = tournament.id;
    consumedRegRef.current = new Set();
    let cancelled = false;
    const tick = async () => {
      if (tickInFlightRef.current) return;
      tickInFlightRef.current = true;
      try {
        const rows = await listRegistrations(tid);
        if (cancelled) return;
        for (const row of rows) {
          if (consumedRegRef.current.has(row.id)) continue;
          consumedRegRef.current.add(row.id);
          if (row.kind === "team") {
            const p = toPendingTeam(row);
            if (p) addPendingTeam(tid, p);
          } else if (row.kind === "judge") {
            const p = toPendingJudge(row);
            if (p) addPendingJudge(tid, p);
          }
          try {
            await deleteRegistration(tid, row.id);
          } catch {}
        }
      } catch {
      } finally {
        tickInFlightRef.current = false;
      }
    };
    void tick();
    const handle = window.setInterval(() => {
      void tick();
    }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [tournament?.id, addPendingTeam, addPendingJudge]);

  const teamMap = useMemo(() => {
    const map = new Map<string, { name: string }>();
    tournament?.teams.forEach((t) => map.set(t.id, { name: t.name }));
    return map;
  }, [tournament?.teams]);

  const sortedTeams = useMemo(() => {
    if (!tournament) return [];
    return [...tournament.teams].sort((a, b) =>
      b.wins !== a.wins ? b.wins - a.wins : b.totalPoints - a.totalPoints
    );
  }, [tournament?.teams]);

  // Per-round standings: when a round is selected, recompute wins/points for
  // ONLY that round's matches. Teams not in that round are excluded.
  const displayStandings = useMemo(() => {
    if (!tournament) return [];
    if (standingsRoundFilter.size === 0) return sortedTeams;
    const selectedRounds = tournament.rounds.filter((r) =>
      standingsRoundFilter.has(r.roundNumber)
    );
    if (selectedRounds.length === 0) return [];
    type TeamStat = (typeof tournament.teams)[number];
    const aggregated = new Map<string, TeamStat>();
    const accumulate = (
      teamId: string,
      teamScore: number,
      matchCompleted: boolean,
      didWin: boolean,
      didLose: boolean
    ) => {
      const baseTeam = tournament.teams.find((t) => t.id === teamId);
      if (!baseTeam) return;
      const prev = aggregated.get(teamId);
      if (prev) {
        aggregated.set(teamId, {
          ...prev,
          wins: prev.wins + (didWin ? 1 : 0),
          losses: prev.losses + (didLose ? 1 : 0),
          matchesPlayed: prev.matchesPlayed + (matchCompleted ? 1 : 0),
          totalPoints: prev.totalPoints + (matchCompleted ? teamScore : 0),
        });
      } else {
        aggregated.set(teamId, {
          ...baseTeam,
          wins: didWin ? 1 : 0,
          losses: didLose ? 1 : 0,
          matchesPlayed: matchCompleted ? 1 : 0,
          totalPoints: matchCompleted ? teamScore : 0,
        });
      }
    };
    for (const round of selectedRounds) {
      for (const m of round.matches) {
        const completed = !!m.completed;
        const t1Win = completed && m.winnerId === m.team1.teamId;
        const t2Win = completed && m.winnerId === m.team2.teamId;
        accumulate(
          m.team1.teamId,
          m.team1.totalScore,
          completed,
          t1Win,
          completed && !!m.winnerId && !t1Win
        );
        accumulate(
          m.team2.teamId,
          m.team2.totalScore,
          completed,
          t2Win,
          completed && !!m.winnerId && !t2Win
        );
      }
    }
    return Array.from(aggregated.values()).sort((a, b) =>
      b.wins !== a.wins ? b.wins - a.wins : b.totalPoints - a.totalPoints
    );
  }, [tournament, sortedTeams, standingsRoundFilter]);

  const standingsRoundLabel = (r: { kind?: string; roundNumber: number }) =>
    r.kind === "semifinal"
      ? "نصف النهائي"
      : r.kind === "final"
      ? "النهائي"
      : `ج${r.roundNumber}`;

  // All speakers across selected rounds, with score totals.
  // When speakersRoundFilter is empty, all rounds are included.
  const allSpeakers = useMemo(() => {
    if (!tournament) return [];
    type SpeakerRow = {
      key: string;
      name: string;
      teamName: string;
      totalScore: number;
      appearances: number;
    };
    const map = new Map<string, SpeakerRow>();
    const includedRounds =
      speakersRoundFilter.size === 0
        ? tournament.rounds
        : tournament.rounds.filter((r) =>
            speakersRoundFilter.has(r.roundNumber)
          );
    for (const round of includedRounds) {
      for (const match of round.matches) {
        if (!match.completed) continue;
        const govTeam = tournament.teams.find((t) => t.id === match.team1.teamId);
        const oppTeam = tournament.teams.find((t) => t.id === match.team2.teamId);
        for (const sp of match.team1.speakers) {
          const key = `${match.team1.teamId}_${sp.speakerNumber}`;
          const existing = map.get(key);
          if (existing) {
            existing.totalScore += sp.score;
            existing.appearances += 1;
          } else {
            map.set(key, {
              key,
              name: sp.name,
              teamName: govTeam?.name ?? "",
              totalScore: sp.score,
              appearances: 1,
            });
          }
        }
        for (const sp of match.team2.speakers) {
          const key = `${match.team2.teamId}_${sp.speakerNumber}`;
          const existing = map.get(key);
          if (existing) {
            existing.totalScore += sp.score;
            existing.appearances += 1;
          } else {
            map.set(key, {
              key,
              name: sp.name,
              teamName: oppTeam?.name ?? "",
              totalScore: sp.score,
              appearances: 1,
            });
          }
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore);
  }, [tournament, speakersRoundFilter]);

  const currentRoundNum =
    viewingRound ?? Math.max(tournament?.currentRound || 1, 1);
  const currentRound = tournament?.rounds.find(
    (r) => r.roundNumber === currentRoundNum
  );
  // Navigation follows the rounds that actually exist, since a tournament may
  // start from a later round and its numbers need not begin at 1.
  const roundNumbers = useMemo(
    () =>
      (tournament?.rounds ?? [])
        .map((r) => r.roundNumber)
        .sort((a, b) => a - b),
    [tournament?.rounds]
  );
  const viewedIndex = roundNumbers.indexOf(currentRoundNum);
  const prevRoundNum = viewedIndex > 0 ? roundNumbers[viewedIndex - 1] : null;
  const nextRoundNum =
    viewedIndex >= 0 && viewedIndex < roundNumbers.length - 1
      ? roundNumbers[viewedIndex + 1]
      : null;
  const completedCount =
    currentRound?.matches.filter((m) => m.completed).length ?? 0;
  const totalMatches = currentRound?.matches.length ?? 0;
  const allRoomsComplete = completedCount === totalMatches && totalMatches > 0;
  const tournamentCurrentRound = tournament?.currentRound;

  useEffect(() => {
    if (
      prevCompletedRef.current === false &&
      allRoomsComplete &&
      currentRoundNum === tournamentCurrentRound
    ) {
      setRoundNotification(true);
    }
    prevCompletedRef.current = allRoomsComplete;
  }, [allRoomsComplete, currentRoundNum, tournamentCurrentRound]);

  if (!tournament) {
    // Still loading the shared store — show the dashboard's shape, not a blank page.
    if (tournaments.length === 0) return <TournamentSkeleton />;

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center"
        style={{ backgroundColor: BRAND.surface }}
        data-testid="tournament-not-found"
      >
        <span
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${BRAND.purple}12` }}
        >
          <Trophy className="w-7 h-7" style={{ color: BRAND.purple }} />
        </span>
        <p className="font-bold text-[16px]" style={{ color: BRAND.ink }}>
          البطولة غير موجودة
        </p>
        <p className="text-[13px] max-w-sm" style={{ color: `${BRAND.ink}8c` }}>
          قد يكون الرابط قديماً أو حُذفت البطولة. يمكنك العودة إلى قائمة البطولات.
        </p>
        <button
          type="button"
          onClick={() => setLocation("/")}
          className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg} mt-1`}
          style={BTN_PRIMARY_STYLE}
          data-testid="button-back-home"
        >
          العودة إلى البطولات
        </button>
      </div>
    );
  }

  // ── Access-code protection ────────────────────────────────────────────────
  const protection = tournament.protection;
  const unlockKey = `tournament_unlocked_${tournament.id}`;
  const storedUnlock = sessionStorage.getItem(unlockKey);
  const needsUnlock =
    !!protection?.enabled &&
    !!protection.code &&
    (protection.protectView || protection.protectEdit) &&
    !unlocked &&
    storedUnlock !== protection.code &&
    !(storedUnlock !== null && isOwnerCode(storedUnlock));

  if (needsUnlock) {
    return (
      <UnlockGate
        tournamentName={tournament.name}
        codeLength={protection!.code.length}
        onSubmit={(code) => {
          // The owner's master code opens any protected tournament.
          if (code !== protection!.code && !isOwnerCode(code)) return false;
          sessionStorage.setItem(unlockKey, code);
          setUnlocked(true);
          return true;
        }}
        onBack={() => setLocation("/")}
      />
    );
  }

  const isCurrentRoundComplete = () => {
    const last = tournament.rounds[tournament.rounds.length - 1];
    return !!last && last.matches.length > 0 && last.matches.every((m) => m.completed);
  };

  const lastRound = tournament.rounds[tournament.rounds.length - 1];
  const hasSemifinal = tournament.rounds.some((r) => r.kind === "semifinal");
  const hasFinal = tournament.rounds.some((r) => r.kind === "final");
  const regularRounds = tournament.rounds.filter(
    (r) => !r.kind || r.kind === "regular"
  );
  const allRegularDone =
    regularRounds.length >= tournament.totalRounds &&
    regularRounds.every((r) => r.completed);
  const lastIsKnockout =
    !!lastRound && (lastRound.kind === "semifinal" || lastRound.kind === "final");
  const canGenerateRound =
    tournament.started &&
    !tournament.finished &&
    !lastIsKnockout &&
    (tournament.rounds.length === 0 || lastRound?.completed);
  const canGenerateSemifinal =
    tournament.started &&
    !tournament.finished &&
    !!tournament.semifinalEnabled &&
    !hasSemifinal &&
    !hasFinal &&
    allRegularDone &&
    tournament.teams.length >= 4;
  const canGenerateFinal =
    tournament.started &&
    !tournament.finished &&
    !hasFinal &&
    (hasSemifinal
      ? lastRound?.kind === "semifinal" && lastRound.completed
      : !!tournament.finalEnabled &&
        !tournament.semifinalEnabled &&
        allRegularDone) &&
    tournament.teams.length >= 2;
  const showAdvancementSuggestion =
    tournament.started &&
    !tournament.finished &&
    allRegularDone &&
    !hasSemifinal &&
    !hasFinal &&
    !canGenerateSemifinal &&
    !canGenerateFinal;

  const handleSpeakerCountChange = (val: string) => {
    setSpeakersPerTeam(val as "3" | "4");
    const count = parseInt(val);
    setSpeakerNames((prev) => {
      if (count > prev.length)
        return [...prev, ...Array(count - prev.length).fill("")];
      return prev.slice(0, count);
    });
  };

  const handleAddTeam = () => {
    if (!teamName.trim()) return;
    addTeam(
      tournament.id,
      teamName.trim(),
      parseInt(speakersPerTeam) as 3 | 4,
      speakerNames
    );
    setTeamName("");
    setSpeakerNames(Array(parseInt(speakersPerTeam)).fill(""));
    setDialogOpen(false);
  };

  const handleAdvanceRound = () => {
    const last = tournament.rounds[tournament.rounds.length - 1];
    if (last) {
      const pending = last.matches.filter((m) => !m.completed);
      if (pending.length > 0) {
        const list = pending.map((m) => `• القاعة ${m.roomNumber}`).join("\n");
        window.alert(`لا يمكن بدء الجولة التالية — القاعات التالية لم تُرسل نتائجها بعد:\n\n${list}\n\nيرجى استكمال إرسال جميع نتائج القاعات أولاً.`);
        return;
      }
    }
    if (!canGenerateRound) {
      window.alert("يجب إكمال جميع المباريات في الجولة الحالية أولاً");
      return;
    }
    if (!window.confirm("هل تريد بدء الجولة التالية؟ سيتم توليد المواجهات بناءً على النتائج.")) return;
    generateRound(tournament.id);
    setViewingRound(null);
    setRoundNotification(false);
  };

  /**
   * The one action that moves the tournament forward from النظرة العامة:
   * pairings → rooms → judges → the round becomes the live one. Nothing is
   * started before every readiness check passes.
   */
  const prepareAndStartNextRound = () => {
    if (!tournament) return;
    const nextNum = currentRoundNum + 1;
    const existing = tournament.rounds.find((r) => r.roundNumber === nextNum);

    if (!existing) {
      if (canGenerateSemifinal) generateSemifinal(tournament.id);
      else if (canGenerateFinal) generateFinal(tournament.id);
      else if (canGenerateRound) generateRound(tournament.id);
      else {
        window.alert("لا يمكن تجهيز الجولة التالية — أكمل نتائج الجولة الحالية أولاً.");
        return;
      }
      autoAssignJudges(tournament.id, nextNum);
    }

    setCurrentRound(tournament.id, nextNum);
    setViewingRound(nextNum);
    setRoundNotification(false);
    logAction(tournament.id, "بدء الجولة", `الجولة ${nextNum}`);
    toast({ title: `تم تجهيز الجولة ${nextNum} وبدؤها` });
  };

  /**
   * The round as the judging link sees it: rooms, rosters and — so the link can
   * identify the judge itself — the judges assigned to each room.
   */
  const buildRoundData = (): RoundData => {
    const rooms: RoomInfo[] = (currentRound?.matches ?? []).map((m) => {
      const gov = tournament.teams.find((t) => t.id === m.team1.teamId);
      const opp = tournament.teams.find((t) => t.id === m.team2.teamId);
      const a = m.judgeAssignment;
      const ids = [
        ...(a?.chairJudgeId ? [a.chairJudgeId] : []),
        ...(a?.panelistJudgeIds ?? []),
      ];
      return {
        roomNumber: m.roomNumber,
        roomLabel: m.roomLabel,
        matchId: m.id,
        govTeamName: gov?.name ?? "الموالاة",
        oppTeamName: opp?.name ?? "المعارضة",
        govTeamId: m.team1.teamId,
        govSpeakerNames: gov?.speakerNames ?? [],
        oppSpeakerNames: opp?.speakerNames ?? [],
        govSpeakersCount: gov?.speakersPerTeam ?? 3,
        oppSpeakersCount: opp?.speakersPerTeam ?? 3,
        judges: ids
          .map((id) => {
            const j = (tournament.judges ?? []).find((x) => x.id === id);
            return j ? { id: j.id, name: j.name, chair: a?.chairJudgeId === id } : null;
          })
          .filter(Boolean) as { id: string; name: string; chair: boolean }[],
      };
    });
    return {
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      roundNumber: currentRoundNum,
      rooms,
      caseText: currentRound?.caseText,
    };
  };

  /** Personal link for one judge: their room only, their name pre-filled. */
  const handleJudgeLink = async (judgeId: string) => {
    if (!currentRound || linkLoading) return;
    setLinkLoading(true);
    try {
      const sid = await createRoundSession(buildRoundData());
      const judge = (tournament.judges ?? []).find((j) => j.id === judgeId);
      openShareDialog(
        `رابط تحكيم — ${judge?.name ?? "المحكم"}`,
        buildJudgeSessionUrl(sid, judgeId),
      );
    } catch {
      window.alert("حدث خطأ أثناء إنشاء رابط المحكم");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleRoundJudgeLink = async () => {
    if (!currentRound || linkLoading) return;
    setLinkLoading(true);
    try {
      const roundData = buildRoundData();
      const sid = await createRoundSession(roundData);
      const url = buildSessionUrl("round", sid);
      openShareDialog("رابط المحكمين", url);
    } catch {
      window.alert("حدث خطأ أثناء إنشاء رابط المحكمين");
    } finally {
      setLinkLoading(false);
    }
  };

  const openShareDialog = (title: string, url: string) => {
    setShareTitle(title);
    setShareUrl(url);
    setShareDialogOpen(true);
  };

  const handleAdminLink = () => {
    if (!tournament) return;
    try {
      const url = buildAdminUrl(tournament);
      openShareDialog("رابط الإدارة", url);
    } catch {
      window.alert("حدث خطأ. قد تكون البطولة كبيرة جداً للمشاركة عبر رابط.");
    }
  };

  const handleRegistrationLink = () => {
    if (!tournament) return;
    const url = buildRegisterUrl({
      tournamentId: tournament.id,
      tournamentName: tournament.name,
    });
    openShareDialog("رابط تسجيل الفرق", url);
  };

  const handleImportTeam = () => {
    setImportTeamError("");
    const trimmed = importTeamCode.trim();
    if (!trimmed) {
      setImportTeamError("الصق رمز التسجيل");
      return;
    }
    const reg = decodeRegistration(trimmed);
    if (!reg) {
      setImportTeamError("رمز غير صالح");
      return;
    }
    if (!tournament) return;
    const pending: PendingTeamRegistration = {
      id: crypto.randomUUID(),
      teamName: reg.teamName,
      institution: reg.institution,
      speakersPerTeam: reg.speakersPerTeam,
      speakerNames: reg.speakerNames,
      documents: reg.documents,
      submittedAt: reg.submittedAt,
    };
    addPendingTeam(tournament.id, pending);
    setImportTeamCode("");
    setImportTeamOpen(false);
    setActiveTab("pending");
  };

  const handleImportJudge = () => {
    setImportJudgeError("");
    const trimmed = importJudgeCode.trim();
    if (!trimmed) {
      setImportJudgeError("الصق رمز التسجيل");
      return;
    }
    const reg = decodeJudgeRegistration(trimmed);
    if (!reg) {
      setImportJudgeError("رمز غير صالح");
      return;
    }
    if (!tournament) return;
    const pending: PendingJudgeRegistration = {
      id: crypto.randomUUID(),
      name: reg.name,
      institution: reg.institution,
      experience: reg.experience,
      canChair: reg.canChair,
      submittedAt: reg.submittedAt,
    };
    addPendingJudge(tournament.id, pending);
    setImportJudgeCode("");
    setImportJudgeOpen(false);
    setActiveTab("pending");
  };

  const handleJudgeRegistrationLink = () => {
    if (!tournament) return;
    const url = buildJudgeRegisterUrl({
      tournamentId: tournament.id,
      tournamentName: tournament.name,
    });
    openShareDialog("رابط تسجيل المحكمين", url);
  };

  const handlePublicJudgesLink = () => {
    if (!tournament) return;
    const base =
      window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
    openShareDialog(
      "صفحة المحكمين العامة",
      `${base}/judges-public?t=${encodeURIComponent(tournament.id)}`
    );
  };

  const approvePendingTeam = (p: PendingTeamRegistration) => {
    if (!tournament) return;
    addRegisteredTeam(tournament.id, {
      id: crypto.randomUUID(),
      name: p.teamName,
      speakersPerTeam: p.speakersPerTeam,
      speakerNames: p.speakerNames,
      institution: p.institution,
      documents: p.documents,
      registeredAt: p.submittedAt,
      totalPoints: 0,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
    });
    removePendingTeam(tournament.id, p.id);
  };

  const approvePendingJudge = (p: PendingJudgeRegistration) => {
    if (!tournament) return;
    const judge: Judge = {
      id: crypto.randomUUID(),
      name: p.name,
      institution: p.institution,
      experience: p.experience,
      canChair: p.canChair,
      conflictTeamIds: [],
      registeredAt: p.submittedAt,
    };
    addJudge(tournament.id, judge);
    removePendingJudge(tournament.id, p.id);
  };

  const approvePendingResult = (p: PendingMatchResult) => {
    if (!tournament) return;
    const round = tournament.rounds.find(
      (r) => r.roundNumber === p.roundNumber
    );
    const match = round?.matches.find((m) => m.id === p.matchId);
    if (!match) {
      window.alert("لم يُعثر على المباراة المطابقة لهذا الرمز.");
      return;
    }
    if (
      match.team1.teamId !== p.govTeamId &&
      match.team2.teamId !== p.govTeamId
    ) {
      window.alert("الفرق في الرمز لا تطابق هذه المباراة.");
      return;
    }
    const govSide =
      match.team1.teamId === p.govTeamId ? match.team1 : match.team2;
    const oppSide =
      match.team1.teamId === p.govTeamId ? match.team2 : match.team1;
    const govSpeakers: Speaker[] = p.govSpeakers.map((s) => ({
      speakerNumber: s.speakerNumber,
      name: s.name,
      score: s.score || 0,
    }));
    const oppSpeakers: Speaker[] = p.oppSpeakers.map((s) => ({
      speakerNumber: s.speakerNumber,
      name: s.name,
      score: s.score || 0,
    }));
    const govTotal =
      govSpeakers.reduce((s, x) => s + x.score, 0) + (p.govReplyScore || 0);
    const oppTotal =
      oppSpeakers.reduce((s, x) => s + x.score, 0) + (p.oppReplyScore || 0);
    if (govTotal === oppTotal) {
      window.alert("لا يمكن اعتماد النتيجة: مجموع الفريقين متساوٍ.");
      return;
    }
    const newGov: MatchTeam = {
      ...govSide,
      speakers: govSpeakers,
      replyScore: p.govReplyScore || 0,
      replySpeakerNumber: p.govReplySpeakerNumber || 1,
      totalScore: govTotal,
    };
    const newOpp: MatchTeam = {
      ...oppSide,
      speakers: oppSpeakers,
      replyScore: p.oppReplyScore || 0,
      replySpeakerNumber: p.oppReplySpeakerNumber || 1,
      totalScore: oppTotal,
    };
    const team1Updated =
      match.team1.teamId === p.govTeamId ? newGov : newOpp;
    const team2Updated =
      match.team1.teamId === p.govTeamId ? newOpp : newGov;
    const winnerId = govTotal > oppTotal ? newGov.teamId : newOpp.teamId;
    const allWithTeam = [
      ...govSpeakers.map((s) => ({ ...s, teamId: newGov.teamId })),
      ...oppSpeakers.map((s) => ({ ...s, teamId: newOpp.teamId })),
    ];
    const best = allWithTeam.reduce((a, b) => (a.score > b.score ? a : b));
    const judgeNamesArr = (p.judgeName || "")
      .split(/[,،]/)
      .map((n) => n.trim())
      .filter(Boolean);
    submitMatch(tournament.id, p.roundNumber, {
      ...match,
      team1: team1Updated,
      team2: team2Updated,
      winnerId,
      bestSpeaker: { name: best.name, teamId: best.teamId, score: best.score },
      judgeNames: judgeNamesArr,
      chairName: p.chairName?.trim() || undefined,
      judgeNotes: p.judgeNotes || "",
      completed: true,
    });
    removePendingResult(tournament.id, p.id);
  };

  const handleSaveJudge = () => {
    if (!tournament || !editingJudge) return;
    if (!editingJudge.name.trim()) {
      window.alert("اسم المحكم مطلوب");
      return;
    }
    const exists = (tournament.judges ?? []).some(
      (j) => j.id === editingJudge.id
    );
    if (exists) {
      updateJudge(tournament.id, editingJudge);
    } else {
      addJudge(tournament.id, editingJudge);
    }
    setEditingJudge(null);
    setJudgeEditOpen(false);
  };

  const handlePasteResults = () => {
    if (!tournament) return;
    setPasteResultsReport("");
    const lines = pasteResultsText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      setPasteResultsReport("الصق رمزاً واحداً أو أكثر (كل رمز في سطر).");
      return;
    }
    const log: string[] = [];
    let appliedCount = 0;
    for (const code of lines) {
      const scores = decodeScores(code);
      if (!scores) {
        log.push(`✗ رمز غير صالح: ${code.slice(0, 18)}…`);
        continue;
      }
      if (!scores.matchId || !scores.roundNumber) {
        log.push("✗ هذا الرمز قديم — افتح المباراة يدوياً والصقه هناك.");
        continue;
      }
      const round = tournament.rounds.find(
        (r) => r.roundNumber === scores.roundNumber
      );
      const match = round?.matches.find((m) => m.id === scores.matchId);
      if (!match) {
        log.push(`✗ لم يُعثر على المباراة (جولة ${scores.roundNumber}، قاعة ${scores.roomNumber ?? "?"}).`);
        continue;
      }
      const govSide =
        match.team1.teamId === scores.govTeamId ? match.team1 : match.team2;
      const oppSide =
        match.team1.teamId === scores.govTeamId ? match.team2 : match.team1;

      const govSpeakers: Speaker[] = scores.govSpeakers.map((s) => ({
        speakerNumber: s.speakerNumber,
        name: s.name,
        score: s.score || 0,
      }));
      const oppSpeakers: Speaker[] = scores.oppSpeakers.map((s) => ({
        speakerNumber: s.speakerNumber,
        name: s.name,
        score: s.score || 0,
      }));
      const govTotal =
        govSpeakers.reduce((s, x) => s + x.score, 0) +
        (scores.govReplyScore || 0);
      const oppTotal =
        oppSpeakers.reduce((s, x) => s + x.score, 0) +
        (scores.oppReplyScore || 0);
      if (govTotal === oppTotal) {
        log.push(
          `✗ القاعة ${match.roomNumber}: مجموع الفريقين متساوٍ — لا يمكن الحفظ.`
        );
        continue;
      }
      const newGov: MatchTeam = {
        ...govSide,
        speakers: govSpeakers,
        replyScore: scores.govReplyScore || 0,
        replySpeakerNumber: scores.govReplySpeakerNumber || 1,
        totalScore: govTotal,
      };
      const newOpp: MatchTeam = {
        ...oppSide,
        speakers: oppSpeakers,
        replyScore: scores.oppReplyScore || 0,
        replySpeakerNumber: scores.oppReplySpeakerNumber || 1,
        totalScore: oppTotal,
      };
      const team1Updated =
        match.team1.teamId === scores.govTeamId ? newGov : newOpp;
      const team2Updated =
        match.team1.teamId === scores.govTeamId ? newOpp : newGov;
      const winnerId =
        govTotal > oppTotal ? newGov.teamId : newOpp.teamId;
      const allWithTeam = [
        ...govSpeakers.map((s) => ({ ...s, teamId: newGov.teamId })),
        ...oppSpeakers.map((s) => ({ ...s, teamId: newOpp.teamId })),
      ];
      const best = allWithTeam.reduce((a, b) => (a.score > b.score ? a : b));
      const judgeNamesArr = (scores.judgeName || "")
        .split(/[,،]/)
        .map((n) => n.trim())
        .filter(Boolean);

      const updated: Match = {
        ...match,
        team1: team1Updated,
        team2: team2Updated,
        winnerId,
        bestSpeaker: { name: best.name, teamId: best.teamId, score: best.score },
        judgeNames: judgeNamesArr,
        chairName: scores.chairName?.trim() || undefined,
        judgeNotes: scores.judgeNotes || "",
        completed: true,
      };
      submitMatch(tournament.id, scores.roundNumber, updated);
      appliedCount += 1;
      log.push(
        `✓ القاعة ${match.roomNumber} (جولة ${scores.roundNumber}) — ${newGov.totalScore} مقابل ${newOpp.totalScore}`
      );
    }
    setPasteResultsReport(
      `تم تطبيق ${appliedCount} نتيجة من ${lines.length}.\n\n${log.join("\n")}`
    );
    if (appliedCount > 0) setPasteResultsText("");
  };

  const handleExportPdf = () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      const html = buildPdfHtml(tournament);
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
        w.print();
      }
    } catch {
      window.alert("حدث خطأ أثناء إنشاء التقرير");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (excelLoading) return;
    setExcelLoading(true);
    try {
      const XLSX: typeof XLSXType = await import("@/lib/excel-export");
      const wb = XLSX.utils.book_new();
      const fmtDate = (ts: number) => {
        const d = new Date(ts);
        return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
          d.getDate()
        ).padStart(2, "0")}`;
      };
      const teamById = (id: string) => tournament.teams.find((t) => t.id === id);
      const totalMatches = tournament.rounds.reduce(
        (s, r) => s + r.matches.length,
        0
      );
      const completedMatches = tournament.rounds.reduce(
        (s, r) => s + r.matches.filter((m) => m.completed).length,
        0
      );
      const completedRounds = tournament.rounds.filter((r) => r.completed).length;

      // Sheet 1: Tournament summary
      const summary: (string | number)[][] = [
        ["تقرير البطولة"],
        [],
        ["اسم البطولة", tournament.name],
        ["تاريخ الإنشاء", fmtDate(tournament.createdAt)],
        ["تاريخ التصدير", fmtDate(Date.now())],
        ["إجمالي الجولات", tournament.totalRounds],
        ["الجولات المنتهية", completedRounds],
        ["الجولة الحالية", tournament.currentRound],
        ["إجمالي الفرق", tournament.teams.length],
        ["إجمالي المباريات", totalMatches],
        ["المباريات المكتملة", completedMatches],
        ["الحالة", tournament.finished ? "منتهية" : tournament.started ? "جارية" : "لم تبدأ"],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summary);
      wsSummary["!cols"] = [{ wch: 22 }, { wch: 32 }];
      wsSummary["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "ملخص البطولة");

      // Sheet 2: Standings (with averages and percentages)
      const sortedForSheet = [...tournament.teams].sort((a, b) =>
        b.wins !== a.wins ? b.wins - a.wins : b.totalPoints - a.totalPoints
      );
      const standingsData: (string | number)[][] = [
        [
          "الترتيب",
          "الفريق",
          "عدد المتحدثين",
          "المباريات",
          "فوز",
          "خسارة",
          "نسبة الفوز %",
          "النقاط الكلية",
          "متوسط النقاط",
        ],
        ...sortedForSheet.map((t, i) => {
          const winPct = t.matchesPlayed > 0 ? Math.round((t.wins / t.matchesPlayed) * 100) : 0;
          const avg = t.matchesPlayed > 0 ? Math.round(t.totalPoints / t.matchesPlayed) : 0;
          return [
            i + 1,
            t.name,
            t.speakersPerTeam,
            t.matchesPlayed,
            t.wins,
            t.losses,
            winPct,
            t.totalPoints,
            avg,
          ];
        }),
      ];
      const wsStandings = XLSX.utils.aoa_to_sheet(standingsData);
      wsStandings["!cols"] = [
        { wch: 8 }, { wch: 22 }, { wch: 14 }, { wch: 10 },
        { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, wsStandings, "الترتيب");

      // Sheet 3: Teams & Speakers (full roster)
      const teamsData: (string | number)[][] = [
        ["الفريق", "عدد المتحدثين", "المتحدث", "ترتيب المتحدث"],
      ];
      tournament.teams.forEach((t) => {
        t.speakerNames.forEach((sp, i) => {
          teamsData.push([t.name, t.speakersPerTeam, sp || `متحدث ${i + 1}`, i + 1]);
        });
      });
      const wsTeams = XLSX.utils.aoa_to_sheet(teamsData);
      wsTeams["!cols"] = [{ wch: 22 }, { wch: 14 }, { wch: 24 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsTeams, "الفرق والمتحدثون");

      // Sheet 4: Rounds & Matches (with reply speaker, judges, notes)
      const roundsData: (string | number)[][] = [
        [
          "الجولة",
          "القاعة",
          "الموالاة",
          "نقاط الموالاة",
          "متحدث الرد (موالاة)",
          "نقاط الرد (موالاة)",
          "المعارضة",
          "نقاط المعارضة",
          "متحدث الرد (معارضة)",
          "نقاط الرد (معارضة)",
          "الفائز",
          "فارق النقاط",
          "أفضل متحدث",
          "نقاط أفضل متحدث",
          "المحكمون",
          "رئيس الجلسة",
          "ملاحظات المحكم",
          "الحالة",
        ],
      ];
      tournament.rounds.forEach((r) => {
        r.matches.forEach((m) => {
          const gov = teamById(m.team1.teamId);
          const opp = teamById(m.team2.teamId);
          const winnerName = m.winnerId
            ? teamById(m.winnerId)?.name ?? ""
            : m.completed ? "تعادل" : "—";
          const govReplyName =
            gov?.speakerNames[(m.team1.replySpeakerNumber || 1) - 1] || "—";
          const oppReplyName =
            opp?.speakerNames[(m.team2.replySpeakerNumber || 1) - 1] || "—";
          const diff = m.completed
            ? Math.abs(m.team1.totalScore - m.team2.totalScore)
            : "—";
          roundsData.push([
            r.roundNumber,
            m.roomNumber,
            gov?.name ?? "",
            m.completed ? m.team1.totalScore : "—",
            m.completed ? govReplyName : "—",
            m.completed ? m.team1.replyScore : "—",
            opp?.name ?? "",
            m.completed ? m.team2.totalScore : "—",
            m.completed ? oppReplyName : "—",
            m.completed ? m.team2.replyScore : "—",
            winnerName,
            diff,
            m.bestSpeaker?.name ?? "—",
            m.bestSpeaker?.score ?? "—",
            m.judgeNames.join("، ") || "—",
            m.chairName || "—",
            m.judgeNotes || "—",
            m.completed ? "مكتملة" : "قيد التنفيذ",
          ]);
        });
      });
      const wsRounds = XLSX.utils.aoa_to_sheet(roundsData);
      wsRounds["!cols"] = [
        { wch: 8 }, { wch: 8 }, { wch: 20 }, { wch: 12 }, { wch: 22 }, { wch: 12 },
        { wch: 20 }, { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 10 },
        { wch: 24 }, { wch: 12 }, { wch: 28 }, { wch: 32 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, wsRounds, "الجولات والمباريات");

      // Sheet 5: Per-speaker per-match scores (with role + reply flag)
      const speakerRows: (string | number)[][] = [
        [
          "الجولة",
          "القاعة",
          "الفريق",
          "الدور",
          "المتحدث",
          "ترتيب المتحدث",
          "نقاط الخطاب",
          "متحدث الرد؟",
          "نقاط الرد",
          "إجمالي نقاط المتحدث",
        ],
      ];
      tournament.rounds.forEach((r) => {
        r.matches.forEach((m) => {
          if (!m.completed) return;
          const sides: { mt: typeof m.team1; role: string }[] = [
            { mt: m.team1, role: "موالاة" },
            { mt: m.team2, role: "معارضة" },
          ];
          sides.forEach(({ mt, role }) => {
            const team = teamById(mt.teamId);
            mt.speakers.forEach((sp) => {
              const isReply = sp.speakerNumber === mt.replySpeakerNumber;
              const replyPts = isReply ? mt.replyScore : 0;
              speakerRows.push([
                r.roundNumber,
                m.roomNumber,
                team?.name ?? "",
                role,
                sp.name,
                sp.speakerNumber,
                sp.score,
                isReply ? "نعم" : "لا",
                isReply ? replyPts : "—",
                sp.score + replyPts,
              ]);
            });
          });
        });
      });
      const wsSpeakers = XLSX.utils.aoa_to_sheet(speakerRows);
      wsSpeakers["!cols"] = [
        { wch: 8 }, { wch: 8 }, { wch: 20 }, { wch: 10 }, { wch: 22 },
        { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, wsSpeakers, "نقاط المتحدثين");

      // Sheet 6: Speaker aggregate stats (totals, averages, best speaker counts)
      type SpAgg = {
        team: string;
        speaker: string;
        speeches: number;
        speechPoints: number;
        replies: number;
        replyPoints: number;
        bestSpeakerCount: number;
        bestScore: number;
      };
      const aggMap = new Map<string, SpAgg>();
      tournament.teams.forEach((t) => {
        t.speakerNames.forEach((sp) => {
          const key = `${t.id}::${sp}`;
          aggMap.set(key, {
            team: t.name, speaker: sp,
            speeches: 0, speechPoints: 0,
            replies: 0, replyPoints: 0,
            bestSpeakerCount: 0, bestScore: 0,
          });
        });
      });
      tournament.rounds.forEach((r) => {
        r.matches.forEach((m) => {
          if (!m.completed) return;
          [m.team1, m.team2].forEach((mt) => {
            mt.speakers.forEach((sp) => {
              const key = `${mt.teamId}::${sp.name}`;
              const agg = aggMap.get(key);
              if (!agg) return;
              agg.speeches += 1;
              agg.speechPoints += sp.score;
              if (sp.score > agg.bestScore) agg.bestScore = sp.score;
              if (sp.speakerNumber === mt.replySpeakerNumber) {
                agg.replies += 1;
                agg.replyPoints += mt.replyScore;
              }
            });
          });
          if (m.bestSpeaker) {
            const key = `${m.bestSpeaker.teamId}::${m.bestSpeaker.name}`;
            const agg = aggMap.get(key);
            if (agg) agg.bestSpeakerCount += 1;
          }
        });
      });
      const aggArr = Array.from(aggMap.values()).sort((a, b) => {
        const totalA = a.speechPoints + a.replyPoints;
        const totalB = b.speechPoints + b.replyPoints;
        return totalB - totalA;
      });
      const aggData: (string | number)[][] = [
        [
          "الترتيب", "الفريق", "المتحدث", "الخطب", "مجموع نقاط الخطب",
          "متوسط الخطاب", "ردود", "مجموع نقاط الرد", "أعلى نقطة",
          "مرات أفضل متحدث", "الإجمالي",
        ],
        ...aggArr.map((a, i) => [
          i + 1, a.team, a.speaker, a.speeches, a.speechPoints,
          a.speeches > 0 ? Math.round((a.speechPoints / a.speeches) * 10) / 10 : 0,
          a.replies, a.replyPoints, a.bestScore,
          a.bestSpeakerCount, a.speechPoints + a.replyPoints,
        ]),
      ];
      const wsAgg = XLSX.utils.aoa_to_sheet(aggData);
      wsAgg["!cols"] = [
        { wch: 8 }, { wch: 20 }, { wch: 22 }, { wch: 8 }, { wch: 16 },
        { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, wsAgg, "إحصاءات المتحدثين");

      // Sheet 7: Head-to-head pairings
      const h2hMap = new Map<string, { a: string; b: string; matches: number; aWins: number; bWins: number }>();
      tournament.rounds.forEach((r) => {
        r.matches.forEach((m) => {
          if (!m.completed) return;
          const ids = [m.team1.teamId, m.team2.teamId].sort();
          const key = ids.join("::");
          const a = teamById(ids[0])?.name ?? "";
          const b = teamById(ids[1])?.name ?? "";
          const rec = h2hMap.get(key) || { a, b, matches: 0, aWins: 0, bWins: 0 };
          rec.matches += 1;
          if (m.winnerId === ids[0]) rec.aWins += 1;
          else if (m.winnerId === ids[1]) rec.bWins += 1;
          h2hMap.set(key, rec);
        });
      });
      const h2hData: (string | number)[][] = [
        ["الفريق أ", "الفريق ب", "المواجهات", "فوز أ", "فوز ب", "تعادلات"],
        ...Array.from(h2hMap.values()).map((r) => [
          r.a, r.b, r.matches, r.aWins, r.bWins, r.matches - r.aWins - r.bWins,
        ]),
      ];
      const wsH2H = XLSX.utils.aoa_to_sheet(h2hData);
      wsH2H["!cols"] = [
        { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, wsH2H, "المواجهات المباشرة");

      // Sheet 8: Round-by-round summary
      const roundSummary: (string | number)[][] = [
        [
          "الجولة", "عدد المباريات", "مكتملة", "متوسط نقاط الموالاة",
          "متوسط نقاط المعارضة", "أعلى مجموع لمباراة", "أدنى مجموع لمباراة", "الحالة",
        ],
      ];
      tournament.rounds.forEach((r) => {
        const completed = r.matches.filter((m) => m.completed);
        const govAvg = completed.length
          ? Math.round(completed.reduce((s, m) => s + m.team1.totalScore, 0) / completed.length)
          : 0;
        const oppAvg = completed.length
          ? Math.round(completed.reduce((s, m) => s + m.team2.totalScore, 0) / completed.length)
          : 0;
        const sums = completed.map((m) => m.team1.totalScore + m.team2.totalScore);
        const maxSum = sums.length ? Math.max(...sums) : 0;
        const minSum = sums.length ? Math.min(...sums) : 0;
        roundSummary.push([
          r.roundNumber,
          r.matches.length,
          completed.length,
          govAvg, oppAvg,
          maxSum, minSum,
          r.completed ? "مكتملة" : "قيد التنفيذ",
        ]);
      });
      const wsRoundSummary = XLSX.utils.aoa_to_sheet(roundSummary);
      wsRoundSummary["!cols"] = [
        { wch: 8 }, { wch: 14 }, { wch: 10 }, { wch: 18 },
        { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, wsRoundSummary, "ملخص الجولات");

      const safeName = tournament.name.replace(/[\\/:*?"<>|]/g, "_");
      await XLSX.writeFile(wb, `${safeName}.xlsx`);
    } catch (e) {
      window.alert("حدث خطأ أثناء إنشاء ملف Excel");
    } finally {
      setExcelLoading(false);
    }
  };

  const openEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditTeamName(team.name);
    setEditTeamLogo(team.logoDataUrl);
    const count = (team.speakersPerTeam ?? 3) as 3 | 4;
    setEditSpeakersCount(String(count) as "3" | "4");
    const names = [...(team.speakerNames ?? [])];
    while (names.length < count) names.push("");
    setEditSpeakerNames(names.slice(0, count));
  };

  const handleEditCountChange = (val: string) => {
    setEditSpeakersCount(val as "3" | "4");
    const n = parseInt(val);
    setEditSpeakerNames((prev) => {
      const updated = [...prev];
      while (updated.length < n) updated.push("");
      return updated.slice(0, n);
    });
  };

  const handleSaveEditTeam = () => {
    if (!editingTeamId) return;
    if (!editTeamName.trim()) {
      window.alert("يجب إدخال اسم الفريق");
      return;
    }
    if (editSpeakerNames.some((n) => !n.trim())) {
      window.alert("يجب إدخال جميع أسماء المتحدثين");
      return;
    }
    const dup = tournament.teams.find(
      (t) =>
        t.id !== editingTeamId &&
        t.name.trim().toLowerCase() === editTeamName.trim().toLowerCase()
    );
    if (dup) {
      window.alert("اسم الفريق موجود مسبقاً، يجب أن تكون الأسماء مختلفة");
      return;
    }
    const orig = tournament.teams.find((t) => t.id === editingTeamId);
    if (!orig) return;
    const count = parseInt(editSpeakersCount) as 3 | 4;
    updateTeam(tournament.id, {
      ...orig,
      name: editTeamName.trim(),
      logoDataUrl: editTeamLogo,
      speakersPerTeam: count,
      speakerNames: editSpeakerNames.slice(0, count).map((n) => n.trim()),
    });
    setEditingTeamId(null);
  };

  const handleStartTournament = () => {
    if (tournament.teams.length < 2) {
      window.alert("يجب إضافة فريقين على الأقل");
      return;
    }
    if (tournament.teams.length % 2 !== 0) {
      window.alert("يجب إدخال عدد زوجي من الفرق");
      return;
    }
    startTournament(tournament.id);
  };

  const handleDeleteTournament = () => {
    deleteTournament(tournament.id);
    setLocation("/");
  };

  const handleFinishTournament = () => {
    finishTournament(tournament.id);
    setConfirmFinishOpen(false);
  };

  const handleReopenTournament = () => {
    reopenTournament(tournament.id);
    setConfirmReopenOpen(false);
  };

  const pendingCount =
    (tournament.pendingTeams?.length ?? 0) +
    (tournament.pendingJudges?.length ?? 0) +
    (tournament.pendingResults?.length ?? 0);

  const navGroups: SidebarGroup<TabType>[] = [
    {
      // Everything the organiser needs day to day — nothing else.
      title: "البطولة",
      tabs: [
        { key: "overview", label: "🏠 نظرة عامة", icon: LayoutDashboard },
        { key: "rounds", label: "⚔️ الجولات", icon: Layers },
        { key: "control", label: "🏛️ القاعات", icon: ListChecks },
        ...(can("manageTeams")
          ? ([{ key: "teams" as TabType, label: "👥 الفرق", icon: Users }] as const)
          : []),
        ...(can("manageJudges")
          ? ([{ key: "judges" as TabType, label: "👨‍⚖️ المحكمون", icon: UserCheck }] as const)
          : []),
        ...(can("viewScores")
          ? ([{ key: "standings" as TabType, label: "📊 النتائج", icon: BarChart2 }] as const)
          : []),
      ],
    },
    {
      title: "الإدارة",
      tabs: [{ key: "settings", label: "⚙️ إعدادات البطولة", icon: Settings }],
    },
    {
      // Secondary destinations, still one click away.
      title: "المزيد",
      collapsible: true,
      tabs: [
        { key: "links", label: "روابط التسجيل", icon: LinkIcon },
        ...(can("manageJudges")
          ? ([
              {
                key: "pending" as TabType,
                label: "الطلبات",
                icon: Inbox,
                badge: pendingCount,
              },
            ] as const)
          : []),
        ...(can("viewScores")
          ? ([
              { key: "resultsAdmin" as TabType, label: "إدارة النتائج", icon: ClipboardList, restricted: true },
              { key: "speakers" as TabType, label: "المتحدثين", icon: Mic, restricted: true },
            ] as const)
          : []),
        { key: "reports", label: "التقارير", icon: FileText },
        ...(can("viewAudit")
          ? ([{ key: "audit" as TabType, label: "سجل العمليات", icon: History }] as const)
          : []),
      ],
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ backgroundColor: BRAND.surface }}
    >
      <TournamentSidebar
        groups={navGroups}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabType)}
        onHome={() => setLocation("/")}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Page header */}
        <header className="px-4 md:px-6 pt-5 pb-3">
          <div className={`${LAYOUT.page} flex flex-wrap items-center gap-2.5 px-0 md:px-0`}>
            <div className="flex-1 min-w-0 text-right animate-in fade-in slide-in-from-top-2 duration-500">
              <h1
                className="text-xl md:text-2xl font-bold truncate leading-tight"
                style={{ color: BRAND.ink }}
                data-testid="text-tournament-name"
              >
                {tournament.name}
              </h1>
              <p
                className="text-xs mt-1 font-medium"
                style={{ color: BRAND.ink + "99" }}
                data-testid="text-tournament-meta"
              >
                {tournament.teams.length} فريق
                {tournament.started
                  ? ` · الجولة ${tournament.currentRound}${
                      tournament.totalRounds > 0
                        ? `/${tournament.totalRounds}`
                        : ""
                    }`
                  : ""}
                {tournament.finished ? " · منتهية" : ""}
              </p>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <AutoSaveIndicator />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
            <button
              onClick={() => setHideScores((v) => !v)}
              aria-label={hideScores ? "إظهار الدرجات" : "إخفاء الدرجات"}
              title={hideScores ? "إظهار الدرجات" : "إخفاء الدرجات"}
              aria-pressed={hideScores}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all active:scale-95 ${
                hideScores ? "text-white" : "bg-white hover:bg-[#7B2D8E]/[0.06]"
              }`}
              style={
                hideScores
                  ? { backgroundColor: BRAND.purple, borderColor: BRAND.purple }
                  : { borderColor: BRAND.border, color: BRAND.ink }
              }
              data-testid="button-toggle-hide-scores"
            >
              {hideScores ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => setViewingRound(currentRoundNum)}
              aria-label="تحديث البيانات"
              title="تحديث البيانات"
              className="w-10 h-10 rounded-xl border bg-white hover:bg-[#7B2D8E]/[0.06] flex items-center justify-center shrink-0 transition-all active:scale-95"
              style={{ borderColor: BRAND.border, color: BRAND.ink }}
              data-testid="button-refresh-page"
            >
              <span className="text-base leading-none">↻</span>
            </button>

            <RoleSwitcher />

            <button
              onClick={() => setLocation(`/present/${tournament.id}`)}
              className={`${BTN.base} ${BTN.secondary} h-10 px-4 shrink-0`}
              data-testid="button-presentation-mode"
            >
              <Projector className="w-4 h-4" />
              وضع العرض 🎥
            </button>

            {can("announceResults") && (
            <button
              onClick={() => setLocation(`/present/${tournament.id}`)}
              className={`${BTN.base} ${BTN.primary} h-10 px-5 shrink-0 shadow-lg`}
              style={BTN_PRIMARY_STYLE}
              data-testid="button-announce-results"
            >
              <Megaphone className="w-4 h-4" />
              📢 إعلان النتائج
            </button>
            )}
            </div>
          </div>
        </header>
        {tournament.finished && (
          <div className="px-4 md:px-6 pb-1">
            <div
              className="max-w-6xl mx-auto flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold"
              style={{
                backgroundColor: BRAND.gold + "1f",
                border: `1px solid ${BRAND.gold}59`,
                color: "#8A5A00",
              }}
              data-testid="banner-finished"
            >
              <Flag className="w-4 h-4" />
              <span>تم إنهاء البطولة — العرض للقراءة فقط (يمكن إعادة فتحها من الإعدادات)</span>
            </div>
          </div>
        )}
      {/* Content */}
      <div className={`flex-1 ${LAYOUT.page} pb-28 pt-2`}>
        {/* إدارة الجولات — always visible, never hidden in a menu */}
        {tournament.rounds.length > 0 &&
          activeTab !== "overview" &&
          activeTab !== "settings" &&
          activeTab !== "reports" && (
          <div className="mb-4">
            <RoundsManager
              tournament={tournament}
              viewedRound={currentRoundNum}
              onViewRound={(n) => {
                setViewingRound(n);
                setRoundNotification(false);
              }}
              onSetCurrent={(n) => {
                setCurrentRound(tournament.id, n);
                logAction(tournament.id, "تعيين الجولة الحالية", `الجولة ${n}`);
                toast({ title: `الجولة الحالية الآن: الجولة ${n}` });
              }}
              onSetPresented={(n) => {
                setPresentedRound(tournament.id, n);
                toast({ title: `وضع العرض يعرض الجولة ${n}` });
              }}
              onDraw={
                (currentRound?.matches.length ?? 0) === 0
                  ? () => generateRound(tournament.id)
                  : undefined
              }
            />
          </div>
        )}

        {activeTab === "overview" && (
          <OverviewDashboard
            tournament={tournament}
            displayRound={currentRoundNum}
            onSelectRound={(n) => {
              setViewingRound(n);
              setRoundNotification(false);
            }}
            roundControl={
              <RoundCommandCenter
                tournament={tournament}
                selectedRound={currentRoundNum}
                onStartNextRound={prepareAndStartNextRound}
                onStartSelectedRound={() => {
                  setCurrentRound(tournament.id, currentRoundNum);
                  logAction(tournament.id, "بدء الجولة", `الجولة ${currentRoundNum}`);
                  toast({ title: `الجولة الجارية الآن: الجولة ${currentRoundNum}` });
                }}
                canManage={can("manageJudges")}
              />
            }
            onFollowJudging={() => setActiveTab("control")}
            onRoomDetails={(match) =>
              setLocation(
                `/match/${tournament.id}/${tournament.currentRound}/${match.id}`
              )
            }
            onAnnounce={() => setLocation(`/present/${tournament.id}`)}
          />
        )}

        {activeTab === "control" && (
          <RoundControlCenter
            tournament={tournament}
            onOpenMatch={(match) =>
              setLocation(
                `/match/${tournament.id}/${tournament.currentRound}/${match.id}`
              )
            }
            onAnnounce={() => setLocation(`/present/${tournament.id}`)}
            onToggleLock={(locked) => {
              setRoundLocked(tournament.id, tournament.currentRound, locked);
              toast({
                title: locked ? "تم إغلاق الجولة" : "تم فتح الجولة للتعديل",
              });
            }}
            onRemindJudge={(judgeName, match) => {
              logAction(
                tournament.id,
                "إرسال تذكير لمحكم",
                `${judgeName} — ${match.roomLabel?.trim() || `القاعة ${match.roomNumber}`}`
              );
              toast({
                title: "تم إرسال التذكير",
                description: `تذكير للمحكم ${judgeName}`,
              });
            }}
          />
        )}

        {activeTab === "resultsAdmin" && (
          <ResultsAdmin
            tournament={tournament}
            onOpenMatch={(match) =>
              setLocation(
                `/match/${tournament.id}/${tournament.currentRound}/${match.id}`
              )
            }
          />
        )}

        {activeTab === "links" && (
          <RegistrationLinksCenter
            tournamentId={tournament.id}
            teamUrl={buildRegisterUrl({
              tournamentId: tournament.id,
              tournamentName: tournament.name,
            })}
            judgeUrl={buildJudgeRegisterUrl({
              tournamentId: tournament.id,
              tournamentName: tournament.name,
            })}
            onViewRegistrants={() => setActiveTab("pending")}
          />
        )}

        {activeTab === "reports" && (
          <ReportsPanel
            tournament={tournament}
            pdfLoading={pdfLoading}
            excelLoading={excelLoading}
            onExportPdf={handleExportPdf}
            onExportExcel={handleExportExcel}
            onPrint={() => window.print()}
            onOpenStats={() => setLocation(`/stats/${tournament.id}`)}
            onGoTo={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "settings" && (
          <SettingsPanel
            tournament={tournament}
            hideScores={hideScores}
            onToggleHideScores={() => setHideScores((v) => !v)}
            onOpenProtection={() => setProtectionOpen(true)}
            onToggleSemifinal={() => {
              const next = !tournament.semifinalEnabled;
              setEliminationMode(
                tournament.id,
                next,
                next ? true : (tournament.finalEnabled ?? false)
              );
            }}
            onToggleFinal={() => {
              const next = !tournament.finalEnabled;
              setEliminationMode(
                tournament.id,
                next ? (tournament.semifinalEnabled ?? false) : false,
                next
              );
            }}
            onFinish={() => setConfirmFinishOpen(true)}
            onReopen={() => setConfirmReopenOpen(true)}
            onDelete={() => setConfirmDeleteOpen(true)}
          />
        )}

        {activeTab === "audit" && <AuditLog entries={tournament.auditLog ?? []} />}

        {activeTab === "teams" && (
          <div>
            <TeamRequestsPanel
              acceptedCount={tournament.teams.length}
              pending={tournament.pendingTeams ?? []}
              onApprove={approvePendingTeam}
              onReject={(id) => removePendingTeam(tournament.id, id)}
            />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">
                الفرق
                <span
                  className="mr-2 px-2 py-0.5 rounded-md text-xs font-bold"
                  style={{ backgroundColor: PURPLE + "26", color: PURPLE }}
                >
                  {tournament.teams.length}
                </span>
              </h3>
              {!tournament.started && (
                <div className="flex items-center gap-2">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      style={{ backgroundColor: CYAN }}
                      className="text-white hover:opacity-90"
                      data-testid="button-add-team"
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة فريق
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة فريق جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>اسم الفريق</Label>
                        <Input
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="مثال: فريق السلطان"
                          data-testid="input-team-name"
                        />
                      </div>
                      <div>
                        <Label>عدد أعضاء الفريق</Label>
                        <Select
                          value={speakersPerTeam}
                          onValueChange={handleSpeakerCountChange}
                        >
                          <SelectTrigger data-testid="select-speakers-count">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 أعضاء</SelectItem>
                            <SelectItem value="4">4 أعضاء</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {speakerNames.map((name, i) => (
                        <div key={i}>
                          <Label>العضو {i + 1}</Label>
                          <Input
                            value={name}
                            onChange={(e) => {
                              const updated = [...speakerNames];
                              updated[i] = e.target.value;
                              setSpeakerNames(updated);
                            }}
                            placeholder={`اسم العضو ${i + 1}`}
                            data-testid={`input-speaker-name-${i}`}
                          />
                        </div>
                      ))}
                      <Button
                        className="w-full text-white"
                        style={{ backgroundColor: CYAN }}
                        onClick={handleAddTeam}
                        disabled={
                          !teamName.trim() ||
                          speakerNames.some((n) => !n.trim())
                        }
                        data-testid="button-submit-team"
                      >
                        إضافة
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              )}
            </div>

            {tournament.teams.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">لم تتم إضافة فرق بعد</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {tournament.teams.map((team, i) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-2xl p-4 shadow-sm"
                    style={{
                      borderRightWidth: 3,
                      borderRightColor: CYAN,
                      borderRightStyle: "solid",
                    }}
                    data-testid={`card-team-${team.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base truncate">{team.name}</h4>
                        {team.institution && (
                          <p className="text-xs mt-1 flex items-center gap-1 truncate" style={{ color: PURPLE }}>
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{team.institution}</span>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {team.speakersPerTeam} أعضاء
                          {(() => {
                            // The room the team debates in this round, if drawn.
                            const cur = tournament.rounds[tournament.currentRound - 1];
                            const m = cur?.matches.find(
                              (mm) =>
                                mm.team1.teamId === team.id ||
                                mm.team2.teamId === team.id
                            );
                            return m
                              ? ` · القاعة ${m.roomLabel?.trim() || m.roomNumber}`
                              : "";
                          })()}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {team.speakerNames.map((name, j) => (
                            <span
                              key={j}
                              className="text-[11px] px-2 py-0.5 rounded-md border border-border bg-muted/40"
                            >
                              {name || `متحدث ${j + 1}`}
                            </span>
                          ))}
                        </div>
                        {team.documents && team.documents.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {team.documents.map((doc, j) => (
                              <button
                                key={j}
                                onClick={() => setDocPreview(doc)}
                                className="text-[11px] px-2 py-1 rounded-md flex items-center gap-1 hover:opacity-80"
                                style={{ backgroundColor: PURPLE + "1a", color: PURPLE }}
                                data-testid={`doc-${team.id}-${j}`}
                              >
                                <FileBox className="w-3 h-3" />
                                <span className="truncate max-w-[110px]">{doc.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {tournament.started && (
                          <>
                            <div className="flex items-center gap-3 mt-3 text-xs">
                              <span className="font-semibold" style={{ color: CYAN }}>
                                {team.wins} فوز
                              </span>
                              <span
                                className="font-semibold"
                                style={{ color: PURPLE }}
                              >
                                {team.losses} خسارة
                              </span>
                              <span className="text-muted-foreground">
                                {team.totalPoints} نقطة
                              </span>
                            </div>
                            {(() => {
                              const breakdown = tournament.rounds
                                .map((r) => {
                                  const m = r.matches.find(
                                    (mm) =>
                                      mm.team1.teamId === team.id ||
                                      mm.team2.teamId === team.id
                                  );
                                  if (!m || !m.completed) return null;
                                  const mt =
                                    m.team1.teamId === team.id ? m.team1 : m.team2;
                                  const label =
                                    r.kind === "semifinal"
                                      ? "نصف"
                                      : r.kind === "final"
                                      ? "نهائي"
                                      : `ج${r.roundNumber}`;
                                  const won = m.winnerId === team.id;
                                  return { label, score: mt.totalScore, won };
                                })
                                .filter(Boolean) as {
                                label: string;
                                score: number;
                                won: boolean;
                              }[];
                              if (breakdown.length === 0) return null;
                              return (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {breakdown.map((b, k) => (
                                    <span
                                      key={k}
                                      className="text-[11px] px-2 py-0.5 rounded-md border"
                                      style={{
                                        borderColor: b.won ? CYAN : PURPLE,
                                        color: b.won ? CYAN : PURPLE,
                                        backgroundColor:
                                          (b.won ? CYAN : PURPLE) + "12",
                                      }}
                                      title={`${b.label}: ${hideScores ? HIDDEN_SCORE : b.score} نقطة`}
                                    >
                                      {b.label}: {hideScores ? HIDDEN_SCORE : b.score}
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditTeam(team)}
                          aria-label="تعديل الفريق"
                          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                          data-testid={`button-edit-team-${team.id}`}
                        >
                          <Pencil className="w-4 h-4" style={{ color: PURPLE }} />
                        </button>
                        {!tournament.started && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                aria-label="حذف الفريق"
                                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                                data-testid={`button-delete-team-${team.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف الفريق</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف "{team.name}"؟
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteTeam(tournament.id, team.id)
                                  }
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {!tournament.started && tournament.teams.length >= 2 && (
              <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-20">
                <div className="max-w-5xl mx-auto">
                  {tournament.teams.length % 2 !== 0 && (
                    <div
                      className="mb-2 text-xs text-center font-semibold p-2 rounded-lg"
                      style={{
                        backgroundColor: "#FF3B3015",
                        color: "#FF3B30",
                      }}
                      data-testid="warning-odd-teams"
                    >
                      يجب أن يكون عدد الفرق زوجياً
                    </div>
                  )}
                  <Button
                    onClick={handleStartTournament}
                    disabled={tournament.teams.length % 2 !== 0}
                    className="w-full h-12 text-white text-base font-bold rounded-2xl disabled:opacity-50"
                    style={{ backgroundColor: PURPLE }}
                    data-testid="button-start-tournament"
                  >
                    <Play className="w-5 h-5 ml-2" />
                    بدء البطولة
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "rounds" && (
          <>
            {!tournament.started && tournament.rounds.length === 0 ? (
              <div className="text-center py-16">
                <Layers className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">
                  ابدأ البطولة أولاً لإنشاء الجولات
                </p>
              </div>
            ) : tournament.rounds.length === 0 ? (
              <div className="text-center py-16">
                <Inbox className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground mb-4">لا توجد جولات بعد</p>
                <Button
                  onClick={() => generateRound(tournament.id)}
                  className="text-white"
                  style={{ backgroundColor: CYAN }}
                >
                  <Plus className="w-4 h-4 ml-1" />
                  إنشاء الجولة الأولى
                </Button>
              </div>
            ) : (
              <>
                {/* Round header */}
                <div className="mb-3">
                  <RoundBar
                    roundNumber={currentRoundNum}
                    completedCount={completedCount}
                    totalMatches={totalMatches}
                    allComplete={allRoomsComplete}
                    canPrev={prevRoundNum !== null}
                    canNext={nextRoundNum !== null}
                    liveRoundNumber={tournament.currentRound || undefined}
                    onSelectRound={(n) => {
                      setViewingRound(n);
                      setRoundNotification(false);
                    }}
                    onPrev={() => {
                      if (prevRoundNum === null) return;
                      setViewingRound(prevRoundNum);
                      setRoundNotification(false);
                    }}
                    onNext={() => {
                      if (nextRoundNum === null) return;
                      setViewingRound(nextRoundNum);
                      setRoundNotification(false);
                    }}
                  />
                </div>
                {/* Delete round — only if no data recorded yet */}
                {currentRound && completedCount === 0 && !currentRound.completed && !tournament.finished && (
                  <div className="flex justify-end mb-2">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"
                            title="خيارات الجولة"
                            aria-label="خيارات الجولة"
                            data-testid={`button-round-options-${currentRoundNum}`}
                          >
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-right">
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive font-semibold"
                              onSelect={(e) => e.preventDefault()}
                              data-testid={`button-delete-round-${currentRoundNum}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 ml-2" />
                              حذف الجولة {currentRoundNum}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف الجولة {currentRoundNum}</AlertDialogTitle>
                          <AlertDialogDescription>
                            سيتم حذف الجولة {currentRoundNum} ومباراياتها. هذا الإجراء لا يمكن التراجع عنه. لا يمكن الحذف إلا إذا لم يُسجَّل أي نتيجة.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => {
                              deleteRound(tournament.id, currentRoundNum);
                              if (currentRoundNum > 1) setViewingRound(currentRoundNum - 1);
                            }}
                          >
                            حذف الجولة
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                {/* Case / motion editor */}
                {currentRound && (
                  <div className="mb-3">
                    <CaseCard
                      roundNumber={currentRoundNum}
                      value={currentRound.caseText ?? ""}
                      readOnly={
                        tournament.finished ||
                        currentRoundNum !== tournament.currentRound
                      }
                      onChange={(v) =>
                        setRoundCase(tournament.id, currentRoundNum, v)
                      }
                    />
                  </div>
                )}

                {/* Notification banner */}
                <AnimatePresence>
                  {roundNotification &&
                    allRoomsComplete &&
                    currentRoundNum === tournament.currentRound &&
                    !tournament.finished && (
                      <motion.button
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onClick={() => setRoundNotification(false)}
                        className="w-full flex items-center gap-2 py-2.5 px-3 mb-3 rounded-xl"
                        style={{
                          backgroundColor: SUCCESS + "20",
                          border: `1px solid ${SUCCESS}40`,
                        }}
                      >
                        <CheckCircle
                          className="w-4 h-4"
                          style={{ color: SUCCESS }}
                        />
                        <span
                          className="flex-1 text-xs font-semibold text-right"
                          style={{ color: SUCCESS }}
                        >
                          اكتملت جميع القاعات! يمكنك الانتقال للجولة التالية
                        </span>
                        <X className="w-3.5 h-3.5" style={{ color: SUCCESS }} />
                      </motion.button>
                    )}
                </AnimatePresence>

                {/* Round actions */}
                {currentRoundNum === tournament.currentRound &&
                  !tournament.finished && (
                    <div
                      className="mb-3 rounded-2xl bg-white border shadow-sm p-2 flex flex-wrap items-center gap-2"
                      style={{ borderColor: BRAND.border }}
                      data-testid="round-actions"
                    >
                      <button
                        onClick={handleRoundJudgeLink}
                        disabled={linkLoading}
                        className={`${BTN.base} ${BTN.primary} flex-1 min-w-[150px]`}
                        style={BTN_PRIMARY_STYLE}
                        data-testid="button-judge-link"
                      >
                        {linkLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LinkIcon className="w-4 h-4" />
                        )}
                        {linkLoading ? "جارٍ الإنشاء..." : "رابط المحكمين"}
                      </button>

                      <button
                        onClick={() => {
                          setPasteResultsReport("");
                          setPasteResultsOpen(true);
                        }}
                        className={`${BTN.base} ${BTN.secondary} flex-1 min-w-[150px]`}
                        data-testid="button-paste-results"
                      >
                        <Download className="w-4 h-4" style={{ color: BRAND.blue }} />
                        لصق نتائج المحكم
                      </button>

                      <button
                        onClick={handleExportPdf}
                        disabled={pdfLoading}
                        className={`${BTN.base} ${BTN.secondary} flex-1 min-w-[150px]`}
                        data-testid="button-export-pdf"
                      >
                        {pdfLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" style={{ color: BRAND.purple }} />
                        )}
                        {pdfLoading ? "جارٍ التصدير..." : "تصدير PDF"}
                      </button>
                    </div>
                  )}
                {/* Match list */}
                {currentRound?.matches.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">لا توجد مباريات</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {currentRound?.matches.map((match) => (
                      <RoomCard
                        key={match.id}
                        match={match}
                        teamMap={teamMap}
                        hideScores={hideScores}
                        status={getRoomStatus({
                          match,
                          pending: tournament.pendingResults ?? [],
                          expectedJudges:
                            currentRound?.judgesPerRoom ??
                            tournament.settings?.judgesPerRoom ??
                            0,
                        })}
                        onOpen={() =>
                          setLocation(
                            `/match/${tournament.id}/${currentRoundNum}/${match.id}`
                          )
                        }
                        onEditRoom={() =>
                          setEditingRoom({
                            roundNumber: currentRoundNum,
                            match,
                            roomNumber: String(match.roomNumber),
                            roomLabel: match.roomLabel ?? "",
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "standings" && (
          <>
            {sortedTeams.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">لا توجد فرق</p>
              </div>
            ) : (
              <div>
                <div className="mb-3 flex items-start gap-2">
                  {tournament.rounds.length > 0 && (
                    <div className="flex-1 min-w-0">
                      <div
                        className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1"
                        data-testid="filter-standings-round"
                      >
                        <button
                          onClick={() => setStandingsRoundFilter(new Set())}
                          className="px-3 h-8 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0"
                          style={{
                            backgroundColor:
                              standingsRoundFilter.size === 0
                                ? CYAN
                                : CYAN + "1A",
                            color:
                              standingsRoundFilter.size === 0 ? "#fff" : CYAN,
                          }}
                          data-testid="filter-standings-all"
                        >
                          كل الجولات
                        </button>
                        {tournament.rounds.map((r) => {
                          const active = standingsRoundFilter.has(r.roundNumber);
                          return (
                            <button
                              key={r.roundNumber}
                              onClick={() =>
                                toggleStandingsRound(r.roundNumber)
                              }
                              aria-pressed={active}
                              className="px-3 h-8 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 inline-flex items-center gap-1"
                              style={{
                                backgroundColor: active ? PURPLE : PURPLE + "1A",
                                color: active ? "#fff" : PURPLE,
                              }}
                              data-testid={`filter-standings-round-${r.roundNumber}`}
                            >
                              {active && <span className="text-[10px]">✓</span>}
                              {standingsRoundLabel(r)}
                            </button>
                          );
                        })}
                      </div>
                      {standingsRoundFilter.size > 1 && (
                        <p
                          className="text-[11px] text-muted-foreground mt-1 px-1"
                          data-testid="text-standings-combined-hint"
                        >
                          النقاط مجموعة من {standingsRoundFilter.size} جولات
                          محددة
                        </p>
                      )}
                    </div>
                  )}
                  {displayStandings.length >= 2 && (
                    <button
                      onClick={() => {
                        setCompareTeamIds(new Set());
                        setCompareMode("teams");
                      }}
                      className="h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1 flex-shrink-0"
                      style={{
                        backgroundColor: GOLD + "1A",
                        color: GOLD,
                        border: `1px solid ${GOLD}66`,
                      }}
                      data-testid="button-compare-teams"
                      title="مقارنة الفرق"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      مقارنة
                    </button>
                  )}
                </div>
                {standingsRoundFilter.size > 0 && displayStandings.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      لا توجد نتائج للجولات المحددة بعد
                    </p>
                  </div>
                ) : (
                  displayStandings.map((team, i) => (
                    <StandingRow
                      key={team.id}
                      team={team}
                      rank={i + 1}
                      rounds={
                        standingsRoundFilter.size === 0
                          ? tournament.rounds
                          : tournament.rounds.filter((r) =>
                              standingsRoundFilter.has(r.roundNumber)
                            )
                      }
                      hideScores={hideScores}
                      onClick={() =>
                        setLocation(`/team-history/${tournament.id}/${team.id}`)
                      }
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "speakers" && (
          <>
            <button
              onClick={() => setLocation(`/leaderboard/${tournament.id}`)}
              className="w-full flex items-center gap-2 py-3 px-4 rounded-xl mb-4"
              style={{
                backgroundColor: CYAN + "14",
                border: `1px solid ${CYAN}40`,
              }}
            >
              <Award className="w-4 h-4" style={{ color: CYAN }} />
              <span className="flex-1 text-right text-sm font-semibold" style={{ color: CYAN }}>
                لوحة المتحدثين الكاملة
              </span>
              <ChevronLeft className="w-4 h-4" style={{ color: CYAN }} />
            </button>

            <div className="mb-3 flex items-start gap-2">
              {tournament.rounds.length > 0 && (
                <div className="flex-1 min-w-0">
                  <div
                    className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1"
                    data-testid="filter-speakers-round"
                  >
                    <button
                      onClick={() => setSpeakersRoundFilter(new Set())}
                      className="px-3 h-8 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0"
                      style={{
                        backgroundColor:
                          speakersRoundFilter.size === 0 ? CYAN : CYAN + "1A",
                        color:
                          speakersRoundFilter.size === 0 ? "#fff" : CYAN,
                      }}
                      data-testid="filter-speakers-all"
                    >
                      كل الجولات
                    </button>
                    {tournament.rounds.map((r) => {
                      const active = speakersRoundFilter.has(r.roundNumber);
                      return (
                        <button
                          key={r.roundNumber}
                          onClick={() => toggleSpeakersRound(r.roundNumber)}
                          aria-pressed={active}
                          className="px-3 h-8 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 inline-flex items-center gap-1"
                          style={{
                            backgroundColor: active ? PURPLE : PURPLE + "1A",
                            color: active ? "#fff" : PURPLE,
                          }}
                          data-testid={`filter-speakers-round-${r.roundNumber}`}
                        >
                          {active && <span className="text-[10px]">✓</span>}
                          {standingsRoundLabel(r)}
                        </button>
                      );
                    })}
                  </div>
                  {speakersRoundFilter.size > 1 && (
                    <p
                      className="text-[11px] text-muted-foreground mt-1 px-1"
                      data-testid="text-speakers-combined-hint"
                    >
                      النقاط مجموعة من {speakersRoundFilter.size} جولات محددة
                    </p>
                  )}
                </div>
              )}
              {allSpeakers.length >= 2 && (
                <button
                  onClick={() => {
                    setCompareSpeakerKeys(new Set());
                    setCompareMode("speakers");
                  }}
                  className="h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1 flex-shrink-0"
                  style={{
                    backgroundColor: GOLD + "1A",
                    color: GOLD,
                    border: `1px solid ${GOLD}66`,
                  }}
                  data-testid="button-compare-speakers"
                  title="مقارنة المتحدثين"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  مقارنة
                </button>
              )}
            </div>

            {allSpeakers.length === 0 ? (
              <div className="text-center py-16">
                <Mic className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">
                  لا توجد بيانات متحدثين بعد
                </p>
              </div>
            ) : (
              <div>
                {allSpeakers.slice(0, 20).map((sp, i) => (
                  <div
                    key={i}
                    className="flex items-center p-3 mb-2 bg-card rounded-xl shadow-sm"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center ml-3 text-sm font-bold"
                      style={{
                        backgroundColor:
                          i === 0
                            ? "#FFD700"
                            : i === 1
                            ? "#A8A9AD"
                            : i === 2
                            ? "#CD7F32"
                            : "var(--muted)",
                        color: i < 3 ? "#fff" : "var(--muted-foreground)",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{sp.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {sp.teamName}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-base font-bold" style={{ color: CYAN }}>
                        {hideScores ? HIDDEN_SCORE : sp.totalScore}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {sp.appearances} مباراة
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "judges" && (
          <>
          <RoundJudgeBoard
            tournament={tournament}
            selectedRound={currentRoundNum}
            onSelectRound={(n) => setViewingRound(n)}
            onAssignJudges={(matchId, assignment) =>
              setMatchJudges(tournament.id, currentRoundNum, matchId, assignment)
            }
            onAutoAssign={() => autoAssignJudges(tournament.id, currentRoundNum)}
            onJudgeLink={handleJudgeLink}
            canManage={can("manageJudges")}
          />
          <JudgesTab
            tournament={tournament}
            onApproveJudge={approvePendingJudge}
            onRejectJudge={(id) => removePendingJudge(tournament.id, id)}
            onToggleJudgeDisabled={(j) =>
              updateJudge(tournament.id, { ...j, disabled: !j.disabled })
            }
            onAddJudge={() => {
              setEditingJudge({
                id: crypto.randomUUID(),
                name: "",
                institution: "",
                experience: "",
                canChair: false,
                conflictTeamIds: [],
              });
              setJudgeEditOpen(true);
            }}
            onEditJudge={(j) => {
              setEditingJudge({ ...j });
              setJudgeEditOpen(true);
            }}
            onDeleteJudge={(id) => deleteJudge(tournament.id, id)}
            onShareRegisterLink={handleJudgeRegistrationLink}
            onPublicLink={handlePublicJudgesLink}
            onImportJudge={() => {
              setImportJudgeError("");
              setImportJudgeOpen(true);
            }}
            onSetJudgesPerRoom={(roundNum, n) =>
              setRoundJudgesPerRoom(tournament.id, roundNum, n)
            }
            onAutoAssign={(roundNum) =>
              autoAssignJudges(tournament.id, roundNum)
            }
            onEditAssignment={(roundNum, matchId) => {
              setAssigningRoundNum(roundNum);
              setAssigningMatchId(matchId);
              setJudgeAssignOpen(true);
            }}
          />
          </>
        )}

        {activeTab === "pending" && (
          <PendingTab
            tournament={tournament}
            onApproveTeam={approvePendingTeam}
            onRejectTeam={(id) => removePendingTeam(tournament.id, id)}
            onApproveJudge={approvePendingJudge}
            onRejectJudge={(id) => removePendingJudge(tournament.id, id)}
            onApproveResult={approvePendingResult}
            onRejectResult={(id) => removePendingResult(tournament.id, id)}
          />
        )}
      </div>

      {/* Bottom action bar - Advance round */}
      {activeTab === "rounds" &&
        tournament.started &&
        !tournament.finished &&
        canGenerateRound &&
        tournament.rounds.length > 0 &&
        currentRoundNum === tournament.currentRound && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-20">
            <div className="max-w-5xl mx-auto">
              <Button
                onClick={handleAdvanceRound}
                disabled={!isCurrentRoundComplete()}
                className="w-full h-12 text-white text-base font-bold rounded-2xl disabled:opacity-50"
                style={{
                  backgroundColor: isCurrentRoundComplete() ? PURPLE : "#999",
                }}
                data-testid="button-advance-round"
              >
                <SkipForward className="w-5 h-5 ml-2" />
                الجولة التالية
              </Button>
            </div>
          </div>
        )}

      {/* Bottom action bar - Semifinal */}
      {activeTab === "rounds" && canGenerateSemifinal && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-20">
          <div className="max-w-5xl mx-auto">
            <Button
              onClick={() => {
                if (!window.confirm("هل تريد بدء نصف النهائي؟ سيتم اختيار أفضل 4 فرق (1×4 و 2×3).")) return;
                generateSemifinal(tournament.id);
                setViewingRound(null);
              }}
              className="w-full h-12 text-white text-base font-bold rounded-2xl"
              style={{ backgroundColor: GOLD }}
              data-testid="button-start-semifinal"
            >
              بدء نصف النهائي
            </Button>
          </div>
        </div>
      )}

      {/* Bottom action bar - Advancement suggestion (rounds count reached) */}
      {activeTab === "rounds" && showAdvancementSuggestion && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-20"
          data-testid="card-advancement-suggestion"
        >
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Flag className="w-4 h-4" style={{ color: GOLD }} />
              <p className="text-sm font-bold">
                اكتملت جميع الجولات — ماذا تريد بعد ذلك؟
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {tournament.teams.length >= 4 && (
                <Button
                  onClick={() => {
                    if (
                      !window.confirm(
                        "هل تريد بدء نصف النهائي؟ سيتم اختيار أفضل 4 فرق (1×4 و 2×3)."
                      )
                    )
                      return;
                    generateSemifinal(tournament.id);
                    setViewingRound(null);
                  }}
                  className="w-full h-11 text-white text-sm font-bold rounded-xl"
                  style={{ backgroundColor: CYAN }}
                  data-testid="button-suggest-semifinal"
                >
                  <Award className="w-4 h-4 ml-2" />
                  بدء نصف النهائي
                </Button>
              )}
              {tournament.teams.length >= 2 && (
                <Button
                  onClick={() => {
                    if (
                      !window.confirm(
                        "هل تريد الانتقال مباشرة إلى النهائي؟ سيتم اختيار أفضل فريقين."
                      )
                    )
                      return;
                    generateFinal(tournament.id);
                    setViewingRound(null);
                  }}
                  className="w-full h-11 text-white text-sm font-bold rounded-xl"
                  style={{ backgroundColor: PURPLE }}
                  data-testid="button-suggest-final"
                >
                  <Award className="w-4 h-4 ml-2" />
                  الانتقال إلى النهائي
                </Button>
              )}
              <Button
                onClick={() => setConfirmFinishOpen(true)}
                variant="outline"
                className="w-full h-11 text-sm font-bold rounded-xl"
                style={{ borderColor: GOLD, color: GOLD }}
                data-testid="button-suggest-finish"
              >
                <Flag className="w-4 h-4 ml-2" />
                إنهاء البطولة
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom action bar - Final */}
      {activeTab === "rounds" && canGenerateFinal && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-20">
          <div className="max-w-5xl mx-auto">
            <Button
              onClick={() => {
                if (!window.confirm("هل تريد بدء النهائي؟")) return;
                generateFinal(tournament.id);
                setViewingRound(null);
              }}
              className="w-full h-12 text-white text-base font-bold rounded-2xl"
              style={{ backgroundColor: GOLD }}
              data-testid="button-start-final"
            >
              بدء النهائي
            </Button>
          </div>
        </div>
      )}

      {/* Bottom bar for finished tournament */}
      {tournament.finished && activeTab === "rounds" && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-20">
          <div className="max-w-5xl mx-auto flex gap-2">
            <Button
              onClick={() => setActiveTab("standings")}
              className="flex-1 h-12 text-white text-base font-bold rounded-2xl"
              style={{ backgroundColor: CYAN }}
            >
              <Award className="w-5 h-5 ml-2" />
              عرض الترتيب
            </Button>
            <Button
              onClick={handleExportPdf}
              disabled={pdfLoading}
              className="flex-1 h-12 text-white text-base font-bold rounded-2xl"
              style={{ backgroundColor: PURPLE }}
            >
              {pdfLoading ? (
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              ) : (
                <FileText className="w-5 h-5 ml-2" />
              )}
              {pdfLoading ? "..." : "تصدير PDF"}
            </Button>
          </div>
        </div>
      )}

      {/* Edit Team Dialog */}
      <Dialog
        open={editingTeamId !== null}
        onOpenChange={(open) => !open && setEditingTeamId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الفريق</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>اسم الفريق</Label>
              <Input
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
                placeholder="اسم الفريق"
                data-testid="input-edit-team-name"
              />
            </div>
            <ImageUploadField
              label="شعار الفريق"
              value={editTeamLogo}
              onChange={setEditTeamLogo}
              testId="input-team-logo-file"
            />
            <div>
              <Label>عدد أعضاء الفريق</Label>
              <Select
                value={editSpeakersCount}
                onValueChange={handleEditCountChange}
              >
                <SelectTrigger data-testid="select-edit-speakers-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 أعضاء</SelectItem>
                  <SelectItem value="4">4 أعضاء</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editSpeakerNames.map((name, i) => (
              <div key={i}>
                <Label>العضو {i + 1}</Label>
                <Input
                  value={name}
                  onChange={(e) => {
                    const updated = [...editSpeakerNames];
                    updated[i] = e.target.value;
                    setEditSpeakerNames(updated);
                  }}
                  placeholder={`اسم العضو ${i + 1}`}
                  data-testid={`input-edit-speaker-name-${i}`}
                />
              </div>
            ))}
            {tournament.started && (
              <div
                className="text-xs p-2 rounded-lg"
                style={{
                  backgroundColor: CYAN + "15",
                  color: CYAN,
                }}
              >
                التعديلات ستُطبّق على المباريات غير المكتملة فقط
              </div>
            )}
            <Button
              className="w-full text-white"
              style={{ backgroundColor: PURPLE }}
              onClick={handleSaveEditTeam}
              data-testid="button-save-edit-team"
            >
              حفظ التغييرات
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Finish Tournament Confirmation */}
      <AlertDialog open={confirmFinishOpen} onOpenChange={setConfirmFinishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إنهاء البطولة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إنهاء بطولة "{tournament.name}"؟ ستظل جميع
              المعلومات والنتائج والإحصائيات متاحة للعرض والتصدير. يمكنك إعادة
              فتح البطولة لاحقاً من قائمة الإعدادات إذا رغبت في ذلك.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinishTournament}
              data-testid="button-confirm-finish-tournament"
            >
              إنهاء البطولة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reopen Tournament Confirmation */}
      <AlertDialog open={confirmReopenOpen} onOpenChange={setConfirmReopenOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إعادة فتح البطولة</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إعادة فتح البطولة لإمكانية إجراء تعديلات إضافية. هل تريد
              المتابعة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReopenTournament}
              data-testid="button-confirm-reopen-tournament"
            >
              إعادة الفتح
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Tournament Confirmation */}
      <AlertDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف البطولة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف "{tournament.name}"؟ سيتم حذف جميع
              الجولات والمباريات والنتائج. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTournament}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-tournament"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share link dialog — link + QR + labelled actions */}
      <ShareLinkDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title={shareTitle}
        url={shareUrl}
        description={
          shareTitle.includes("الإدارة")
            ? "يمنح هذا الرابط من يفتحه نسخة كاملة من البطولة وصلاحية تحريرها على جهازه."
            : shareTitle.includes("المحكمين")
              ? "أرسل هذا الرابط للمحكمين لإدخال نتائج قاعاتهم، أو اعرض رمز QR ليمسحوه من هواتفهم."
              : "أرسل هذا الرابط للفرق ليقوموا بتعبئة بياناتهم وإرفاق المستندات."
        }
      />

      {/* Import team registration code */}
      <Dialog open={importTeamOpen} onOpenChange={setImportTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استلام تسجيل فريق</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">
              الصق رمز التسجيل الذي أرسله الفريق ليتم إضافته مع جميع
              بياناته ومستنداته.
            </p>
            <textarea
              value={importTeamCode}
              onChange={(e) => {
                setImportTeamCode(e.target.value);
                setImportTeamError("");
              }}
              dir="ltr"
              placeholder="ألصق رمز التسجيل هنا..."
              className="w-full p-3 rounded-xl bg-muted text-xs font-mono outline-none resize-none"
              style={{ minHeight: 120, wordBreak: "break-all" }}
              data-testid="input-team-code"
            />
            {importTeamError && (
              <p className="text-sm text-destructive">{importTeamError}</p>
            )}
            <Button
              onClick={handleImportTeam}
              className="w-full text-white"
              style={{ backgroundColor: CYAN }}
              data-testid="button-confirm-import-team"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة الفريق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paste judge results */}
      <Dialog open={pasteResultsOpen} onOpenChange={setPasteResultsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>لصق نتائج المحكم</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">
              الصق رمز نتيجة من المحكم — أو عدة رموز، كل رمز في سطر مستقل — وسيتم
              تطبيقها تلقائياً على المباريات المطابقة.
            </p>
            <textarea
              value={pasteResultsText}
              onChange={(e) => setPasteResultsText(e.target.value)}
              dir="ltr"
              placeholder="ALC..."
              className="w-full p-3 rounded-xl bg-muted text-xs font-mono outline-none resize-none border border-border"
              style={{ minHeight: 140, wordBreak: "break-all" }}
              data-testid="textarea-paste-results"
            />
            {pasteResultsReport && (
              <pre
                dir="rtl"
                className="w-full p-3 rounded-xl bg-muted text-xs whitespace-pre-wrap"
                style={{ maxHeight: 180, overflowY: "auto" }}
                data-testid="text-paste-results-report"
              >
                {pasteResultsReport}
              </pre>
            )}
            <Button
              onClick={handlePasteResults}
              className="w-full text-white"
              style={{ backgroundColor: SUCCESS }}
              data-testid="button-confirm-paste-results"
            >
              <Download className="w-4 h-4 ml-2" />
              تطبيق النتائج
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document preview */}
      <Dialog
        open={!!editingRoom}
        onOpenChange={(o) => !o && setEditingRoom(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تعديل القاعة</DialogTitle>
          </DialogHeader>
          {editingRoom && (
            <div className="space-y-3 mt-2">
              <div>
                <Label htmlFor="room-number">رقم القاعة</Label>
                <Input
                  id="room-number"
                  type="number"
                  min="1"
                  value={editingRoom.roomNumber}
                  onChange={(e) =>
                    setEditingRoom((s) =>
                      s ? { ...s, roomNumber: e.target.value } : s
                    )
                  }
                  data-testid="input-room-number"
                />
              </div>
              <div>
                <Label htmlFor="room-label">اسم القاعة (اختياري)</Label>
                <Input
                  id="room-label"
                  value={editingRoom.roomLabel}
                  placeholder="مثال: قاعة الشيخ خلفان"
                  onChange={(e) =>
                    setEditingRoom((s) =>
                      s ? { ...s, roomLabel: e.target.value } : s
                    )
                  }
                  data-testid="input-room-label"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  إذا حُدد اسم، سيظهر بدلاً من «القاعة X».
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingRoom(null)}
                  data-testid="button-cancel-room"
                >
                  إلغاء
                </Button>
                <Button
                  className="flex-1 text-white"
                  style={{ backgroundColor: PURPLE }}
                  onClick={() => {
                    if (!editingRoom) return;
                    const num = parseInt(editingRoom.roomNumber, 10);
                    const newRoomNum = Number.isFinite(num) && num > 0 ? num : undefined;
                    const newLabel = editingRoom.roomLabel;
                    const targetRoundNum = editingRoom.roundNumber;
                    const targetMatchId = editingRoom.match.id;
                    setMatchRoom(
                      tournament.id,
                      targetRoundNum,
                      targetMatchId,
                      {
                        roomNumber: newRoomNum,
                        roomLabel: newLabel,
                      }
                    );
                    const targetRound = tournament.rounds.find(
                      (rr) => rr.roundNumber === targetRoundNum,
                    );
                    if (targetRound) {
                      const updatedMatches = targetRound.matches.map((mm) =>
                        mm.id === targetMatchId
                          ? { ...mm, roomNumber: newRoomNum ?? mm.roomNumber, roomLabel: newLabel }
                          : mm,
                      );
                      const rooms: RoomInfo[] = updatedMatches.map((m) => {
                        const gov = tournament.teams.find((t) => t.id === m.team1.teamId);
                        const opp = tournament.teams.find((t) => t.id === m.team2.teamId);
                        return {
                          roomNumber: m.roomNumber,
                          roomLabel: m.roomLabel,
                          matchId: m.id,
                          govTeamName: gov?.name ?? "الموالاة",
                          oppTeamName: opp?.name ?? "المعارضة",
                          govTeamId: m.team1.teamId,
                          govSpeakerNames: gov?.speakerNames ?? [],
                          oppSpeakerNames: opp?.speakerNames ?? [],
                          govSpeakersCount: gov?.speakersPerTeam ?? 3,
                          oppSpeakersCount: opp?.speakersPerTeam ?? 3,
                        };
                      });
                      const roundData: RoundData = {
                        tournamentId: tournament.id,
                        tournamentName: tournament.name,
                        roundNumber: targetRoundNum,
                        rooms,
                      };
                      void syncRoundSessionsForRound(
                        tournament.id,
                        targetRoundNum,
                        roundData,
                      ).catch(() => {});
                    }
                    setEditingRoom(null);
                  }}
                  data-testid="button-save-room"
                >
                  حفظ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!docPreview} onOpenChange={(o) => !o && setDocPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate">{docPreview?.name}</DialogTitle>
          </DialogHeader>
          {docPreview && (
            <div className="mt-2 max-h-[70vh] overflow-auto">
              {docPreview.type.startsWith("image/") ? (
                <img
                  src={docPreview.dataUrl}
                  alt={docPreview.name}
                  className="w-full h-auto rounded-xl"
                />
              ) : docPreview.type === "application/pdf" ? (
                <iframe
                  src={docPreview.dataUrl}
                  title={docPreview.name}
                  className="w-full h-[60vh] rounded-xl border border-border"
                />
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  لا يمكن معاينة هذا النوع من الملفات.
                </p>
              )}
              <a
                href={docPreview.dataUrl}
                download={docPreview.name}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl text-white text-sm font-bold"
                style={{ backgroundColor: PURPLE }}
              >
                <Download className="w-4 h-4" />
                تنزيل الملف
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Judge Code */}
      <Dialog open={importJudgeOpen} onOpenChange={setImportJudgeOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>لصق رمز تسجيل محكم</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              value={importJudgeCode}
              onChange={(e) => setImportJudgeCode(e.target.value)}
              placeholder="الصق الرمز هنا..."
              className="w-full h-32 p-3 rounded-lg border bg-background text-sm font-mono"
              dir="ltr"
              data-testid="textarea-import-judge"
            />
            {importJudgeError && (
              <p className="text-xs text-destructive">{importJudgeError}</p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleImportJudge}
                className="flex-1"
                style={{ backgroundColor: PURPLE, color: "#fff" }}
                data-testid="button-confirm-import-judge"
              >
                إضافة إلى الطلبات المعلقة
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportJudgeOpen(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit / Add Judge */}
      <Dialog open={judgeEditOpen} onOpenChange={setJudgeEditOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingJudge &&
              (tournament.judges ?? []).some((j) => j.id === editingJudge.id)
                ? "تعديل محكم"
                : "إضافة محكم"}
            </DialogTitle>
          </DialogHeader>
          {editingJudge && (
            <div className="space-y-3">
              <div>
                <Label>الاسم *</Label>
                <Input
                  value={editingJudge.name}
                  onChange={(e) =>
                    setEditingJudge({ ...editingJudge, name: e.target.value })
                  }
                  data-testid="input-judge-name"
                />
              </div>
              <ImageUploadField
                label="صورة المحكم"
                value={editingJudge.photoDataUrl}
                onChange={(dataUrl) =>
                  setEditingJudge({ ...editingJudge, photoDataUrl: dataUrl })
                }
                testId="input-judge-photo-file"
              />
              <div>
                <Label>المؤسسة</Label>
                <Input
                  value={editingJudge.institution ?? ""}
                  onChange={(e) =>
                    setEditingJudge({
                      ...editingJudge,
                      institution: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>الخبرة</Label>
                <Input
                  value={editingJudge.experience ?? ""}
                  onChange={(e) =>
                    setEditingJudge({
                      ...editingJudge,
                      experience: e.target.value,
                    })
                  }
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingJudge.canChair}
                  onChange={(e) =>
                    setEditingJudge({
                      ...editingJudge,
                      canChair: e.target.checked,
                    })
                  }
                  data-testid="checkbox-can-chair"
                />
                <span className="text-sm">يمكنه رئاسة الجلسة</span>
              </label>
              <div>
                <Label className="mb-2 block">تعارض مع الفرق</Label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {tournament.teams.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      لا توجد فرق
                    </p>
                  )}
                  {tournament.teams.map((team) => {
                    const selected = editingJudge.conflictTeamIds.includes(
                      team.id
                    );
                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() =>
                          setEditingJudge({
                            ...editingJudge,
                            conflictTeamIds: selected
                              ? editingJudge.conflictTeamIds.filter(
                                  (id) => id !== team.id
                                )
                              : [...editingJudge.conflictTeamIds, team.id],
                          })
                        }
                        className="text-xs px-2 py-1 rounded-full border transition-colors"
                        style={{
                          backgroundColor: selected
                            ? "#FF3B30" + "1f"
                            : "transparent",
                          borderColor: selected ? "#FF3B30" : "var(--border)",
                          color: selected ? "#FF3B30" : "var(--foreground)",
                        }}
                      >
                        {team.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveJudge}
                  className="flex-1"
                  style={{ backgroundColor: CYAN, color: "#fff" }}
                  data-testid="button-save-judge"
                >
                  حفظ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setJudgeEditOpen(false)}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Per-match Judge Assignment */}
      <Dialog open={judgeAssignOpen} onOpenChange={setJudgeAssignOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعيين محكمي المباراة</DialogTitle>
          </DialogHeader>
          {(() => {
            if (assigningRoundNum === null || !assigningMatchId) return null;
            const round = tournament.rounds.find(
              (r) => r.roundNumber === assigningRoundNum
            );
            const match = round?.matches.find(
              (m) => m.id === assigningMatchId
            );
            if (!match) return null;
            const judges = tournament.judges ?? [];
            const team1Name = teamMap.get(match.team1.teamId)?.name ?? "—";
            const team2Name = teamMap.get(match.team2.teamId)?.name ?? "—";
            const conflictIds = new Set(
              judges
                .filter(
                  (j) =>
                    j.conflictTeamIds.includes(match.team1.teamId) ||
                    j.conflictTeamIds.includes(match.team2.teamId)
                )
                .map((j) => j.id)
            );
            const current = match.judgeAssignment ?? {
              chairJudgeId: undefined,
              panelistJudgeIds: [] as string[],
            };
            const otherChairsByMatch = new Map<string, string>();
            round?.matches.forEach((m) => {
              if (m.id !== match.id && m.judgeAssignment?.chairJudgeId) {
                otherChairsByMatch.set(
                  m.judgeAssignment.chairJudgeId,
                  String(m.roomNumber)
                );
              }
            });
            return (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  {match.roomLabel?.trim() || `القاعة ${match.roomNumber}`} • {team1Name} ضد {team2Name}
                </div>
                <div>
                  <Label className="mb-1 block">رئيس الجلسة</Label>
                  <Select
                    value={current.chairJudgeId ?? "__none__"}
                    onValueChange={(v) => {
                      const newChair = v === "__none__" ? undefined : v;
                      const newPanel = current.panelistJudgeIds.filter(
                        (id) => id !== newChair
                      );
                      setMatchJudges(
                        tournament.id,
                        assigningRoundNum,
                        match.id,
                        {
                          chairJudgeId: newChair,
                          panelistJudgeIds: newPanel,
                        }
                      );
                    }}
                  >
                    <SelectTrigger data-testid="select-chair">
                      <SelectValue placeholder="اختر رئيس الجلسة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— بدون رئيس —</SelectItem>
                      {judges
                        .filter((j) => j.canChair)
                        .map((j) => {
                          const conflict = conflictIds.has(j.id);
                          const otherRoom = otherChairsByMatch.get(j.id);
                          return (
                            <SelectItem key={j.id} value={j.id}>
                              {j.name}
                              {conflict ? " (تعارض)" : ""}
                              {otherRoom
                                ? ` (يرأس قاعة ${otherRoom})`
                                : ""}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">المحكمون المساعدون</Label>
                  <div className="flex flex-col gap-1 max-h-56 overflow-y-auto border rounded-lg p-2">
                    {judges.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        لا يوجد محكمون
                      </p>
                    )}
                    {judges
                      .filter((j) => j.id !== current.chairJudgeId)
                      .map((j) => {
                        const checked = current.panelistJudgeIds.includes(
                          j.id
                        );
                        const conflict = conflictIds.has(j.id);
                        return (
                          <label
                            key={j.id}
                            className="flex items-center gap-2 text-sm py-1 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...current.panelistJudgeIds, j.id]
                                  : current.panelistJudgeIds.filter(
                                      (id) => id !== j.id
                                    );
                                setMatchJudges(
                                  tournament.id,
                                  assigningRoundNum,
                                  match.id,
                                  {
                                    chairJudgeId: current.chairJudgeId,
                                    panelistJudgeIds: next,
                                  }
                                );
                              }}
                            />
                            <span className={conflict ? "text-destructive" : ""}>
                              {j.name}
                              {conflict ? " (تعارض)" : ""}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setMatchJudges(
                        tournament.id,
                        assigningRoundNum,
                        match.id,
                        { chairJudgeId: undefined, panelistJudgeIds: [] }
                      )
                    }
                  >
                    مسح
                  </Button>
                  <Button
                    className="flex-1"
                    style={{ backgroundColor: CYAN, color: "#fff" }}
                    onClick={() => setJudgeAssignOpen(false)}
                  >
                    تم
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Compare dialog: side-by-side comparison of teams or speakers */}
      <Dialog
        open={compareMode !== null}
        onOpenChange={(o) => {
          if (!o) setCompareMode(null);
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[85vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <GitCompare className="w-5 h-5" style={{ color: GOLD }} />
              {compareMode === "teams"
                ? "مقارنة الفرق"
                : "مقارنة المتحدثين"}
            </DialogTitle>
          </DialogHeader>

          {compareMode === "teams" &&
            (() => {
              const selected = displayStandings.filter((t) =>
                compareTeamIds.has(t.id)
              );
              const toggle = (id: string) => {
                setCompareTeamIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else if (next.size < 4) next.add(id);
                  return next;
                });
              };
              return (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground text-right">
                    اختر من 2 إلى 4 فرق للمقارنة
                    {standingsRoundFilter.size > 0 && (
                      <span style={{ color: PURPLE }}>
                        {" "}
                        (الأرقام محسوبة من{" "}
                        {standingsRoundFilter.size === 1
                          ? "الجولة المحددة"
                          : `${standingsRoundFilter.size} جولات`}
                        )
                      </span>
                    )}
                  </p>
                  <div
                    className="max-h-48 overflow-y-auto border rounded-xl p-2 space-y-1"
                    data-testid="compare-teams-picker"
                  >
                    {displayStandings.map((t) => {
                      const checked = compareTeamIds.has(t.id);
                      const disabled = !checked && compareTeamIds.size >= 4;
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggle(t.id)}
                          disabled={disabled}
                          className="w-full flex items-center gap-2 p-2 rounded-lg text-right disabled:opacity-40"
                          style={{
                            backgroundColor: checked
                              ? GOLD + "1A"
                              : "transparent",
                            border: `1px solid ${
                              checked ? GOLD : "var(--border)"
                            }`,
                          }}
                          data-testid={`compare-team-option-${t.id}`}
                        >
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: checked
                                ? GOLD
                                : "transparent",
                              border: `1.5px solid ${
                                checked ? GOLD : "var(--border)"
                              }`,
                            }}
                          >
                            {checked && (
                              <Check
                                className="w-3 h-3"
                                style={{ color: "#fff" }}
                              />
                            )}
                          </div>
                          <span className="flex-1 text-sm font-semibold">
                            {t.name}
                          </span>
                          <span
                            className="text-xs font-bold"
                            style={{ color: SUCCESS }}
                          >
                            {t.wins}ف
                          </span>
                          <span
                            className="text-xs font-bold"
                            style={{ color: CYAN }}
                          >
                            {hideScores ? HIDDEN_SCORE : t.totalPoints}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selected.length < 2 ? (
                    <p className="text-center text-sm text-muted-foreground py-6">
                      اختر فريقًا آخر على الأقل لبدء المقارنة
                    </p>
                  ) : (
                    <div
                      className="overflow-x-auto -mx-2 px-2"
                      data-testid="compare-teams-result"
                    >
                      <div
                        className="grid gap-2"
                        style={{
                          gridTemplateColumns: `auto repeat(${selected.length}, minmax(110px, 1fr))`,
                        }}
                      >
                        <div></div>
                        {selected.map((t) => (
                          <div
                            key={t.id}
                            className="text-center p-2 rounded-t-lg"
                            style={{
                              backgroundColor: PURPLE + "14",
                              borderBottom: `2px solid ${PURPLE}`,
                            }}
                          >
                            <div
                              className="text-sm font-bold"
                              style={{ color: PURPLE }}
                            >
                              {t.name}
                            </div>
                          </div>
                        ))}

                        {[
                          {
                            label: "الفوز",
                            color: SUCCESS,
                            value: (t: (typeof selected)[number]) =>
                              String(t.wins),
                          },
                          {
                            label: "الخسارة",
                            color: "#F44336",
                            value: (t: (typeof selected)[number]) =>
                              String(t.losses),
                          },
                          {
                            label: "المباريات",
                            color: PURPLE,
                            value: (t: (typeof selected)[number]) =>
                              String(t.matchesPlayed),
                          },
                          {
                            label: "النقاط",
                            color: CYAN,
                            value: (t: (typeof selected)[number]) =>
                              hideScores
                                ? HIDDEN_SCORE
                                : String(t.totalPoints),
                          },
                          {
                            label: "متوسط النقاط",
                            color: GOLD,
                            value: (t: (typeof selected)[number]) =>
                              hideScores
                                ? HIDDEN_SCORE
                                : t.matchesPlayed > 0
                                ? (t.totalPoints / t.matchesPlayed).toFixed(1)
                                : "—",
                          },
                        ].map((row) => {
                          const nums = selected.map((t) => {
                            if (row.label === "متوسط النقاط")
                              return t.matchesPlayed > 0
                                ? t.totalPoints / t.matchesPlayed
                                : -Infinity;
                            if (row.label === "النقاط") return t.totalPoints;
                            if (row.label === "الفوز") return t.wins;
                            if (row.label === "الخسارة") return -t.losses; // fewer losses wins
                            return t.matchesPlayed;
                          });
                          const best = Math.max(...nums);
                          return (
                            <Fragment key={row.label}>
                              <div className="text-xs font-semibold text-muted-foreground py-2 px-2 self-center">
                                {row.label}
                              </div>
                              {selected.map((t, idx) => {
                                const isBest =
                                  nums[idx] === best && selected.length > 1;
                                return (
                                  <div
                                    key={t.id}
                                    className="text-center py-2 px-1 rounded-lg text-sm font-bold"
                                    style={{
                                      backgroundColor: isBest
                                        ? row.color + "1A"
                                        : "transparent",
                                      color: isBest
                                        ? row.color
                                        : "var(--foreground)",
                                      border: isBest
                                        ? `1px solid ${row.color}40`
                                        : "1px solid transparent",
                                    }}
                                  >
                                    {row.value(t)}
                                  </div>
                                );
                              })}
                            </Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

          {compareMode === "speakers" &&
            (() => {
              const selected = allSpeakers.filter((s) =>
                compareSpeakerKeys.has(s.key)
              );
              const toggle = (key: string) => {
                setCompareSpeakerKeys((prev) => {
                  const next = new Set(prev);
                  if (next.has(key)) next.delete(key);
                  else if (next.size < 4) next.add(key);
                  return next;
                });
              };
              return (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground text-right">
                    اختر من 2 إلى 4 متحدثين للمقارنة
                    {speakersRoundFilter.size > 0 && (
                      <span style={{ color: PURPLE }}>
                        {" "}
                        (الأرقام محسوبة من{" "}
                        {speakersRoundFilter.size === 1
                          ? "الجولة المحددة"
                          : `${speakersRoundFilter.size} جولات`}
                        )
                      </span>
                    )}
                  </p>
                  <div
                    className="max-h-48 overflow-y-auto border rounded-xl p-2 space-y-1"
                    data-testid="compare-speakers-picker"
                  >
                    {allSpeakers.map((sp) => {
                      const checked = compareSpeakerKeys.has(sp.key);
                      const disabled =
                        !checked && compareSpeakerKeys.size >= 4;
                      return (
                        <button
                          key={sp.key}
                          onClick={() => toggle(sp.key)}
                          disabled={disabled}
                          className="w-full flex items-center gap-2 p-2 rounded-lg text-right disabled:opacity-40"
                          style={{
                            backgroundColor: checked
                              ? GOLD + "1A"
                              : "transparent",
                            border: `1px solid ${
                              checked ? GOLD : "var(--border)"
                            }`,
                          }}
                          data-testid={`compare-speaker-option-${sp.key}`}
                        >
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: checked
                                ? GOLD
                                : "transparent",
                              border: `1.5px solid ${
                                checked ? GOLD : "var(--border)"
                              }`,
                            }}
                          >
                            {checked && (
                              <Check
                                className="w-3 h-3"
                                style={{ color: "#fff" }}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <div className="text-sm font-semibold truncate">
                              {sp.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {sp.teamName}
                            </div>
                          </div>
                          <span
                            className="text-xs font-bold"
                            style={{ color: CYAN }}
                          >
                            {hideScores ? HIDDEN_SCORE : sp.totalScore}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selected.length < 2 ? (
                    <p className="text-center text-sm text-muted-foreground py-6">
                      اختر متحدثًا آخر على الأقل لبدء المقارنة
                    </p>
                  ) : (
                    <div
                      className="overflow-x-auto -mx-2 px-2"
                      data-testid="compare-speakers-result"
                    >
                      <div
                        className="grid gap-2"
                        style={{
                          gridTemplateColumns: `auto repeat(${selected.length}, minmax(110px, 1fr))`,
                        }}
                      >
                        <div></div>
                        {selected.map((sp) => (
                          <div
                            key={sp.key}
                            className="text-center p-2 rounded-t-lg"
                            style={{
                              backgroundColor: PURPLE + "14",
                              borderBottom: `2px solid ${PURPLE}`,
                            }}
                          >
                            <div
                              className="text-sm font-bold truncate"
                              style={{ color: PURPLE }}
                            >
                              {sp.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {sp.teamName}
                            </div>
                          </div>
                        ))}

                        {[
                          {
                            label: "إجمالي النقاط",
                            color: CYAN,
                            value: (s: (typeof selected)[number]) =>
                              hideScores
                                ? HIDDEN_SCORE
                                : String(s.totalScore),
                            num: (s: (typeof selected)[number]) => s.totalScore,
                          },
                          {
                            label: "المباريات",
                            color: PURPLE,
                            value: (s: (typeof selected)[number]) =>
                              String(s.appearances),
                            num: (s: (typeof selected)[number]) =>
                              s.appearances,
                          },
                          {
                            label: "متوسط النقاط",
                            color: GOLD,
                            value: (s: (typeof selected)[number]) =>
                              hideScores
                                ? HIDDEN_SCORE
                                : s.appearances > 0
                                ? (s.totalScore / s.appearances).toFixed(1)
                                : "—",
                            num: (s: (typeof selected)[number]) =>
                              s.appearances > 0
                                ? s.totalScore / s.appearances
                                : -Infinity,
                          },
                        ].map((row) => {
                          const nums = selected.map(row.num);
                          const best = Math.max(...nums);
                          return (
                            <Fragment key={row.label}>
                              <div className="text-xs font-semibold text-muted-foreground py-2 px-2 self-center">
                                {row.label}
                              </div>
                              {selected.map((sp, idx) => {
                                const isBest =
                                  nums[idx] === best && selected.length > 1;
                                return (
                                  <div
                                    key={sp.key}
                                    className="text-center py-2 px-1 rounded-lg text-sm font-bold"
                                    style={{
                                      backgroundColor: isBest
                                        ? row.color + "1A"
                                        : "transparent",
                                      color: isBest
                                        ? row.color
                                        : "var(--foreground)",
                                      border: isBest
                                        ? `1px solid ${row.color}40`
                                        : "1px solid transparent",
                                    }}
                                  >
                                    {row.value(sp)}
                                  </div>
                                );
                              })}
                            </Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
      </div>

      <ProtectionSettingsDialog
        open={protectionOpen}
        onOpenChange={setProtectionOpen}
        value={tournament.protection}
        onSave={(p) => {
          setProtection(tournament.id, p);
          if (p.enabled && p.code) {
            sessionStorage.setItem(unlockKey, p.code);
            setUnlocked(true);
          } else {
            sessionStorage.removeItem(unlockKey);
          }
        }}
      />
    </div>
  );
}

interface JudgesTabProps {
  tournament: Tournament;
  onApproveJudge: (p: PendingJudgeRegistration) => void;
  onRejectJudge: (pendingId: string) => void;
  onToggleJudgeDisabled: (j: Judge) => void;
  onAddJudge: () => void;
  onEditJudge: (j: Judge) => void;
  onDeleteJudge: (id: string) => void;
  onShareRegisterLink: () => void;
  onPublicLink: () => void;
  onImportJudge: () => void;
  onSetJudgesPerRoom: (roundNum: number, n: number) => void;
  onAutoAssign: (roundNum: number) => void;
  onEditAssignment: (roundNum: number, matchId: string) => void;
}

function JudgesTab({
  tournament,
  onApproveJudge,
  onRejectJudge,
  onToggleJudgeDisabled,
  onAddJudge,
  onEditJudge,
  onDeleteJudge,
  onShareRegisterLink,
  onPublicLink,
  onImportJudge,
  onSetJudgesPerRoom,
  onAutoAssign,
  onEditAssignment,
}: JudgesTabProps) {
  const judges = tournament.judges ?? [];
  const teamMap = new Map(tournament.teams.map((t) => [t.id, t.name]));
  const judgeMap = new Map(judges.map((j) => [j.id, j]));
  return (
    <div className="space-y-4" dir="rtl">
      <JudgeRequestsPanel
        pending={tournament.pendingJudges ?? []}
        judges={judges}
        onApprove={onApproveJudge}
        onReject={onRejectJudge}
        onToggleDisabled={onToggleJudgeDisabled}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onAddJudge}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border"
          style={{
            backgroundColor: CYAN + "1f",
            borderColor: CYAN + "66",
            color: CYAN,
          }}
          data-testid="button-add-judge"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-semibold">إضافة محكم</span>
        </button>
        <button
          onClick={onImportJudge}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border"
          style={{
            backgroundColor: PURPLE + "1f",
            borderColor: PURPLE + "66",
            color: PURPLE,
          }}
          data-testid="button-paste-judge-code"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-semibold">لصق رمز محكم</span>
        </button>
        <button
          onClick={onShareRegisterLink}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border"
          style={{
            backgroundColor: PURPLE + "1f",
            borderColor: PURPLE + "66",
            color: PURPLE,
          }}
          data-testid="button-share-judge-register"
        >
          <LinkIcon className="w-4 h-4" />
          <span className="text-sm font-semibold">رابط تسجيل المحكمين</span>
        </button>
        <button
          onClick={onPublicLink}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border"
          style={{
            backgroundColor: GOLD + "1f",
            borderColor: GOLD + "66",
            color: GOLD,
          }}
          data-testid="button-public-judges"
        >
          <LinkIcon className="w-4 h-4" />
          <span className="text-sm font-semibold">صفحة عامة</span>
        </button>
      </div>

      {judges.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">لا يوجد محكمون</p>
        </div>
      ) : (
        <div className="space-y-2">
          {judges.filter((j) => !j.disabled).map((j) => (
            <div
              key={j.id}
              className="bg-card rounded-xl p-3 shadow-sm flex items-start gap-3"
              data-testid={`row-judge-${j.id}`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  backgroundColor: j.canChair ? GOLD + "33" : CYAN + "33",
                  color: j.canChair ? GOLD : CYAN,
                }}
              >
                {j.canChair ? <Crown className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{j.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {[j.institution, j.experience].filter(Boolean).join(" • ")}
                </div>
                {j.conflictTeamIds.length > 0 && (
                  <div className="text-[11px] text-destructive mt-1">
                    تعارض:{" "}
                    {j.conflictTeamIds
                      .map((id) => teamMap.get(id))
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => onEditJudge(j)}
                  className="p-1.5 rounded-lg hover:bg-muted"
                  data-testid={`button-edit-judge-${j.id}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onToggleJudgeDisabled(j)}
                  className="px-2 py-1 rounded-lg hover:bg-muted text-[11.5px] font-bold"
                  data-testid={`button-disable-judge-${j.id}`}
                >
                  تعطيل
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`حذف المحكم ${j.name}?`)) {
                      onDeleteJudge(j.id);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-muted text-destructive"
                  data-testid={`button-delete-judge-${j.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

interface PendingTabProps {
  tournament: Tournament;
  onApproveTeam: (p: PendingTeamRegistration) => void;
  onRejectTeam: (id: string) => void;
  onApproveJudge: (p: PendingJudgeRegistration) => void;
  onRejectJudge: (id: string) => void;
  onApproveResult: (p: PendingMatchResult) => void;
  onRejectResult: (id: string) => void;
}

function PendingTab({
  tournament,
  onApproveTeam,
  onRejectTeam,
  onApproveJudge,
  onRejectJudge,
  onApproveResult,
  onRejectResult,
}: PendingTabProps) {
  const pTeams = tournament.pendingTeams ?? [];
  const pJudges = tournament.pendingJudges ?? [];
  const pResults = tournament.pendingResults ?? [];
  const total = pTeams.length + pJudges.length + pResults.length;

  if (total === 0) {
    return (
      <div className="text-center py-16" dir="rtl">
        <Inbox className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">لا توجد طلبات معلقة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {pTeams.length > 0 && (
        <section>
          <h3 className="font-bold text-sm mb-2">
            طلبات تسجيل الفرق ({pTeams.length})
          </h3>
          <div className="space-y-2">
            {pTeams.map((p) => (
              <div
                key={p.id}
                className="bg-card rounded-xl p-3 shadow-sm"
                data-testid={`pending-team-${p.id}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{p.teamName}</div>
                    {p.institution && (
                      <div className="text-xs text-muted-foreground">
                        {p.institution}
                      </div>
                    )}
                    <div className="text-xs mt-1">
                      {p.speakerNames.filter(Boolean).join("، ")}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onApproveTeam(p)}
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: SUCCESS + "1f", color: SUCCESS }}
                      data-testid={`button-approve-team-${p.id}`}
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRejectTeam(p.id)}
                      className="p-1.5 rounded-lg text-destructive bg-destructive/10"
                      data-testid={`button-reject-team-${p.id}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pJudges.length > 0 && (
        <section>
          <h3 className="font-bold text-sm mb-2">
            طلبات تسجيل المحكمين ({pJudges.length})
          </h3>
          <div className="space-y-2">
            {pJudges.map((p) => (
              <div
                key={p.id}
                className="bg-card rounded-xl p-3 shadow-sm"
                data-testid={`pending-judge-${p.id}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-1">
                      {p.canChair && (
                        <Crown className="w-3.5 h-3.5" style={{ color: GOLD }} />
                      )}
                      {p.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {[p.institution, p.experience].filter(Boolean).join(" • ")}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onApproveJudge(p)}
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: SUCCESS + "1f", color: SUCCESS }}
                      data-testid={`button-approve-judge-${p.id}`}
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRejectJudge(p.id)}
                      className="p-1.5 rounded-lg text-destructive bg-destructive/10"
                      data-testid={`button-reject-judge-${p.id}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pResults.length > 0 && (
        <section>
          <h3 className="font-bold text-sm mb-2">
            نتائج محكمين معلقة ({pResults.length})
          </h3>
          <div className="space-y-2">
            {pResults.map((p) => {
              const govTotal =
                p.govSpeakers.reduce((s, x) => s + x.score, 0) +
                (p.govReplyScore || 0);
              const oppTotal =
                p.oppSpeakers.reduce((s, x) => s + x.score, 0) +
                (p.oppReplyScore || 0);
              return (
                <div
                  key={p.id}
                  className="bg-card rounded-xl p-3 shadow-sm"
                  data-testid={`pending-result-${p.id}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">
                        الجولة {p.roundNumber}
                        {p.roomNumber ? ` • القاعة ${p.roomNumber}` : ""}
                      </div>
                      <div className="text-xs mt-0.5">
                        <span style={{ color: CYAN }}>
                          {p.govTeamName}: {govTotal}
                        </span>
                        {" — "}
                        <span style={{ color: PURPLE }}>
                          {p.oppTeamName}: {oppTotal}
                        </span>
                      </div>
                      {p.judgeName && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          المحكم: {p.judgeName}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onApproveResult(p)}
                        className="p-1.5 rounded-lg"
                        style={{
                          backgroundColor: SUCCESS + "1f",
                          color: SUCCESS,
                        }}
                        data-testid={`button-approve-result-${p.id}`}
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRejectResult(p.id)}
                        className="p-1.5 rounded-lg text-destructive bg-destructive/10"
                        data-testid={`button-reject-result-${p.id}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
