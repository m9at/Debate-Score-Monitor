import {
  Archive,
  ArchiveRestore,
  FolderInput,
  LogIn,
  MoreVertical,
  Pencil,
  Settings,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BRAND } from "@/lib/brand";

interface Props {
  archived?: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onMoveToFolder: () => void;
  onToggleArchive: () => void;
  onSettings: () => void;
  onDelete: () => void;
}

/**
 * The card's management menu. Everyday actions stay on the card; the sensitive
 * ones (archive, move, delete) live here so they can't be hit by accident.
 */
export default function TournamentCardMenu({
  archived,
  onOpen,
  onEdit,
  onMoveToFolder,
  onToggleArchive,
  onSettings,
  onDelete,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          aria-label="إدارة البطولة"
          title="إدارة البطولة"
          data-testid="button-card-menu"
        >
          <MoreVertical className="w-5 h-5" style={{ color: BRAND.ink }} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 text-right">
        <DropdownMenuLabel>إدارة البطولة</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpen} data-testid="menu-open-tournament">
          <LogIn className="w-4 h-4" />
          فتح البطولة
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit} data-testid="menu-edit-tournament">
          <Pencil className="w-4 h-4" />
          تعديل البطولة
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSettings} data-testid="menu-tournament-settings">
          <Settings className="w-4 h-4" />
          إعدادات البطولة
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMoveToFolder} data-testid="menu-move-folder">
          <FolderInput className="w-4 h-4" />
          نقل إلى مجلد
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleArchive} data-testid="menu-archive">
          {archived ? (
            <ArchiveRestore className="w-4 h-4" />
          ) : (
            <Archive className="w-4 h-4" />
          )}
          {archived ? "استعادة من الأرشيف" : "أرشفة البطولة"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
          data-testid="menu-delete-tournament"
        >
          <Trash2 className="w-4 h-4" />
          حذف البطولة
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
