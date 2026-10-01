import { useEffect, useState } from "react";
import { ArchiveRestore, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTournament } from "@/context/TournamentContext";
import { readTrash, removeFromTrash, type TrashItem } from "@/lib/trash";
import { BRAND } from "@/lib/brand";

/** Lists deleted tournaments; each can be restored or removed for good (with confirmation). */
export default function DeletedTournamentsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { restoreTournament } = useTournament();
  const [items, setItems] = useState<TrashItem[]>([]);
  useEffect(() => { if (open) setItems(readTrash()); }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg text-right">
        <DialogHeader>
          <DialogTitle className="text-right">البطولات المحذوفة</DialogTitle>
          <DialogDescription className="text-right">يمكنك استعادة أي بطولة حُذفت لتعود إلى القائمة كما كانت.</DialogDescription>
        </DialogHeader>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm" style={{ color: `${BRAND.ink}8c` }}>لا توجد بطولات محذوفة</p>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto space-y-2">
            {items.map(({ tournament: t, deletedAt }) => (
              <li key={t.id} className="flex items-center gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: BRAND.border }}>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate" style={{ color: BRAND.ink }}>{t.name}</div>
                  <div className="text-[11px]" style={{ color: `${BRAND.ink}8c` }}>
                    حُذفت {new Date(deletedAt).toLocaleString("ar-OM", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
                <button onClick={() => { restoreTournament(t); setItems(readTrash()); }}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-bold text-white"
                  style={{ background: BRAND.purple }} data-testid={`button-restore-${t.id}`}>
                  <ArchiveRestore className="w-3.5 h-3.5" /> استعادة
                </button>
                <button title="حذف نهائي"
                  onClick={() => { if (confirm(`حذف «${t.name}» نهائياً؟ لا يمكن التراجع.`)) { removeFromTrash(t.id); setItems(readTrash()); } }}
                  className="rounded-lg p-1.5 hover:bg-red-50 text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
