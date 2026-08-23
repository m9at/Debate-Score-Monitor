import { useState } from "react";
import { FolderInput, FolderPlus, Check, Inbox } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { TournamentGroup } from "@/types/tournament";
import { BRAND, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentName: string;
  /** Folder the tournament sits in now, or null when it is in the active list. */
  currentGroupId: string | null;
  groups: TournamentGroup[];
  onMove: (groupId: string | null) => void;
  onCreateFolder: (name: string) => string;
}

/** Picks the folder a tournament belongs to, with inline folder creation. */
export default function MoveToFolderDialog({
  open,
  onOpenChange,
  tournamentName,
  currentGroupId,
  groups,
  onMove,
  onCreateFolder,
}: Props) {
  const [newName, setNewName] = useState("");

  const choose = (groupId: string | null) => {
    onMove(groupId);
    onOpenChange(false);
  };

  const createAndMove = () => {
    const name = newName.trim();
    if (!name) return;
    const id = onCreateFolder(name);
    setNewName("");
    choose(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderInput className="w-5 h-5" style={{ color: BRAND.purple }} />
            نقل «{tournamentName}» إلى مجلد
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-2 max-h-[46vh] overflow-y-auto">
          <button
            onClick={() => choose(null)}
            className="w-full flex items-center gap-2.5 p-3 rounded-xl border text-right
                       transition-colors hover:bg-[#7B2D8E]/[0.04]"
            style={{
              borderColor: currentGroupId === null ? BRAND.purple : BRAND.border,
            }}
            data-testid="option-folder-none"
          >
            <Inbox className="w-4 h-4 shrink-0" style={{ color: BRAND.blue }} />
            <span
              className="flex-1 font-bold text-[14px]"
              style={{ color: BRAND.ink }}
            >
              البطولات الحالية (بدون مجلد)
            </span>
            {currentGroupId === null && (
              <Check className="w-4 h-4" style={{ color: BRAND.purple }} />
            )}
          </button>

          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => choose(g.id)}
              className="w-full flex items-center gap-2.5 p-3 rounded-xl border text-right
                         transition-colors hover:bg-[#7B2D8E]/[0.04]"
              style={{
                borderColor:
                  currentGroupId === g.id ? BRAND.purple : BRAND.border,
              }}
              data-testid={`option-folder-${g.id}`}
            >
              <FolderInput
                className="w-4 h-4 shrink-0"
                style={{
                  color: g.kind === "archive" ? BRAND.warning : BRAND.purple,
                }}
              />
              <span className="flex-1 min-w-0">
                <span
                  className="block font-bold text-[14px] truncate"
                  style={{ color: BRAND.ink }}
                >
                  {g.name}
                </span>
                <span
                  className="block text-[11px] font-semibold"
                  style={{ color: `${BRAND.ink}80` }}
                >
                  {g.tournamentIds.length} بطولة
                  {g.kind === "archive" ? " · مجلد أرشيف" : ""}
                </span>
              </span>
              {currentGroupId === g.id && (
                <Check className="w-4 h-4" style={{ color: BRAND.purple }} />
              )}
            </button>
          ))}
        </div>

        <div
          className="mt-1 pt-3 border-t flex items-center gap-2"
          style={{ borderColor: BRAND.border }}
        >
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createAndMove()}
            placeholder="اسم مجلد جديد"
            data-testid="input-new-folder-inline"
          />
          <button
            onClick={createAndMove}
            disabled={!newName.trim()}
            className={`${BTN.base} ${BTN.primary} h-10 shrink-0`}
            style={BTN_PRIMARY_STYLE}
            data-testid="button-create-folder-inline"
          >
            <FolderPlus className="w-4 h-4" />
            إنشاء ونقل
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
