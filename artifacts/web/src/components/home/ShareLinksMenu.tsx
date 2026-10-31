import { ClipboardList, Eye, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BTN, BTN_SIZE } from "@/lib/brand";

interface Props {
  onPublicLink: () => void;
  onAdminLink: () => void;
}

/** Three-dot menu holding the platform's shareable links. */
export default function ShareLinksMenu({ onPublicLink, onAdminLink }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md}`}
          aria-label="روابط المنصة"
          title="روابط المنصة"
          data-testid="button-share-links-menu"
        >
          <MoreVertical className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 text-right" dir="rtl">
        <DropdownMenuLabel>روابط المنصة</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onPublicLink} data-testid="button-public-mode-link">
          <Eye className="w-4 h-4 ml-2" />
          رابط وضع الجمهور
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAdminLink} data-testid="button-admin-mode-link">
          <ClipboardList className="w-4 h-4 ml-2" />
          رابط رصد الدرجات
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
