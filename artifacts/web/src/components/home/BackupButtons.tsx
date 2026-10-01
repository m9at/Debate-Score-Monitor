import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { BTN, BTN_SIZE } from "@/lib/brand";

/** Browser-stored data that belongs in a backup. */
const KEYS = ["debate_tournaments_v2", "debate_groups_v1"];
const API = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/backup`;

/** Download / restore a full backup file (browser tournaments + server data). */
export default function BackupButtons() {
  const fileRef = useRef<HTMLInputElement>(null);

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

  return (
    <>
      <button onClick={() => void download()} className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md}`} data-testid="button-backup">
        <Download className="w-4 h-4" strokeWidth={2.5} /> نسخة احتياطية
      </button>
      <button onClick={() => fileRef.current?.click()} className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md}`} data-testid="button-restore">
        <Upload className="w-4 h-4" strokeWidth={2.5} /> استعادة
      </button>
      <input ref={fileRef} type="file" accept=".json,application/json" hidden
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void restore(f); }} />
    </>
  );
}
