import { useState } from "react";
import { useLocation } from "wouter";
import { addLocal, buildInfo, createLeader, listLocal, removeLocal } from "@/lib/leaderApi";

/** List + create leadership debate tournaments (مناظرة قيادية). */
export default function LeaderHomePage() {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState(listLocal());
  const [name, setName] = useState("");
  const [days, setDays] = useState(2);
  const [rooms, setRooms] = useState(8);
  const [min, setMin] = useState(59);
  const [max, setMax] = useState(82);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const valid = name.trim().length > 1 && days >= 1 && rooms >= 1 && max > min;

  const create = async () => {
    if (!valid) return;
    setBusy(true); setErr("");
    try {
      const id = await createLeader(buildInfo(name.trim(), days, rooms, min, max));
      addLocal({ id, name: name.trim(), createdAt: Date.now() });
      setLocation(`/leader/${id}`);
    } catch {
      setErr("تعذّر إنشاء البطولة — حاول مرة أخرى");
      setBusy(false);
    }
  };

  const num = (v: number, set: (n: number) => void, label: string) => (
    <label className="block">
      <span className="text-sm font-bold text-gray-600">{label}</span>
      <input type="number" value={v} onChange={(e) => set(parseInt(e.target.value) || 0)}
        className="mt-1 w-full rounded-lg border px-3 py-2" />
    </label>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold" style={{ color: "#7B2D8E" }}>المناظرة القيادية</h1>
          <button onClick={() => setLocation("/")} className="text-sm text-gray-500">← الرئيسية</button>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-lg">بطولة قيادية جديدة</h2>
          <label className="block">
            <span className="text-sm font-bold text-gray-600">اسم البطولة</span>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2" data-testid="input-leader-name" />
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {num(days, setDays, "عدد الأيام")}
            {num(rooms, setRooms, "القاعات لكل يوم")}
            {num(min, setMin, "أدنى درجة")}
            {num(max, setMax, "أعلى درجة")}
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button onClick={create} disabled={!valid || busy}
            className="rounded-lg px-5 py-2 font-bold text-white disabled:opacity-50"
            style={{ background: "#7B2D8E" }} data-testid="button-create-leader">
            {busy ? "جارٍ الإنشاء…" : "إنشاء البطولة"}
          </button>
        </div>

        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              <button onClick={() => setLocation(`/leader/${i.id}`)} className="font-bold text-right">{i.name}</button>
              <button onClick={() => { if (confirm("إزالة من القائمة؟")) { removeLocal(i.id); setItems(listLocal()); } }}
                className="text-xs text-red-500">إزالة</button>
            </div>
          ))}
          {!items.length && <p className="text-center text-sm text-gray-400">لا توجد بطولات قيادية بعد</p>}
        </div>
      </div>
    </div>
  );
}
