import { useRef, useState } from "react";
import { Download, Eye, MoreHorizontal, Trash2, Upload } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TRASH_KEY } from "@/lib/trash";
import DeletedTournamentsDialog from "./DeletedTournamentsDialog";

/** Browser-stored data that belongs in a backup. */
const KEYS = ["debate_tournaments_v2", "debate_groups_v1", TRASH_KEY];
const API = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/backup`;


const download = async () => {
    try {
      const server = await fetch(API).then((r) => { if (!r.ok) throw 0; return r.json(); });
      const local = Object.fromEntries(KEYS.map((k) => [k, localStorage.getItem(k)]));
      const blob = new Blob([JSON.stringify({ version: 1, savedAt: new Date().toISOString(), local, server })], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `نسخة-احتياطية-${new Date().toISOString().slice(0, 16).replace(":", "-")}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { alert("تعذّر تنزيل النسخة الاحتياطية — حاول مرة أخرى"); }
  };

const restore = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (data?.version !== 1) throw 0;
      if (!confirm("استعادة هذه النسخة الاحتياطية؟ ستُستبدل البطولات الحالية في هذا المتصفح بما في الملف.")) return;
      const r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data.server ?? {}) });
      if (!r.ok) throw 0;
      for (const k of KEYS) if (data.local?.[k] != null) localStorage.setItem(k, data.local[k]);
      window.location.reload();
    } catch { alert("الملف غير صالح أو تعذّرت الاستعادة"); }
  };

/** The home header's ⋮ menu: audience link, backup/restore and deleted tournaments. */
export default function HomeMoreMenu({ onPublicLink }: { onPublicLink: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label="المزيد" title="المزيد" data-testid="button-home-menu"
            className="h-9 w-9 grid place-items-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 text-right">
          <DropdownMenuItem onClick={onPublicLink} data-testid="button-public-mode-link">
            <Eye className="w-4 h-4" /> رابط وضع الجمهور
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void download()} data-testid="button-backup">
            <Download className="w-4 h-4" /> تنزيل نسخة احتياطية
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileRef.current?.click()} data-testid="button-restore">
            <Upload className="w-4 h-4" /> استعادة نسخة احتياطية
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTrashOpen(true)} data-testid="button-trash">
            <Trash2 className="w-4 h-4" /> البطولات المحذوفة
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input ref={fileRef} type="file" accept=".json,application/json" hidden
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void restore(f); }} />
      <DeletedTournamentsDialog open={trashOpen} onOpenChange={setTrashOpen} />
    </>
  );
}
