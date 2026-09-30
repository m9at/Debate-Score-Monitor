import { useState } from "react";
import { FileDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BRAND, BTN } from "@/lib/brand";
import { exportLeaderPdf } from "@/lib/leaderPdf";
import type { LeaderTournament } from "@/lib/leaderApi";

/** "Download results" menu: current round, all rounds, one room, everything. */
export default function PdfMenu({ t, day }: { t: LeaderTournament; day?: number }) {
  const [pickRoom, setPickRoom] = useState(false);
  const cur = day ?? t.info.days[0]?.day;
  return (
    <>
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger asChild>
          <button className={`${BTN.base} ${BTN.secondary}`}><FileDown className="h-4 w-4" /> تحميل النتائج PDF</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {cur && <DropdownMenuItem onClick={() => exportLeaderPdf(t, { kind: "round", day: cur })}>PDF الجولة {cur}</DropdownMenuItem>}
          <DropdownMenuItem onClick={() => exportLeaderPdf(t, { kind: "rounds" })}>PDF جميع الجولات</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPickRoom(true)}>PDF قاعة محددة…</DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportLeaderPdf(t, { kind: "all" })}>PDF جميع النتائج (مع المجموع)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={pickRoom} onOpenChange={setPickRoom}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle className="text-right">اختر القاعة</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {t.info.days.map((d) => (
              <div key={d.day}>
                <div className="mb-1 text-[12px] font-bold" style={{ color: BRAND.purple }}>الجولة {d.day}</div>
                <div className="grid grid-cols-2 gap-2">
                  {d.rooms.map((r) => (
                    <button key={r.id} onClick={() => { exportLeaderPdf(t, { kind: "room", day: d.day, roomId: r.id }); setPickRoom(false); }}
                      className="rounded-lg border px-3 py-2 text-right text-[13px] font-bold hover:bg-black/5" style={{ borderColor: BRAND.border }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
