import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { BRAND, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";
import { Panel, inputClass, inputStyle } from "@/components/wizard/ui";
import { ActionsMenu } from "./ui";

/** Registry of names (debaters or judges): add, rename, delete (with confirmation). */
export default function NamePool({ noun, placeholder, names, assigned, onAdd, onRename, onRemove }: {
  /** Singular noun for texts, e.g. "المتناظر". */
  noun: string;
  placeholder: string;
  names: string[];
  /** Optional "where is this person placed" text per index. */
  assigned?: (index: number) => string | undefined;
  onAdd: (name: string) => void;
  onRename: (index: number, name: string) => void;
  onRemove: (index: number) => void;
}) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ i: number; v: string } | null>(null);
  const exists = (v: string, except?: number) => names.some((n, i) => n === v && i !== except);

  const add = () => {
    const v = name.trim();
    if (!v) return;
    if (exists(v)) { alert("هذا الاسم مسجّل بالفعل"); return; }
    onAdd(v);
    setName("");
  };
  const commit = () => {
    if (!editing) return;
    const v = editing.v.trim();
    if (!v || exists(v, editing.i)) return;
    onRename(editing.i, v);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <Panel title={`تسجيل ${noun}`} hint="اكتب الاسم ثم اضغط إضافة أو Enter">
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }} className={inputClass} style={inputStyle} />
          <button onClick={add} disabled={!name.trim()} className={`${BTN.base} ${BTN.primary} h-11 px-5`} style={BTN_PRIMARY_STYLE}>
            <Plus className="w-4 h-4" /> إضافة
          </button>
        </div>
      </Panel>

      <Panel title={`القائمة (${names.length})`}>
        {names.length === 0 ? (
          <p className="py-8 text-center text-[13px]" style={{ color: `${BRAND.ink}66` }}>لا يوجد أحد مسجّل بعد</p>
        ) : (
          <div className="divide-y rounded-xl border" style={{ borderColor: BRAND.border }}>
            {names.map((n, i) => (
              <div key={n} className="flex items-center gap-3 px-3 py-2.5 text-[14px]" style={{ color: BRAND.ink }}>
                <span className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold"
                  style={{ background: `${BRAND.purple}10`, color: BRAND.purple }}>{i + 1}</span>
                {editing?.i === i ? (
                  <>
                    <input autoFocus value={editing.v} onChange={(e) => setEditing({ i, v: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(null); }}
                      className={`${inputClass} h-9`} style={inputStyle} />
                    <button onClick={commit} className="p-1" style={{ color: BRAND.purple }}><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditing(null)} className="p-1" style={{ color: `${BRAND.ink}80` }}><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{n}</span>
                    {assigned?.(i) && (
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${BRAND.blue}14`, color: BRAND.blueDeep }}>
                        {assigned(i)}
                      </span>
                    )}
                    <ActionsMenu actions={[
                      { label: "تعديل الاسم", icon: <Pencil className="w-4 h-4" />, onClick: () => setEditing({ i, v: n }) },
                      {
                        label: "حذف", icon: <Trash2 className="w-4 h-4" />, onClick: () => onRemove(i),
                        danger: { title: `حذف ${noun}`, description: `سيُحذف «${n}» من القائمة ومن كل القاعات الموزّع عليها.` },
                      },
                    ]} />
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
