import { ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_META, useRole, type Role } from "@/context/RoleContext";
import { BRAND, BTN } from "@/lib/brand";

/** Lets the operator switch the active role — the UI adapts to its permissions. */
export default function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`${BTN.base} ${BTN.secondary} shrink-0 h-10 px-3.5`}
          data-testid="button-role-switcher"
        >
          <ShieldCheck className="w-4 h-4" style={{ color: BRAND.purple }} />
          {ROLE_META[role].label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>الدور الحالي</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(ROLE_META) as Role[]).map((key) => (
          <DropdownMenuItem
            key={key}
            onClick={() => setRole(key)}
            className="flex-col items-start gap-0.5"
            data-testid={`role-${key}`}
          >
            <span
              className="text-[13px] font-bold"
              style={{ color: key === role ? BRAND.purple : BRAND.ink }}
            >
              {ROLE_META[key].label}
              {key === role ? " ✓" : ""}
            </span>
            <span className="text-[11px]" style={{ color: `${BRAND.ink}8c` }}>
              {ROLE_META[key].hint}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
