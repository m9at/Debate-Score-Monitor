import { useState } from "react";
import { Plus, X } from "lucide-react";
import { BRAND, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";
import { Panel, inputClass, inputStyle } from "@/components/wizard/ui";

/** Registry of names (debaters or judges) that rooms are filled from. */
export default function NamePool({ title, icon, placeholder, names, onAdd, onRemove }: {
  title: string;
  icon: React.ReactNode;
  placeholder: string;
  names: string[];
  onAdd: (name: string) => void;
  onRemove: (index: number) => void;
}) {
  const [name, setName] = useState("");
  const add = () => {
    const v = name.trim();
    if (!v) return;
    if (names.includes(v)) { alert("هذا الاسم مضاف بالفعل"); return; }
    onAdd(v);
    setName("");
  };
  return (
    <Panel>
      <div className="mb-3 flex items-center gap-2 font-bold text-[15px]" style={{ color: BRAND.ink }}>
        <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={BTN_PRIMARY_STYLE}>{icon}</span>
        {title}
        <span className="mr-auto rounded-full px-2 text-[12px]" style={{ background: `${BRAND.purple}10`, color: BRAND.purple }}>{names.length}</span>
      </div>
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }} className={inputClass} style={inputStyle} />
        <button onClick={add} disabled={!name.trim()} className={`${BTN.base} ${BTN.primary} h-11`} style={BTN_PRIMARY_STYLE}>
          <Plus className="w-4 h-4" /> إضافة
        </button>
      </div>
      <div className="mt-3 divide-y rounded-xl border" style={{ borderColor: BRAND.border }}>
        {names.length === 0 && <p className="p-4 text-center text-[13px]" style={{ color: `${BRAND.ink}66` }}>لا توجد أسماء بعد</p>}
        {names.map((n, i) => (
          <div key={n} className="flex items-center gap-2 px-3 py-2 text-[14px]" style={{ color: BRAND.ink }}>
            <span className="w-6 text-[12px] font-bold" style={{ color: `${BRAND.ink}66` }}>{i + 1}</span>
            <span className="flex-1 font-medium">{n}</span>
            <button onClick={() => onRemove(i)} className="rounded-md p-1 hover:bg-black/5" style={{ color: `${BRAND.ink}80` }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}
